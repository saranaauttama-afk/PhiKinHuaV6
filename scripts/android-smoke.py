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
def has(root,label,contains=False): return find(root,label,contains) is not None
def discard_if_needed(root):
    if not has(root,'เลือกการ์ดที่จะทิ้ง'): return False
    for _ in range(15):
        root=dump()
        confirm=next((n for n in root.iter('node') if any(t.startswith('ยืนยัน (') or re.match(r'^ทิ้ง \d+/\d+ ใบ$',t) for t in fields(n)) and n.get('clickable')=='true'),None)
        if confirm is not None and confirm.get('enabled')=='true': touch(confirm); return True
        heading=find(root,'เลือกการ์ดที่จะทิ้ง')
        top=int(re.findall(r'\d+',heading.get('bounds'))[3]) if heading is not None else 0
        bottom=int(re.findall(r'\d+',confirm.get('bounds'))[1]) if confirm is not None else 0
        def discard_candidate(n):
            if n.get('clickable')!='true' or n.get('enabled')!='true' or n.get('selected')=='true': return False
            desc=n.get('content-desc','')
            if re.match(r'^\d+,',desc): return '✕' not in desc
            bounds=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
            return bool(desc) and len(bounds)==4 and top<bounds[1]<bounds[3]<=bottom
        candidates=[n for n in root.iter('node') if discard_candidate(n)]
        if candidates: touch(candidates[0])
        else:
            adb('shell','input','swipe','900','1200','180','1200','400');time.sleep(.5)
    raise AssertionError('Could not complete discard selection')
