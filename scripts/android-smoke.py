"""Real Android UI smoke. Cached bounds, bounded runtime, no engine shortcuts."""
import os, re, sys, subprocess, time, atexit, xml.etree.ElementTree as ET
from pathlib import Path
out = Path('smoke-output'); out.mkdir(exist_ok=True)
package = 'com.phikinhua.episode'
started = time.monotonic()
def adb(*args): return subprocess.check_output(['adb', *args], text=True, timeout=25)
def collect_failure_logs():
    if not (out/'logcat.txt').exists():
        try: (out/'logcat.txt').write_text(adb('logcat','-d'))
        except Exception as e: (out/'logcat-error.txt').write_text(str(e))
atexit.register(collect_failure_logs)
def dump():
    for attempt in range(3):
        adb('shell','rm','-f','/sdcard/window.xml')
        adb('shell', 'uiautomator', 'dump', '/sdcard/window.xml')
        try:
            xml = adb('shell', 'cat', '/sdcard/window.xml')
            root = ET.fromstring(xml)
            (out / 'latest-ui.xml').write_text(xml)
            return root
        except (subprocess.CalledProcessError, ET.ParseError):
            if attempt==2: raise
            time.sleep(.4)
def fields(n): return [n.get('text',''), n.get('content-desc','')]
def find(root, label, contains=False):
    return next((n for n in root.iter('node') if any(label in t if contains else label == t for t in fields(n))), None)
def wait_for(label, contains=False, timeout=40):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        root = dump(); n = find(root, label, contains)
        if n is not None: return n
        time.sleep(.3)
    raise AssertionError('UI not found: ' + label)
def touch(n):
    x1,y1,x2,y2 = map(int, re.findall(r'\d+', n.attrib['bounds']))
    assert x2>x1 and y2>y1, 'Clipped/inverted accessibility bounds: ' + str(fields(n))
    print('TAP', fields(n), n.attrib['bounds'], flush=True)
    adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2)); time.sleep(.6)
def tap(label, contains=False): touch(wait_for(label, contains))
def shot(name):
    root = dump()
    with open(out/(name+'.png'),'wb') as f: subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True,timeout=20)
    (out/(name+'.xml')).write_text(adb('shell','cat','/sdcard/window.xml'))
    print('SCREEN',name,flush=True)
    return root
def labels(root): return [s for n in root.iter('node') for s in fields(n)]
def has(root,label): return find(root,label) is not None
def discard_if_needed(root):
    if not has(root,'เลือกการ์ดที่จะทิ้ง'): return False
    for _ in range(15):
        root=dump()
        confirm=next((n for n in root.iter('node') if any(t.startswith('ยืนยัน (') for t in fields(n)) and n.get('clickable')=='true'),None)
        if confirm is not None and confirm.get('enabled')=='true': touch(confirm); return True
        candidates=[n for n in root.iter('node') if n.get('clickable')=='true' and re.match(r'^\d+,',n.get('content-desc','')) and '✕' not in n.get('content-desc','')]
        if candidates: touch(candidates[0])
        else:
            adb('shell','input','swipe','900','1200','180','1200','400');time.sleep(.5)
    raise AssertionError('Could not complete discard selection')
adb('logcat','-c');adb('shell','am','start','-W','-n',package+'/.MainActivity')
wait_for('เริ่มเกม');shot('01-cover')
tap('เริ่มเกม');shot('02-class-table')
for class_name, hp in [('หมอผี', '50'), ('นักรบวัด', '66'), ('แม่ชี', '44'), ('คนทรง', '46')]:
    tap('เลือก'+class_name)
    wait_for('เลือก'+class_name+' · ออกเดินทาง →')
    root=shot('02-class-'+str(hp))
    assert has(root,hp), 'Class stats not visible: '+class_name
    tap('กลับไปเลือกอาชีพ')
    wait_for('เลือก'+class_name)
tap('เลือกนักรบวัด');shot('02-class');tap('เลือกนักรบวัด · ออกเดินทาง →')
wait_for('คืนแรกที่บ้านร้าง');shot('03-prologue')
tap('ข้ามบทนี้');tap('พรติดตัว 1:',contains=True)
wait_for('ผีปอบ');shot('04-map');tap('ผีปอบ');tap('จับผี')
wait_for('จบเทิร์น');shot('05-battle')
if '--layout-only' in sys.argv:
    cards=[n for n in dump().iter('node') if re.match(r'^การ์ด .+ พลัง \d+$',n.get('content-desc',''))]
    assert cards, 'No hand cards available for layout check'
    touch(cards[0]);wait_for('ใช้การ์ด');shot('06-card-preview')
    tap('ใช้การ์ด');shot('07-after-use')
    logs=adb('logcat','-d');(out/'logcat.txt').write_text(logs)
    assert not re.search(r'FATAL EXCEPTION|Unable to load script|ANR in '+re.escape(package),logs)
    assert adb('shell','pidof',package).strip()
    (out/'result.txt').write_text('PASS: scoped Android layout smoke — cover, character, prologue, map, battle, card preview and use. Physical device not tested.\n')
    print((out/'result.txt').read_text());sys.exit(0)
