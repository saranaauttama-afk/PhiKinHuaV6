"""Native first-hand QA card in four classes, enemy history and cold resume. XML only."""
import json,re,subprocess,time,xml.etree.ElementTree as ET
from pathlib import Path
out=Path('v35-native-audit');out.mkdir(exist_ok=True)
app='com.phikinhua.episode';checks=[]
def adb(*args):return subprocess.check_output(['adb',*args],text=True,stderr=subprocess.STDOUT)
def nodes():
    adb('shell','uiautomator','dump','/sdcard/v35.xml')
    xml=adb('shell','cat','/sdcard/v35.xml');(out/'latest-ui.xml').write_text(xml)
    return list(ET.fromstring(xml).iter('node'))
def label(n):return (n.attrib.get('content-desc','')+' '+n.attrib.get('text','')).strip()
def bounds(n):return tuple(map(int,re.findall(r'\d+',n.attrib.get('bounds',''))))
def find(ns,pattern):return next((n for n in ns if re.search(pattern,label(n)) and n.attrib.get('enabled')=='true' and len(bounds(n))==4 and bounds(n)[2]>bounds(n)[0]),None)
def click(n):
    x1,y1,x2,y2=bounds(n);adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.7)
def tap(pattern,timeout=60):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        ns=nodes();n=find(ns,pattern)
        if n is not None:click(n);return
        time.sleep(.5)
    raise AssertionError('Missing native control: '+pattern+'; '+str([label(n) for n in ns]))
def hand(ns):return sorted(label(n) for n in ns if label(n).startswith('การ์ด '))
adb('logcat','-c')
for cls in ['นักรบวัด','หมอผี','แม่ชี','คนทรง']:
    adb('shell','am','force-stop',app);adb('shell','pm','clear',app);adb('shell','am','start','-W','-n',app+'/.MainActivity')
    tap(r'^เริ่มเกม$');tap('^เลือก'+cls+'$');tap('ออกเดินทาง');tap('ดูระดับอาถรรพ์ 1');tap('เริ่มรอบ · ระดับ 1');tap(r'^(ข้ามบทนี้|เดินทางต่อ)$');tap(r'^พรติดตัว 1:');tap(r'^ยืนยันพร$')
    ns=nodes();ghost=next(n for n in ns if 'adventure-slot-' in n.attrib.get('resource-id','') and ' · ต่อสู้' in label(n));click(ghost);tap(r'^เผชิญหน้า · ')
    deadline=time.monotonic()+45
    while time.monotonic()<deadline:
        ns=nodes()
        if find(ns,r'^การ์ด พระประธาน'):break
        time.sleep(.5)
    else:raise AssertionError('QA card missing for '+cls)
    assert len([n for n in ns if label(n).startswith('การ์ด พระประธาน')])==1
    assert len(hand(ns))==3,(cls,hand(ns))
    assert not any('ข้าม ▸▸' in label(n) for n in ns)
    checks.append(cls+': exactly two normal opening cards plus พระประธาน')
    if cls=='นักรบวัด':
        tap(r'^จบเทิร์น$');time.sleep(10);ns=nodes()
        assert find(ns,r'^ประวัติ ผีใช้ '),[label(n) for n in ns]
        tap(r'^ประวัติ ผีใช้ ');assert any('ผลที่เกิดขึ้น' in label(n) for n in nodes());tap(r'^ปิดประวัติ$')
        initial=hand(nodes());tap(r'^พักการต่อสู้$');tap(r'^กลับเมนูหลัก$')
        adb('shell','am','force-stop',app);adb('shell','am','start','-W','-n',app+'/.MainActivity');tap(r'^เล่นต่อ')
        now=nodes();assert hand(now)==initial;assert find(now,r'^ประวัติ ผีใช้ ')
        checks.append('native enemy-card history opens and survives cold battle resume')
    tap(r'^การ์ด พระประธาน');tap(r'^ใช้การ์ด$');tap(r'^รับรางวัล$')
    checks.append(cls+': QA victory reaches normal reward settlement')
log=adb('logcat','-d');(out/'logcat.txt').write_text(log)
assert 'FATAL EXCEPTION' not in log and 'JavascriptException' not in log
(out/'result.json').write_text(json.dumps({'checks':checks,'screenshots':False,'scope':'four-class first combat, QA victory, enemy history and cold resume; real retained-hand fixture coverage is in mobile web and engine tests'},ensure_ascii=False,indent=2))
print('PASS',len(checks),'native v35 checks',flush=True)