if '--helpers-only' not in sys.argv:
    adb('logcat','-c');adb('shell','am','start','-W','-n',package+'/.MainActivity')
    wait_for('เริ่มเกม');shot('01-cover')
    tap('เริ่มเกม');shot('02-class-table')
    for class_name, hp in [('หมอผี', '50'), ('นักรบวัด', '66'), ('แม่ชี', '50'), ('คนทรง', '46')]:
        tap('เลือก'+class_name)
        wait_for('เลือก'+class_name+' · ออกเดินทาง →')
        root=shot('02-class-'+class_name)
        assert has(root,hp), 'Class stats not visible: '+class_name
        tap('กลับไปเลือกอาชีพ')
        wait_for('เลือก'+class_name)
    tap('เลือกนักรบวัด');shot('02-class');tap('เลือกนักรบวัด · ออกเดินทาง →')
    wait_for('เล่นคืนที่ 1');root=shot('03-night-select')
    tap('ดูคืนที่ 2');root=dump();locked=find(root,'ผ่านคืนที่ 1 ก่อน');assert locked is not None and locked.get('enabled')=='false', 'Second night was not locked'
    tap('ดูคืนที่ 1')
    # Scroll to the journal without bypassing normal UI.
    for _ in range(6):
        root=dump()
        if has(root,'สมุดบันทึกและของปลดล็อก'):break
        adb('shell','input','swipe','540','1900','540','600','400');time.sleep(.3)
    tap('สมุดบันทึกและของปลดล็อก');wait_for('สมุดผ่านคืน');root=shot('03-journal')
    assert has(root,'ผ่านแล้ว 0/5 คืน',contains=True), 'Fresh class journal is not empty'
    for _ in range(8):
        root=dump()
        if has(root,'กลับ'):break
        adb('shell','input','swipe','540','1900','540','600','400');time.sleep(.3)
    tap('กลับ')
    for _ in range(7):
        root=dump()
        if has(root,'เล่นคืนที่ 1'):break
        adb('shell','input','swipe','540','600','540','1900','400');time.sleep(.3)
    tap('เล่นคืนที่ 1');wait_for('ข้ามบทนี้');shot('03-prologue')
    tap('ข้ามบทนี้');wait_for('พรติดตัว 1:',contains=True);shot('03-starter-blessing')
    tap('พรติดตัว 1:',contains=True);tap('ยืนยันพร')
    wait_for('เลือกทางเดิน');root=shot('04-map')
    ghosts=[name for name in ['ผีกระสือ','ผีปอบ','นางตานี','ผีนางรำ','ผีโป่งค่าง','งูผีสาง'] if has(root,name)]
    assert len(ghosts)==2, 'Expected two real ghost choices'
    assert any('/15' in t for t in labels(root)), 'Full 15-fight route missing'
    tap('ข้อมูลผู้เดินทาง');wait_for('ปิดข้อมูลผู้เดินทาง');root=shot('04-player-details')
    assert any(t.startswith('พลังงาน ') for t in labels(root)), 'Energy missing from player details'
    assert any(t.startswith('EXP ') for t in labels(root)), 'EXP missing from player details'
    tap('ปิดข้อมูลผู้เดินทาง');wait_for('เลือกทางเดิน')
    tap('สำรับ ',contains=True);wait_for('สำรับของเรา');shot('04-deck')
    tap('ดูการ์ด ฟันดาบวัด จำนวน 3 ใบ',contains=True);wait_for('รายละเอียดการ์ด');root=shot('04-deck-detail')
    assert has(root,'ฟันดาบวัด'), 'Wrong card detail opened'
    assert any('×3' in t for t in labels(root)), 'Grouped count missing in card detail'
    tap('กลับไปดูสำรับ');wait_for('สำรับของเรา');tap('ปิด');wait_for('เลือกทางเดิน')
    root=dump();assert has(root,'เบี้ย'), 'Currency label missing'
    tap('พร ',contains=True);wait_for('พรติดตัว');shot('04-blessings')
    tap('ดูพร ',contains=True);wait_for('รายละเอียดพร');shot('04-blessing-detail')
    tap('กลับไปดูพร');wait_for('พรติดตัว');tap('ปิด');wait_for('เลือกทางเดิน')
    tap(ghosts[0]);wait_for('เผชิญหน้า →');shot('04-ghost-selected')
    # Switching and clearing selection must not enter battle.
    tap(ghosts[1]);wait_for('เผชิญหน้า →');tap(ghosts[1]);wait_for('เลือกทางเดิน')
    assert find(dump(),'เผชิญหน้า →') is None, 'Confirm action remained after deselection'
    tap(ghosts[0]);tap('เผชิญหน้า →')
    wait_for('จบเทิร์น');shot('05-battle')
    enemy_hp=next(t for t in labels(dump()) if re.match(r'^\d+/\d+$',t) and t!='66/66')
    # Closing a fight must pause, never return to the next map node.
    hand_before=[]
    for _ in range(12):
        before=dump(); hand_before=sorted(t for t in labels(before) if re.match(r'^การ์ด .+ พลัง \d+$',t))
        if len(hand_before)>=3: break
        time.sleep(.3)
    assert len(hand_before)>=3, 'Initial hand did not show readable cards'
    tap('พักการต่อสู้');wait_for('สู้ต่อ');shot('05-pause')
    assert find(dump(),'เดินทางต่อ') is None, 'Pause exposed a map progression control'
    tap('ตั้งค่า');wait_for('ลดการเคลื่อนไหวของฉาก');tap('กลับ');tap('สู้ต่อ')
    wait_for('จบเทิร์น');assert has(dump(),enemy_hp), 'Pause changed enemy HP'
    tap('ดูกองการ์ด');wait_for('ปิดกองการ์ด');root=shot('05-piles')
    pile_cards=[n for n in root.iter('node') if n.get('content-desc','').startswith('ดูการ์ด ')]
    assert pile_cards, 'Battle piles do not contain illustrated tappable cards'
    touch(pile_cards[0]);wait_for('กลับไปดูกองการ์ด');shot('05-pile-detail');tap('กลับไปดูกองการ์ด');tap('ปิดกองการ์ด')
    tap('พักการต่อสู้');tap('กลับเมนูหลัก');wait_for('เล่นต่อ',contains=True);shot('05-suspended-menu')
    adb('shell','am','force-stop',package);adb('shell','am','start','-W','-n',package+'/.MainActivity')
    wait_for('เล่นต่อ',contains=True);tap('เล่นต่อ',contains=True);wait_for('จบเทิร์น');root=shot('05-restored-battle')
    assert has(root,enemy_hp), 'Restored battle changed enemy HP'
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
            if has(root,'ชนะศึก'): won=True;break
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
        if has(root,'ชนะศึก'):won=True;break
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
            if has(root,'จบเทิร์น') or has(root,'ชนะศึก') or has(root,'พ่ายแพ้'):break
            time.sleep(.5)
        if enemy_recording is not None:
            adb('shell','pkill','-2','screenrecord');enemy_recording.wait(timeout=15)
            adb('pull','/sdcard/enemy-turn.mp4',str(out/'enemy-turn.mp4'))
        if turn==0:shot('07-next-turn')
    assert played,'No card was successfully tapped and used'
    assert won,'Fight did not finish'
    shot('08-victory-before-rewards');tap('รับรางวัล')
    for _ in range(12):
        root=dump()
        skip=find(root,'ข้ามไปก่อน');reward=find(root,'ไม่เอาสักใบ')
        if skip is not None:
            shot('09-level-up')
            option=next((n for n in root.iter('node') if n.get('clickable')=='true' and any('พลังชีวิต' in t or 'ช่องเครื่องราง' in t or 'พลังงาน' in t for t in fields(n))),None)
            if option is not None:
                touch(option);wait_for('เลือกไว้แล้ว',contains=True);shot('09-level-up-selected')
                tap('ยืนยันวิชา')
                wait_for('ของที่เก็บได้');root=shot('09-level-up-applied')
                assert any('→' in t and any(x in t for x in ['ชีวิตสูงสุด','พลังงานต่อเทิร์น','ช่องเครื่องราง']) for t in labels(root)), 'Applied level reward result not visible'
            else: touch(wait_for('ข้ามไปก่อน'))
        elif reward is not None:
            shot('10-card-reward')
            cards=[n for n in root.iter('node') if re.match(r'^การ์ด .+ พลัง \d+$',n.get('content-desc',''))]
            assert cards, 'Reward lacks illustrated selectable cards'
            touch(cards[0]);wait_for('รับ ',contains=True);shot('10-card-reward-preview')
            touch(wait_for('ไม่เอาสักใบ'))
        else:break
    wait_for('เลือกทางเดิน');root=shot('11-next-map')
    assert any('1/15' in t for t in labels(root)), 'Victory did not advance the full route by one fight'