won=False;played=False
for turn in range(12):
    attempted=set()
    for play in range(14):
        assert time.monotonic()-started<720, 'UI smoke exceeded time budget'
        root=dump()
        if has(root,'ชนะ!'): won=True;break
        assert not has(root,'ของที่เก็บได้'), 'Reward appeared before victory'
        assert not any(t.startswith('เลเวล ') for t in labels(root)), 'Upgrade appeared before victory'
        if discard_if_needed(root): attempted.clear();continue
        candidates=[n for n in root.iter('node') if re.match(r'^การ์ด .+ พลัง \d+$',n.get('content-desc','')) and n.get('content-desc') not in attempted]
        candidates.sort(key=lambda n: 0 if re.search('ฟัน|ปรบ|สวน|เตะ|หมัด',n.get('content-desc','')) else 1)
        if not candidates:break
        n=candidates[0];label=n.get('content-desc');attempted.add(label)
        touch(n);root=dump()
        if not played:shot('06-card-preview')
        use=find(root,'ใช้การ์ด')
        if use is not None:
            touch(use);played=True
        else:
            close=find(root,'ปิด')
            if close is not None:touch(close)
    if won:break
    root=dump()
    if has(root,'ชนะ!'):won=True;break
    assert not has(root,'พ่ายแพ้'),'Smoke player lost'
    if discard_if_needed(root):time.sleep(7);continue
    end=find(root,'จบเทิร์น')
    if end is not None:touch(end)
    time.sleep(7)
    if turn==0:shot('07-next-turn')
assert played,'No card was successfully tapped and used'
assert won,'Fight did not finish'
shot('08-victory-before-rewards');tap('ดำเนินต่อ')
for _ in range(12):
    root=dump()
    skip=find(root,'ข้ามไปก่อน');reward=find(root,'ไม่เอาสักใบ')
    if skip is not None:shot('09-level-up');touch(skip)
    elif reward is not None:shot('10-card-reward');touch(reward)
    else:break
wait_for('ตะเกียงใต้ถุน');shot('11-rest-arrival');tap('ตะเกียงใต้ถุน')
# Record the actual native arrival, including the image before choices appear.
recording = subprocess.Popen(['adb','shell','screenrecord','--time-limit','25','/sdcard/arrival.mp4'])
tap('แวะที่นี่')
for frame, delay in [('arrival-step-1', .1), ('arrival-step-2', .8), ('arrival-settled', 2.5)]:
    time.sleep(delay)
    with open(out/(frame+'.png'),'wb') as f:
        subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True,timeout=20)
# The two pre-choice frames must differ in the scene, not just the clock.
from PIL import Image, ImageChops, ImageStat
a=Image.open(out/'arrival-step-1.png').convert('RGB')
b=Image.open(out/'arrival-step-2.png').convert('RGB')
roi=(0,round(a.height*.1),a.width,round(a.height*.45))
motion=sum(ImageStat.Stat(ImageChops.difference(a.crop(roi),b.crop(roi))).mean)
assert motion>3, 'Scene stayed static during arrival: '+str(motion)
(out/'camera-motion.txt').write_text('Pre-choice image difference: '+str(motion)+'\n')
adb('shell','pkill','-2','screenrecord')
recording.wait(timeout=15)
adb('pull','/sdcard/arrival.mp4',str(out/'arrival.mp4'))
wait_for('นั่งพักข้างตะเกียง',contains=True);shot('12-event-choices');tap('นั่งพักข้างตะเกียง',contains=True)
wait_for('เดินทางต่อ');shot('13-event-result');tap('เดินทางต่อ')
wait_for('กระสือ',contains=True);shot('14-next-location')
logs=adb('logcat','-d');(out/'logcat.txt').write_text(logs)
assert not re.search(r'FATAL EXCEPTION|Unable to load script|ANR in '+re.escape(package),logs),'Native runtime failure'
assert adb('shell','pidof',package).strip(),'App exited'
(out/'result.txt').write_text('PASS: Android API '+adb('shell','getprop','ro.build.version.sdk').strip()+': launch, class, prologue, blessing, map, card preview with valid touch bounds, play, enemy turn, victory before upgrades/card reward, rest and event. Physical device not tested.\n')
print((out/'result.txt').read_text(),flush=True)
