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
    # Battle cards overlap; their centers can belong to the next card.
    x = x1 + min(24, (x2-x1)//4) if n.get('content-desc','').startswith('การ์ด ') else (x1+x2)//2
    adb('shell','input','tap',str(x),str((y1+y2)//2)); time.sleep(.6)
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
if '--helpers-only' not in sys.argv:
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
    tap('ข้ามบทนี้');wait_for('พรติดตัว 1:',contains=True);shot('03-starter-blessing')
    tap('พรติดตัว 1:',contains=True)
    wait_for('ผีปอบ');shot('04-map')
    tap('ข้อมูลผู้เดินทาง');wait_for('ปิดข้อมูลผู้เดินทาง');root=shot('04-player-details')
    assert any(t.startswith('พลังงาน ') for t in labels(root)), 'Energy missing from player details'
    assert any(t.startswith('EXP ') for t in labels(root)), 'EXP missing from player details'
    tap('ปิดข้อมูลผู้เดินทาง');wait_for('ผีปอบ')
    tap('สำรับ ',contains=True);wait_for('สำรับของเรา');shot('04-deck')
    tap('ดูการ์ด ฟันดาบวัด จำนวน 4 ใบ',contains=True);wait_for('รายละเอียดการ์ด');root=shot('04-deck-detail')
    assert has(root,'ฟันดาบวัด'), 'Wrong card detail opened'
    assert any('×4' in t for t in labels(root)), 'Grouped count missing in card detail'
    tap('กลับไปดูสำรับ');wait_for('สำรับของเรา');tap('ปิด');wait_for('ผีปอบ')
    root=dump();assert any('เบี้ย 25' in t for t in labels(root)), 'Currency label missing'
    tap('พร ',contains=True);wait_for('พรติดตัว');shot('04-blessings')
    tap('ดูพร ',contains=True);wait_for('รายละเอียดพร');shot('04-blessing-detail')
    tap('กลับไปดูพร');wait_for('พรติดตัว');tap('ปิด');wait_for('ผีปอบ')
    tap('ผีปอบ');wait_for('เผชิญหน้า →');shot('04-ghost-selected')
    # Switching and clearing selection must not enter battle.
    tap('นางตานี');wait_for('เผชิญหน้า →');tap('นางตานี');wait_for('เลือกผีที่คุณจะเผชิญหน้า')
    assert find(dump(),'เผชิญหน้า →') is None, 'Confirm action remained after deselection'
    tap('ผีปอบ');tap('เผชิญหน้า →')
    wait_for('จบเทิร์น');shot('05-battle')
    # Closing a fight must pause, never return to the next map node.
    before=dump(); hand_before=sorted(t for t in labels(before) if t.startswith('การ์ด ') and ' พลัง ' in t)
    tap('พักการต่อสู้');wait_for('สู้ต่อ');shot('05-pause')
    assert find(dump(),'เดินทางต่อ') is None, 'Pause exposed a map progression control'
    tap('ตั้งค่า');wait_for('ลดการเคลื่อนไหวของฉาก');tap('กลับ');tap('สู้ต่อ')
    wait_for('จบเทิร์น');assert has(dump(),'30/30'), 'Pause changed enemy HP'
    tap('ดูกองการ์ด');wait_for('ปิดกองการ์ด');root=shot('05-piles')
    pile_cards=[n for n in root.iter('node') if n.get('content-desc','').startswith('ดูการ์ด ')]
    assert pile_cards, 'Battle piles do not contain illustrated tappable cards'
    touch(pile_cards[0]);wait_for('กลับไปดูกองการ์ด');shot('05-pile-detail');tap('กลับไปดูกองการ์ด');tap('ปิดกองการ์ด')
    tap('พักการต่อสู้');tap('กลับเมนูหลัก');wait_for('เล่นต่อ',contains=True);shot('05-suspended-menu')
    adb('shell','am','force-stop',package);adb('shell','am','start','-W','-n',package+'/.MainActivity')
    wait_for('เล่นต่อ',contains=True);tap('เล่นต่อ',contains=True);wait_for('จบเทิร์น');root=shot('05-restored-battle')
    assert has(root,'30/30'), 'Restored battle changed enemy HP'
    assert sorted(t for t in labels(root) if t.startswith('การ์ด ') and ' พลัง ' in t)==hand_before, 'Restored battle changed the hand'
    adb('shell','input','keyevent','4');wait_for('สู้ต่อ');tap('สู้ต่อ');wait_for('จบเทิร์น')

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
            if has(root,'ปราบสำเร็จ'): won=True;break
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
                touch(use);played=True;attempted.clear()
            else:
                close=find(root,'ปิด')
                if close is not None:touch(close)
        if won:break
        root=dump()
        if has(root,'ปราบสำเร็จ'):won=True;break
        assert not has(root,'พ่ายแพ้'),'Smoke player lost'
        if discard_if_needed(root):time.sleep(7);continue
        end=find(root,'จบเทิร์น')
        enemy_recording=None
        if end is not None:
            if turn==0:enemy_recording=subprocess.Popen(['adb','shell','screenrecord','--time-limit','12','/sdcard/enemy-turn.mp4'])
            touch(end)
            time.sleep(.5)
            if turn==0:shot('07-enemy-card')
        for _ in range(30):
            root=dump()
            if has(root,'จบเทิร์น') or has(root,'ปราบสำเร็จ') or has(root,'พ่ายแพ้'):break
            time.sleep(.5)
        if enemy_recording is not None:
            adb('shell','pkill','-2','screenrecord');enemy_recording.wait(timeout=15)
            adb('pull','/sdcard/enemy-turn.mp4',str(out/'enemy-turn.mp4'))
        if turn==0:shot('07-next-turn')
    assert played,'No card was successfully tapped and used'
    assert won,'Fight did not finish'
    shot('08-victory-before-rewards');tap('ดำเนินต่อ')
    for _ in range(12):
        root=dump()
        skip=find(root,'ข้ามไปก่อน');reward=find(root,'ไม่เอาสักใบ')
        if skip is not None:
            shot('09-level-up')
            option=next((n for n in root.iter('node') if n.get('clickable')=='true' and any('พลังชีวิต' in t or 'ช่องเครื่องราง' in t or 'พลังงาน' in t for t in fields(n))),None)
            if option is not None:
                touch(option);wait_for('เลือกไว้แล้ว',contains=True);shot('09-level-up-selected')
            touch(wait_for('ข้ามไปก่อน'))
        elif reward is not None:
            shot('10-card-reward')
            cards=[n for n in root.iter('node') if re.match(r'^การ์ด .+ พลัง \d+$',n.get('content-desc',''))]
            assert cards, 'Reward lacks illustrated selectable cards'
            touch(cards[0]);wait_for('รับ ',contains=True);shot('10-card-reward-preview')
            touch(wait_for('ไม่เอาสักใบ'))
        else:break
    wait_for('ตะเกียงใต้ถุน');root=shot('11-rest-arrival')
    assert not has(root,'แวะที่นี่'), 'Rest still requires an intermediate enter button'
    assert has(root,'เดินผ่าน'), 'Rest lacks its single proceed action'
    # Record the actual native arrival, including the image before choices appear.
    recording = subprocess.Popen(['adb','shell','screenrecord','--time-limit','25','/sdcard/arrival.mp4'])
    tap('ตะเกียงใต้ถุน')
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
    wait_for('เดินทางต่อ');root=shot('13-event-result')
    assert not has(root,'นั่งพักข้างตะเกียง',contains=True), 'Event choices remain under the result'
    tap('เดินทางต่อ')
    wait_for('กระสือ',contains=True);shot('14-next-location')
# Fresh real medium run validates summon art and an actual helper attack.
adb('shell','am','force-stop',package);adb('shell','pm','clear',package)
adb('shell','am','start','-W','-n',package+'/.MainActivity')
wait_for('เริ่มเกม');tap('เริ่มเกม');tap('เลือกคนทรง');tap('เลือกคนทรง · ออกเดินทาง →')
wait_for('ข้ามบทนี้');tap('ข้ามบทนี้');wait_for('พรติดตัว 1:',contains=True);tap('พรติดตัว 1:',contains=True)
wait_for('ผีปอบ');tap('ผีปอบ');tap('เผชิญหน้า →');wait_for('จบเทิร์น')
root=wait_for('วิญญาณเพื่อน เหลือ 3 เทิร์น');shot('15-helper-summoned')
tap('วิญญาณเพื่อน เหลือ 3 เทิร์น');root=shot('16-helper-details')
assert find(root,'โจมตีด้วยพลังวิญญาณทะลุการป้องกัน',contains=True) is not None, 'Helper real effect missing'
tap('ปิดรายละเอียดมินเนี่ยน');tap('จบเทิร์น')
for _ in range(40):
    root=dump()
    if has(root,'จบเทิร์น'):break
    time.sleep(.5)
wait_for('วิญญาณเพื่อน เหลือ 2 เทิร์น');root=shot('17-helper-after-action')
assert has(root,'26/30'), 'Helper attack did not remove real enemy HP'
logs=adb('logcat','-d');(out/'logcat.txt').write_text(logs)
assert not re.search(r'FATAL EXCEPTION|Unable to load script|ANR in '+re.escape(package),logs),'Native runtime failure'
assert adb('shell','pidof',package).strip(),'App exited'
(out/'result.txt').write_text('PASS: Android API '+adb('shell','getprop','ro.build.version.sdk').strip()+': launch, class, prologue, compact blessing, in-scene ghost selection/switch/deselect, map route, player details, mat deck/card details and blessings links, card preview with valid touch bounds, play, enemy turn, victory before upgrades/card reward, rest and event, medium summon/details/real helper attack. Physical device not tested.\n')
if '--helpers-only' in sys.argv:
    (out/'result.txt').write_text('PASS: Android API '+adb('shell','getprop','ro.build.version.sdk').strip()+': real medium summon, readable live helper details, duration 3 to 2 and actual enemy HP 30 to 26. Physical device not tested.\n')
print((out/'result.txt').read_text(),flush=True)