# Fresh real medium run validates summon art and an actual helper attack.
adb('shell','am','force-stop',package);adb('shell','pm','clear',package)
adb('shell','am','start','-W','-n',package+'/.MainActivity')
wait_for('เริ่มเกม');tap('เริ่มเกม');tap('เลือกคนทรง');tap('เลือกคนทรง · ออกเดินทาง →')
wait_for('เล่นคืนที่ 1');tap('เล่นคืนที่ 1');wait_for('ข้ามบทนี้');tap('ข้ามบทนี้');wait_for('พรติดตัว 1:',contains=True);tap('พรติดตัว 1:',contains=True);tap('ยืนยันพร')
wait_for('เลือกทางเดิน');root=dump()
choices=[name for name in ['ผีกระสือ','นางตานี','ผีนางรำ','ผีโป่งค่าง','งูผีสาง','ผีปอบ'] if has(root,name)]
assert choices, 'No medium encounter available'
tap(choices[0]);tap('เผชิญหน้า →');wait_for('จบเทิร์น')
root=dump();enemy_hp=next(t for t in labels(root) if re.match(r'^\d+/\d+$',t) and t!='46/46');old,max_hp=map(int,enemy_hp.split('/'))
expected_hp=str(old-4)+'/'+str(max_hp)
root=wait_for('วิญญาณเพื่อน เหลือ 3 เทิร์น');shot('15-helper-summoned')
tap('วิญญาณเพื่อน เหลือ 3 เทิร์น');root=shot('16-helper-details')
assert find(root,'โจมตีด้วยพลังวิญญาณทะลุการป้องกัน',contains=True) is not None, 'Helper real effect missing'
tap('ปิดรายละเอียดมินเนี่ยน');tap('จบเทิร์น')
helper_hit_seen=False
for _ in range(40):
    root=dump()
    # The enemy can heal after the helper hits; inspect the actual damage frame.
    if has(root,expected_hp):
        helper_hit_seen=True
        shot('17-helper-hit-before-enemy')
    if has(root,'จบเทิร์น'):break
    time.sleep(.5)
wait_for('วิญญาณเพื่อน เหลือ 2 เทิร์น');root=shot('17-helper-after-action')
assert helper_hit_seen or has(root,expected_hp), 'Helper did not deal its real 4 damage: '+enemy_hp+' -> '+expected_hp
logs=adb('logcat','-d');(out/'logcat.txt').write_text(logs)
assert not re.search(r'FATAL EXCEPTION|Unable to load script|ANR in '+re.escape(package),logs),'Native runtime failure'
assert adb('shell','pidof',package).strip(),'App exited'
(out/'result.txt').write_text('PASS: Android API '+adb('shell','getprop','ro.build.version.sdk').strip()+': launch, class, prologue, compact blessing, in-scene ghost selection/switch/deselect, map route, player details, mat deck/card details and blessings links, card preview with valid touch bounds, play, enemy turn, victory before upgrades/card reward, five-night lock/journal, full-route advancement, medium summon/details/real helper attack. Physical device not tested.\n')
if '--helpers-only' in sys.argv:
    (out/'result.txt').write_text('PASS: Android API '+adb('shell','getprop','ro.build.version.sdk').strip()+': real medium summon, readable live helper details, duration 3 to 2 and actual helper damage of 4. Physical device not tested.\n')
print((out/'result.txt').read_text(),flush=True)
