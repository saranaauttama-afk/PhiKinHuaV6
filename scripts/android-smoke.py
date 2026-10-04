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
wait_for('เปิดอ่านคืนแรก'); shot('01-cover')
tap('เปิดอ่านคืนแรก'); tap('หมอผี'); tap('ออกเดินทาง')
wait_for('คืนแรกที่บ้านร้าง'); shot('02-prologue')
tap('ข้ามบทนี้'); tap('พรติดตัว 1:', contains=True)
wait_for('ผีปอบ'); shot('03-map')
tap('ผีปอบ'); tap('จับผี')
wait_for('ท่าถัดไป:', contains=True); shot('04-battle')
tap('การ์ด ', contains=True)
wait_for('ใช้การ์ด'); shot('05-card-preview')
tap('ใช้การ์ด')
wait_for('จบเทิร์น'); tap('จบเทิร์น')
# Enemy animations can be skipped; the smoke lets them finish naturally.
time.sleep(12)
wait_for('จบเทิร์น'); shot('06-next-turn')
logs = adb('logcat', '-d'); (out / 'logcat.txt').write_text(logs)
assert not re.search(r'FATAL EXCEPTION|Unable to load script|ANR in ' + re.escape(package), logs), 'Native startup/runtime failure'
pid = adb('shell', 'pidof', package).strip(); assert pid, 'App process exited'
(out / 'result.txt').write_text('PASS: API ' + adb('shell','getprop','ro.build.version.sdk').strip() + ': install, launch, class, prologue, blessing, map, fight, tap preview, play card, enemy turn. Physical device not tested.\n')
print((out / 'result.txt').read_text())
