"""Fresh install, five-night native B17 flow and cold resume. XML/logs only."""
import json, re, subprocess, time, xml.etree.ElementTree as ET
from pathlib import Path
OUT=Path('backlog-native-audit'); OUT.mkdir(exist_ok=True)
checks=[]; nights=[]; APP='com.phikinhua.episode'
def adb(*args): return subprocess.check_output(['adb',*args],text=True)
def nodes():
    adb('shell','uiautomator','dump','/sdcard/backlog-ui.xml')
    xml=adb('shell','cat','/sdcard/backlog-ui.xml'); (OUT/'latest-ui.xml').write_text(xml)
    return list(ET.fromstring(xml).iter('node'))
def label(n): return (n.attrib.get('content-desc','')+' '+n.attrib.get('text','')).strip()
def bounds(n): return tuple(map(int,re.findall(r'\d+',n.attrib.get('bounds',''))))
def available(ns,pattern): return next((n for n in ns if re.search(pattern,label(n)) and n.attrib.get('enabled')=='true' and len(bounds(n))==4 and bounds(n)[2]>bounds(n)[0] and bounds(n)[3]>bounds(n)[1]),None)
def click(n):
    x1,y1,x2,y2=bounds(n); adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2)); time.sleep(.7)
def record(s): checks.append(s); print('PASS native:',s,flush=True)
def tap(pattern,timeout=75):
    end=time.monotonic()+timeout; last=[]; attempts=0
    while time.monotonic()<end:
        try: last=nodes()
        except (subprocess.CalledProcessError,ET.ParseError): time.sleep(.5); continue
        n=available(last,pattern)
        if n is not None: click(n); record(pattern); return n
        attempts+=1
        if attempts%4==0 and last:
            x1,y1,x2,y2=bounds(last[0]); adb('shell','input','swipe',str((x1+x2)//2),str(int(y2*.8)),str((x1+x2)//2),str(int(y2*.35)),'350')
        time.sleep(.5)
    print('Native UI at failure:',[(label(n),n.attrib.get('resource-id'),n.attrib.get('bounds')) for n in last],flush=True)
    raise RuntimeError('Missing native control: '+pattern)
def slots(ns): return [(n.attrib.get('resource-id'),label(n)) for n in ns if 'adventure-slot-' in n.attrib.get('resource-id','')]
def hand(ns): return sorted(label(n) for n in ns if re.match(r'^การ์ด ',label(n)))
def snapshot(name,ns): (OUT/(name+'.xml')).write_text(ET.tostring(ET.fromstring(adb('shell','cat','/sdcard/backlog-ui.xml')),encoding='unicode'))
adb('shell','am','force-stop',APP); adb('shell','pm','clear',APP); adb('logcat','-c')
log_file=(OUT/'logcat.txt').open('w')
logger=subprocess.Popen(['adb','logcat','-v','threadtime','ReactNativeJS:V','ReactNative:V','AndroidRuntime:E','Expo:V','ExpoFont:V','*:S'],stdout=log_file,stderr=subprocess.STDOUT)
try:
    adb('shell','input','keyevent','KEYCODE_WAKEUP'); adb('shell','input','keyevent','82')
    print(adb('shell','am','start','-W','-n',APP+'/.MainActivity'),flush=True)
    resumed=False; cancel_checked=False
    for night in range(1,6):
        tap(r'^เริ่มเกม$'); root=nodes()[0]; x1,y1,x2,y2=bounds(root); assert y2-y1>x2-x1,'Android must be portrait'
        tap(r'^เลือกนักรบวัด'); tap(r'ออกเดินทาง'); tap('ดูคืนที่ '+str(night)); tap('เล่นคืนที่ '+str(night)); tap(r'^ข้ามบทนี้$'); tap(r'^พรติดตัว 1:'); tap(r'^ยืนยันพร$')
        before=slots(nodes()); assert len(before)==3,('three pages',before)
        tap(r'^ร้านค้าการ์ด · แวะพัก'); tap(r'^แวะ · ร้านค้าการ์ด$')
        shop=nodes(); assert available(shop,r'^ร้านขายคาถา$') is not None,'Shop must open on mixed map'; assert available(shop,r'^จบเทิร์น$') is None
        tap(r'^กลับจุดพัก$'); assert slots(nodes())==before,'Postponed shop must preserve all pages'; record('night '+str(night)+' native mixed shop and postponed pages')
        battles=0; story=False; bosses=[]; ghosts=[]; complete=False
        for guard in range(650):
            ns=nodes(); text=' '.join(label(n) for n in ns)
            if available(ns,r'^ผ่านคืนที่ '+str(night)+r'!$') is not None:
                assert story and battles==(30 if night==5 else 29),(night,story,battles)
                assert len(ghosts)==28 and len(set(ghosts))==28,(night,ghosts)
                snapshot('night-'+str(night)+'-complete',ns); nights.append({'night':night,'battles':battles,'story':story,'bosses':bosses,'ghosts':ghosts}); record('night '+str(night)+' complete and next night unlocked'); tap(r'^กลับหน้าแรก$'); complete=True; break
            if available(ns,r'^ข้ามบทนี้$') is not None: tap(r'^ข้ามบทนี้$'); continue
            if available(ns,r'^รับรางวัล$') is not None: tap(r'^รับรางวัล$'); battles+=1; continue
            if available(ns,r'^ข้ามไปก่อน$') is not None: tap(r'^ข้ามไปก่อน$'); continue
            if available(ns,r'^ไม่เอาสักใบ$') is not None: tap(r'^ไม่เอาสักใบ$'); continue
            card=available(ns,r'^การ์ด .*พระประธาน')
            if card is not None:
                if not resumed:
                    initial=hand(ns); tap(r'^พักการต่อสู้$'); tap(r'^กลับเมนูหลัก$'); tap(r'^เล่นต่อ'); tap(r'^พักการต่อสู้$'); tap(r'^กลับเมนูหลัก$')
                    adb('shell','am','force-stop',APP); adb('shell','am','start','-W','-n',APP+'/.MainActivity'); tap(r'^เล่นต่อ'); now=nodes(); assert hand(now)==initial,'Cold resume must preserve visible hand'
                    record('cold resume keeps battle hand'); resumed=True; ns=now; card=available(ns,r'^การ์ด .*พระประธาน'); assert card is not None
                if not cancel_checked:
                    x1,y1,x2,y2=bounds(card); cx=(x1+x2)//2; cy=(y1+y2)//2; initial=hand(ns)
                    adb('shell','input','swipe',str(cx),str(cy),str(cx),str(cy-60),'350'); time.sleep(.7)
                    after=nodes()
                    if available(after,r'^ปิด$') is not None: tap(r'^ปิด$'); after=nodes()
                    assert hand(after)==initial,'Cancelled drag must preserve hand'; record('native short drag cancels and preserves hand'); cancel_checked=True
                tap(r'^การ์ด .*พระประธาน'); tap(r'^ใช้การ์ด$'); continue
            critical=next((n for n in ns if 'adventure-slot-' in n.attrib.get('resource-id','') and re.search(r' · (ต่อสู้|ศึกใหญ่|เรื่องสำคัญ)',label(n))),None)
            if critical is not None:
                if 'ศึกใหญ่' in label(critical): bosses.append(label(critical).split(' · ')[0])
                elif 'ต่อสู้' in label(critical): ghosts.append(label(critical).split(' · ')[0])
                story_page='เรื่องสำคัญ' in label(critical); click(critical); tap(r'^สำรวจเรื่องราว$' if story_page else r'^เผชิญหน้า · '); continue
            choice=next((n for n in ns if 'event-choice-0' in n.attrib.get('resource-id','')),None)
            if choice is not None:
                click(choice); tap(r'^ยืนยัน · '); tap(r'^กลับจุดพัก$'); story=True; record('night '+str(night)+' mandatory story resolved'); continue
            if available(ns,r'^ทางแยกถัดไป$') is not None: tap(r'^ทางแยกถัดไป$'); tap(r'^ยืนยันไปทางแยกถัดไป$'); continue
            time.sleep(1)
        assert complete,'Night '+str(night)+' stalled'
    assert resumed and cancel_checked
    assert nights[-1]['bosses'][-1]=='ผีกินหัว',nights[-1]
    assert adb('shell','pidof',APP).strip(); record('Android portrait and process alive after all five nights')
    log_file.flush(); log=(OUT/'logcat.txt').read_text()
    assert 'FATAL EXCEPTION' not in log and 'JavascriptException' not in log,'Native crash in logcat'
finally:
    logger.terminate(); logger.wait(timeout=10); log_file.close()
    (OUT/'results.json').write_text(json.dumps({'checks':checks,'nights':nights,'freshInstall':True,'screenshots':False,'usesTestWinCard':True},ensure_ascii=False,indent=2))
    print((OUT/'logcat.txt').read_text()[-24000:],flush=True)
print('Native B01–B17 five-night flow passed; no captures.')
