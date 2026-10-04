"""Real UI smoke on a CI emulator. No test-only engine shortcuts."""
import os, re, subprocess, time, xml.etree.ElementTree as ET
from pathlib import Path
out = Path('smoke-output'); out.mkdir(exist_ok=True)
package = 'com.phikinhua.episode'
def adb(*args): return subprocess.check_output(['adb', *args], text=True)
def dump():
    adb('shell', 'uiautomator', 'dump', '/sdcard/window.xml')
    xml = adb('shell', 'cat', '/sdcard/window.xml')
    (out / 'latest-ui.xml').write_text(xml)
    return ET.fromstring(xml)
def wait_for(label, contains=False, timeout=30):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        for n in dump().iter('node'):
            fields = [n.get('text',''), n.get('content-desc','')]
            if any(label in t if contains else label == t for t in fields): return n
        time.sleep(1)
    raise AssertionError('UI not found: ' + label)
def tap(label, contains=False):
    n = wait_for(label, contains)
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', n.attrib['bounds']))
    adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
    time.sleep(1)
def shot(name):
    with open(out / (name + '.png'), 'wb') as f:
        subprocess.run(['adb','exec-out','screencap','-p'], stdout=f, check=True)
    (out / (name + '.xml')).write_text(adb('shell','cat','/sdcard/window.xml'))
adb('logcat', '-c')
adb('shell', 'am', 'start', '-W', '-n', package + '/.MainActivity')
wait_for('เริ่มเกม'); shot('01-cover')
tap('เริ่มเกม'); tap('หมอผี'); tap('ออกเดินทาง')
wait_for('คืนแรกที่บ้านร้าง'); shot('02-prologue')
tap('ข้ามบทนี้'); tap('พรติดตัว 1:', contains=True)
wait_for('ผีปอบ'); shot('03-map')
tap('ผีปอบ'); tap('จับผี')
wait_for('จบเทิร์น'); shot('04-battle')
tap('การ์ด ', contains=True)
wait_for('ใช้การ์ด'); shot('05-card-preview')
tap('ใช้การ์ด')
wait_for('จบเทิร์น'); tap('จบเทิร์น')
# Enemy animations can be skipped; the smoke lets them finish naturally.
time.sleep(12)
wait_for('จบเทิร์น'); shot('06-next-turn')
# Finish a fight through visible controls and verify victory precedes every reward.
def labels(root):
    return [n.get(k, '') for n in root.iter('node') for k in ('text', 'content-desc')]
def has(root, label): return label in labels(root)
won = False
for turn in range(16):
    attempted = set()
    for play in range(18):
        root = dump()
        if has(root, 'ชนะ!'):
            won = True
            break
        assert not has(root, 'ของที่เก็บได้'), 'Card reward appeared before victory'
        assert not any(t.startswith('เลเวล ') for t in labels(root)), 'Level-up appeared before victory'
        candidates = [t for t in labels(root) if re.match(r'^การ์ด .+ พลัง \d+$', t) and t not in attempted]
        if not candidates: break
        label = candidates[0]; attempted.add(label)
        tap(label)
        root = dump()
        if has(root, 'ใช้การ์ด'):
            tap('ใช้การ์ด'); attempted.clear()
            time.sleep(1)
        elif has(root, 'ปิด'):
            tap('ปิด')
    if won: break
    root = dump()
    if has(root, 'ชนะ!'):
        won = True; break
    assert not has(root, 'พ่ายแพ้'), 'Smoke player lost before victory verification'
    tap('จบเทิร์น')
    time.sleep(12)
assert won, 'Fight did not finish in smoke budget'
shot('07-victory-before-rewards')
tap('ดำเนินต่อ')
# Rewards can contain multiple level-ups; choose the explicit skip controls.
for reward in range(12):
    root = dump()
    if has(root, 'ข้ามไปก่อน'):
        shot('08-level-up'); tap('ข้ามไปก่อน')
    elif has(root, 'ไม่เอาสักใบ'):
        shot('09-card-reward'); tap('ไม่เอาสักใบ')
    else:
        break
wait_for('ตะเกียงใต้ถุน'); shot('10-rest-arrival')
tap('ตะเกียงใต้ถุน'); tap('แวะที่นี่')
wait_for('นั่งพักข้างตะเกียง', contains=True); shot('11-event-choices')
tap('นั่งพักข้างตะเกียง', contains=True)
wait_for('เดินทางต่อ'); shot('12-event-result')
tap('เดินทางต่อ')
logs = adb('logcat', '-d'); (out / 'logcat.txt').write_text(logs)
assert not re.search(r'FATAL EXCEPTION|Unable to load script|ANR in ' + re.escape(package), logs), 'Native startup/runtime failure'
pid = adb('shell', 'pidof', package).strip(); assert pid, 'App process exited'
(out / 'result.txt').write_text('PASS: API ' + adb('shell','getprop','ro.build.version.sdk').strip() + ': install, launch, class, prologue, blessing, map, fight, tap preview, play card, enemy turn, victory before upgrades/card reward, rest arrival and event choice. Physical device not tested.\n')
print((out / 'result.txt').read_text())
