"""Native API 36 playtest UI smoke on the exact normal-play APK; no QA card."""
import subprocess,time,re,json,xml.etree.ElementTree as ET
from pathlib import Path
out=Path('feedback-native-audit');out.mkdir(exist_ok=True)
checks=[]
def adb(*args):return subprocess.check_output(['adb',*args],text=True)
def nodes():
 adb('shell','uiautomator','dump','/sdcard/feedback.xml');return list(ET.fromstring(adb('shell','cat','/sdcard/feedback.xml')).iter('node'))
def label(n):return n.attrib.get('content-desc') or n.attrib.get('text','')
def find(pattern,timeout=30):
 end=time.monotonic()+timeout
 while time.monotonic()<end:
  ns=nodes();n=next((n for n in ns if re.search(pattern,label(n))),None)
  if n is not None:return n
  time.sleep(.4)
 raise AssertionError('Missing '+pattern+'; '+str([label(n) for n in ns]))
def tap(pattern):
 n=find(pattern);x1,y1,x2,y2=map(int,re.findall(r'\d+',n.attrib['bounds']));adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.45)
def tap_if(pattern,timeout=4):
 """Optional step: tap when it shows up within `timeout`, else carry on."""
 try:n=find(pattern,timeout)
 except AssertionError:return False
 x1,y1,x2,y2=map(int,re.findall(r'\d+',n.attrib['bounds']));adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.45);return True
def shot(name):
 (out/(name+'.png')).write_bytes(subprocess.check_output(['adb','exec-out','screencap','-p']))
app='com.phikinhua.episode'
try:
 # นักมวยคาดเชือก and หมอผี (since 1.0.56) are open (classes.ts PLAYABLE_CLASSES); the others must show as locked.
 for cls in ['นักมวยคาดเชือก','หมอผี']:
  adb('shell','am','force-stop',app);adb('shell','pm','clear',app);adb('shell','am','start','-W','-n',app+'/.MainActivity')
  # v1.0.48 class book: open it, turn to the class page, then choose; the old 'ออกเดินทาง' step may not exist.
  tap('^เริ่มเกม$');tap_if('^เปิดตำรา$')
  for other in ['แม่ชี','คนทรง']:
   tap('^เปิดหน้า'+other+'$');find('^'+other+' · ยังไม่เปิด');checks.append(other+': locked in the class book')
  tap_if('^เปิดหน้า'+cls+'$');tap('^เลือก'+cls+'$');tap_if('ออกเดินทาง');tap('ดูระดับอาถรรพ์ 1');tap('เริ่มรอบ · ระดับ 1');tap('^(ข้ามบทนี้|เดินทางต่อ)$')
  tap('^พรติดตัว 1:');assert not any(label(n)=='แตะพรเพื่ออ่านรายละเอียด' for n in nodes());shot(cls+'-starter');checks.append(cls+': starter selection shows effect')
  tap('^ยืนยันพร$');find('^สำรับ 10$');time.sleep(4)
  tap('^สำรับ 10$');find('ช่องสวมอุปกรณ์');find('ยังไม่มีอุปกรณ์ในสำรับ');shot(cls+'-bag')
  tap('^พร \\(');assert any('พร' in label(n) for n in nodes());shot(cls+'-blessings');tap('^ปิด$');checks.append(cls+': bag tabs and empty equipment slots')
  deadline=time.monotonic()+30
  while time.monotonic()<deadline:
   ns=nodes();ghost=next((n for n in ns if 'adventure-slot-' in n.attrib.get('resource-id','') and re.search(r' · (ผีระดับ|ผีชั้นสูง|ผีธรรมดา|บอส)',label(n))),None)
   if ghost is not None:break
   time.sleep(.4)
  else:raise AssertionError('No ghost page control: '+str([label(n) for n in ns]))
  x1,y1,x2,y2=map(int,re.findall(r'\d+',ghost.attrib['bounds']));adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));tap('^เผชิญหน้า · ')
  find('^จบเทิร์น$');assert not any('พระประธาน' in label(n) for n in nodes());tap('^ในมือ \\d+ · มือสูงสุด');find('จั่วต่อเทิร์น');find('กองจั่ว');shot(cls+'-hand-detail');tap('^ปิด$')
  tap('^สกิล ');find('พักสกิล');shot(cls+'-skill');tap('^ปิด$');shot(cls+'-battle');checks.append(cls+': real combat hand details and class skill artwork/details')
 print('PASS',len(checks),'native checks',flush=True)
except Exception as e:
 checks.append({'failed':type(e).__name__+': '+str(e)});shot('failure');raise
finally:
 (out/'results.json').write_text(json.dumps({'api':36,'syntheticFixtures':False,'checks':checks},ensure_ascii=False,indent=2))
 (out/'logcat.txt').write_text(adb('logcat','-d'))
