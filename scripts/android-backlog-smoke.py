"""Install/portrait/native gameplay smoke; UI XML only, never screen captures."""
import json, re, subprocess, time, xml.etree.ElementTree as ET
from pathlib import Path

OUT=Path('backlog-native-audit'); OUT.mkdir(exist_ok=True)
checks=[]
def adb(*args):
    return subprocess.check_output(['adb',*args],text=True)
def nodes():
    adb('shell','uiautomator','dump','/sdcard/backlog-ui.xml')
    return list(ET.fromstring(adb('shell','cat','/sdcard/backlog-ui.xml')).iter('node'))
def tap(pattern,timeout=35):
    end=time.monotonic()+timeout
    while time.monotonic()<end:
        for n in nodes():
            label=n.attrib.get('content-desc','')+' '+n.attrib.get('text','')
            if re.search(pattern,label) and n.attrib.get('enabled')=='true':
                x1,y1,x2,y2=map(int,re.findall(r'\d+',n.attrib['bounds']))
                if x2>x1 and y2>y1:
                    adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
                    time.sleep(.7); checks.append(pattern);return
        time.sleep(.5)
    raise RuntimeError('Missing native control: '+pattern)

adb('shell','am','force-stop','com.phikinhua.episode')
adb('shell','pm','clear','com.phikinhua.episode')
adb('shell','am','start','-W','-n','com.phikinhua.episode/.MainActivity')
try:
    tap(r'เริ่มเกม')
    tap(r'^เลือกนักรบวัด')
    tap(r'ออกเดินทาง')
    tap(r'เล่นคืนที่ 1')
    tap(r'ข้ามบทนี้')
    tap(r'พรติดตัว 1:')
    tap(r'ยืนยันพร')
    tap(r'^ผีปอบ|^ผีกระสือ|^นางตานี')
    tap(r'เผชิญหน้า')
    tap(r'^การ์ด .*พระประธาน')
    tap(r'ใช้การ์ด')
    tap(r'รับรางวัล')
    # A level-up may precede card rewards; skip only when the real control exists.
    available=' '.join(n.attrib.get('text','')+' '+n.attrib.get('content-desc','') for n in nodes())
    if 'ข้ามไปก่อน' in available:tap(r'ข้ามไปก่อน')
    tap(r'ไม่เอาสักใบ')
    assert adb('shell','pidof','com.phikinhua.episode').strip()
    log=adb('logcat','-d','-t','3000')
    if 'FATAL EXCEPTION' in log or 'JavascriptException' in log:raise RuntimeError('Native crash in logcat')
    checks.append('native process alive after victory/reward')
finally:
    (OUT/'results.json').write_text(json.dumps({'checks':checks,'screenshots':False},ensure_ascii=False,indent=2))
    (OUT/'logcat.txt').write_text(adb('logcat','-d','-t','3000'))
print('Native backlog smoke passed; no captures.')
