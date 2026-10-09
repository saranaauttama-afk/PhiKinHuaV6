"""Install/portrait/native gameplay smoke; UI XML and logs only, no captures."""
import json, re, subprocess, time, xml.etree.ElementTree as ET
from pathlib import Path

OUT=Path('backlog-native-audit'); OUT.mkdir(exist_ok=True)
checks=[]
def adb(*args):
    return subprocess.check_output(['adb',*args],text=True)
def nodes():
    adb('shell','uiautomator','dump','/sdcard/backlog-ui.xml')
    xml=adb('shell','cat','/sdcard/backlog-ui.xml')
    (OUT/'latest-ui.xml').write_text(xml)
    return list(ET.fromstring(xml).iter('node'))
def tap(pattern,timeout=75):
    end=time.monotonic()+timeout
    last=[]
    while time.monotonic()<end:
        try: last=nodes()
        except (subprocess.CalledProcessError,ET.ParseError):
            time.sleep(.5);continue
        for n in last:
            label=(n.attrib.get('content-desc','')+' '+n.attrib.get('text','')).strip()
            if re.search(pattern,label) and n.attrib.get('enabled')=='true':
                x1,y1,x2,y2=map(int,re.findall(r'\d+',n.attrib['bounds']))
                if x2>x1 and y2>y1:
                    adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
                    time.sleep(.7); checks.append(pattern);print('PASS native:',pattern,flush=True);return
        time.sleep(.5)
    print('Native UI at failure:',[(n.attrib.get('content-desc'),n.attrib.get('text'),n.attrib.get('bounds')) for n in last],flush=True)
    print('Foreground:',adb('shell','dumpsys','activity','activities'),flush=True)
    raise RuntimeError('Missing native control: '+pattern)

adb('shell','am','force-stop','com.phikinhua.episode')
adb('shell','pm','clear','com.phikinhua.episode')
adb('logcat','-c')
log_file=(OUT/'logcat.txt').open('w')
logger=subprocess.Popen(['adb','logcat','-v','threadtime','ReactNativeJS:V','ReactNative:V','AndroidRuntime:E','Expo:V','ExpoFont:V','*:S'],stdout=log_file,stderr=subprocess.STDOUT)
try:
    adb('shell','input','keyevent','KEYCODE_WAKEUP')
    adb('shell','input','keyevent','82')
    print(adb('shell','am','start','-W','-n','com.phikinhua.episode/.MainActivity'),flush=True)
    tap(r'เริ่มเกม')
    root=nodes()[0]; x1,y1,x2,y2=map(int,re.findall(r'\d+',root.attrib['bounds']));assert y2-y1>x2-x1,'Android must be portrait';checks.append('Android portrait bounds')
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
    available=' '.join(n.attrib.get('text','')+' '+n.attrib.get('content-desc','') for n in nodes())
    if 'ข้ามไปก่อน' in available:tap(r'ข้ามไปก่อน')
    tap(r'ไม่เอาสักใบ')
    assert adb('shell','pidof','com.phikinhua.episode').strip()
    log_file.flush()
    log=(OUT/'logcat.txt').read_text()
    if 'FATAL EXCEPTION' in log or 'JavascriptException' in log:raise RuntimeError('Native crash in app logcat')
    checks.append('native process alive after victory/reward')
finally:
    logger.terminate();logger.wait(timeout=10);log_file.close()
    (OUT/'results.json').write_text(json.dumps({'checks':checks,'screenshots':False},ensure_ascii=False,indent=2))
    print((OUT/'logcat.txt').read_text()[-24000:],flush=True)
print('Native backlog smoke passed; no captures.')
