"""Same final APK: fresh campaign/save resume, then production scene wrappers.
No user-device interaction; this script only clears a fresh CI emulator app."""
import argparse,json,re,shlex,subprocess,time,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
APP='com.phikinhua.episode';OUT=Path('paper-rollout-native-audit');OUT.mkdir(exist_ok=True)
checks=[];memory={}
SETTINGS_ONLY=argparse.ArgumentParser();SETTINGS_ONLY.add_argument('--settings-only',action='store_true');settings_only=SETTINGS_ONLY.parse_args().settings_only
def adb(*args):return subprocess.check_output(['adb',*args],text=True)
def nodes():
 adb('shell','rm','-f','/sdcard/rollout.xml');result=adb('shell','uiautomator','dump','/sdcard/rollout.xml')
 if 'dumped' not in result:raise RuntimeError('Missing fresh hierarchy')
 xml=adb('shell','cat','/sdcard/rollout.xml');(OUT/'latest.xml').write_text(xml)
 return list(ET.fromstring(xml).iter('node'))
def label(n):return (n.attrib.get('content-desc','')+' '+n.attrib.get('text','')).strip()
def box(n):return tuple(map(int,re.findall(r'\d+',n.attrib.get('bounds',''))))
def find(pattern,timeout=45,clickable=True):
 end=time.monotonic()+timeout;ns=[]
 while time.monotonic()<end:
  try:ns=nodes()
  except (RuntimeError,subprocess.CalledProcessError,ET.ParseError):time.sleep(.3);continue
  n=next((n for n in ns if re.search(pattern,label(n)) and (not clickable or n.attrib.get('clickable')=='true') and n.attrib.get('enabled')=='true' and len(box(n))==4 and box(n)[3]>box(n)[1]),None)
  if n is not None:return n
  time.sleep(.3)
 raise RuntimeError(pattern+': '+repr([(label(n),box(n)) for n in ns]))
def click(n,pause=.3):
 x,y,right,bottom=box(n);adb('shell','input','tap',str((x+right)//2),str((y+bottom)//2));time.sleep(pause)
def tap(pattern):click(find(pattern))
def record(check,**details):checks.append({'check':check,'passed':True,**details});print('PASS native:',check,details,flush=True)
def shot(name):
 p=OUT/(name+'.png')
 with p.open('wb') as f:subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
 return Image.open(p).convert('RGB')
def quiet():adb('shell','settings','put','global','transition_animation_scale','0');time.sleep(.5)
def motion():
 for key in ['window_animation_scale','transition_animation_scale','animator_duration_scale']:adb('shell','settings','put','global',key,'1')
 time.sleep(.5)
def open_review(scene,ghost='phi-pop'):
 motion();adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d',shlex.quote(f'phikinhua://paper-environments-review?sceneId={scene}&ghostId={ghost}'),APP);time.sleep(3.7);quiet();find(r'^ตั้งค่า$');find(r'เลือกทางที่จะไปต่อ',clickable=False)
def enter_review(ghost='phi-pop',capture=False):
 tap(r'^'+('ผีปอบ' if ghost=='phi-pop' else 'ผีตายโหงเรือนร้าง')+r'$');button=find(r'^เผชิญหน้า');motion()
 if capture:
  route=shot('setting-route');video=subprocess.Popen(['adb','shell','screenrecord','--time-limit','8','/sdcard/setting-entry.mp4']);time.sleep(.5)
 click(button,0);time.sleep(.7 if capture else 3.6)
 if capture:shot('click-plus-700ms')
 quiet();find(r'^จบเทิร์น$')
 if capture:
  final=shot('setting-final');video.wait(timeout=15);name='setting-entry-'+str(len(checks));p=OUT/(name+'.mp4');adb('pull','/sdcard/setting-entry.mp4',str(p))
  frame_dir=OUT/name;frame_dir.mkdir(exist_ok=True)
  subprocess.run(['ffmpeg','-v','error','-i',str(p),'-vf','fps=8',str(frame_dir/'%03d.png')],check=True)
  w,h=final.size;actor=(int(w*.40),int(h*.06),int(w*.65),int(h*.22));route_button=(int(w*.3),int(h*.86),int(w*.7),int(h*.91));hp=box(hp_box())
  mean=lambda a,b:max(ImageStat.Stat(ImageChops.difference(a,b)).mean)
  entry=[]
  for frame in sorted(frame_dir.glob('*.png')):
   im=Image.open(frame).convert('RGB')
   # Identify actual battle entry by ghost position AND disappearance of route button.
   # A fixed delay after adb tap is not a scene-entry timestamp on a loaded emulator.
   if mean(im.crop(actor),final.crop(actor))<20 and mean(im.crop(route_button),route.crop(route_button))>15:
    entry.append((frame,mean(im.crop(hp),final.crop(hp))))
  assert len(entry)>=4,'No identifiable battle frames in native setting recording'
  assert max(v for _,v in entry[:4])<12,('HUD fades despite bypass',[(p.name,v) for p,v in entry[:4]])
  Image.open(entry[0][0]).save(OUT/'OFF-early.png')
  (OUT/(name+'.json')).write_text(json.dumps({'firstIdentifiedBattleFrame':entry[0][0].name,'firstFourHudDifferences':[v for _,v in entry[:4]],'samplingFps':8,'tapLatencyExcluded':True}))
def switch(pattern):
 tap(r'^ตั้งค่า$');n=find(pattern);before=n.attrib.get('checked');click(n);after=find(pattern).attrib.get('checked');assert before!=after;tap(r'^กลับ$');return after=='true'
def hp_box():return max((n for n in nodes() if 'พลังชีวิต' in label(n) and len(box(n))==4),key=lambda n:box(n)[1])
adb('shell','pm','clear',APP);adb('logcat','-c');motion()
logger=subprocess.Popen(['adb','logcat','-v','threadtime','ReactNativeJS:V','ReactNative:V','AndroidRuntime:E','*:S'],stdout=(OUT/'logcat.txt').open('w'),stderr=subprocess.STDOUT)
try:
 if not settings_only:
  # Actual game entry, original three-page route, signed APK and store autosave.
  adb('shell','am','start','-W','-n',APP+'/.MainActivity');tap(r'^เริ่มเกม$');tap(r'^เลือกนักรบวัด');tap(r'ออกเดินทาง');tap(r'ดูระดับอาถรรพ์ 1');tap(r'เริ่มรอบ · ระดับ 1');tap(r'^(ข้ามบทนี้|เดินทางต่อ)$');tap(r'^พรติดตัว 1:');tap(r'^ยืนยันพร$');time.sleep(3.5);quiet()
  ns=nodes();slots=[n for n in ns if 'adventure-slot-' in n.attrib.get('resource-id','')];assert len(slots)==3
  fight=next(n for n in slots if 'ต่อสู้' in label(n));click(fight);tap(r'^เผชิญหน้า · ');time.sleep(3.6);quiet();find(r'^จบเทิร์น$')
  before=sorted(label(n) for n in nodes() if label(n).startswith('การ์ด '));assert before
  assert not re.search(r'คอมโบ|combo',' '.join(label(n) for n in nodes()),re.I)
  tap(r'^พักการต่อสู้$');tap(r'^กลับเมนูหลัก$');adb('shell','am','force-stop',APP);adb('shell','am','start','-W','-n',APP+'/.MainActivity');tap(r'^เล่นต่อ');time.sleep(3.5);quiet()
  after=sorted(label(n) for n in nodes() if label(n).startswith('การ์ด '));assert after==before
  record('production-campaign-route-battle-cold-save-resume-v33-no-combo')
  # Reproduce activity recreation with saved combat before reviewing fixtures.
  adb('shell','wm','size','720x1280');adb('shell','wm','density','320');time.sleep(5);quiet();find(r'^จบเทิร์น$');assert adb('shell','pidof',APP).strip()
  record('saved-combat-survives-portrait-window-recreation')
  reps=['01-village','03-temple-gate','06-bamboo-forest','08-stream','10-mountain-trail','13-cave-river','16-secret-throne']
  for w,h,density in [(720,1280,320),(786,1704,320)]:
   adb('shell','am','force-stop',APP)
   adb('shell','wm','size',f'{w}x{h}');adb('shell','wm','density',str(density))
   for scene in reps:
    ghost='phi-nang-yai' if scene=='01-village' else 'phi-pop';open_review(scene,ghost);shot(f'route-{scene}-{w}');enter_review(ghost);im=shot(f'battle-{scene}-{w}');assert im.size==(w,h)
    end=find(r'^จบเทิร์น$');ns=nodes();cards=[n for n in ns if label(n).startswith('การ์ด ') and len(box(n))==4];assert cards
    assert all(0<=box(n)[0]<box(n)[2]<=w and box(n)[3]<=box(end)[1] for n in cards)
    record('portrait-environment-route-battle',scene=scene,logicalViewport=[w/2,h/2],grounded=ghost=='phi-pop')
    memory[f'{scene}-{w}']=adb('shell','dumpsys','meminfo',APP)
  # Record actual native normal-speed temple assembly with all OS scales at 1.
  open_review('03-temple-gate');tap(r'^ผีปอบ$');button=find(r'^เผชิญหน้า');motion()
  video=subprocess.Popen(['adb','shell','screenrecord','--time-limit','8','/sdcard/rollout-assembly.mp4']);time.sleep(.5);click(button,0)
  for delay,name in [(.15,'first'),(1.3,'middle'),(1.9,'final')]:time.sleep(delay);shot('assembly-'+name)
  video.wait(timeout=15);quiet();adb('pull','/sdcard/rollout-assembly.mp4',str(OUT/'native-assembly-temple.mp4'));find(r'^จบเทิร์น$');reference=shot('reference');hp=box(hp_box())
  diff=ImageStat.Stat(ImageChops.difference(Image.open(OUT/'assembly-first.png').convert('RGB').crop(hp),reference.crop(hp))).mean
  assert max(diff)>15,'HUD must fade after assembly rather than appear on the first frame';record('normal-speed-three-second-native-recording-late-HUD')
 else:
  adb('shell','wm','size','786x1704');adb('shell','wm','density','320');open_review('03-temple-gate');enter_review()
 # OFF survives a process restart and is instant; ON changes next entry only.
 assert switch(r'^แอนิเมชันฉากกระดาษ$') is False
 adb('shell','am','force-stop',APP);open_review('03-temple-gate');tap(r'^ตั้งค่า$');assert find(r'^แอนิเมชันฉากกระดาษ$').attrib.get('checked')=='false';tap(r'^กลับ$');enter_review(capture=True)
 off_final=shot('OFF-final');region=box(hp_box());assert max(ImageStat.Stat(ImageChops.difference(off_final.crop(region),shot('OFF-stable').crop(region))).mean)<12
 record('OFF-persistence-after-cold-restart-and-immediate-HUD')
 assert switch(r'^แอนิเมชันฉากกระดาษ$') is True
 assert switch(r'^ลดการเคลื่อนไหวของฉาก$') is True
 adb('shell','am','force-stop',APP);open_review('13-cave-river');enter_review(capture=True);reduced_early=Image.open(OUT/'OFF-early.png').convert('RGB');time.sleep(3.2);reduced_final=shot('reduced-final');region=box(hp_box());assert max(ImageStat.Stat(ImageChops.difference(reduced_early.crop(region),reduced_final.crop(region))).mean)<12;record('game-reduced-motion-overrides-ON-immediate-HUD')
 assert switch(r'^ลดการเคลื่อนไหวของฉาก$') is False
 log=adb('logcat','-d');assert not re.search(r'FATAL EXCEPTION|WorkletError|TypeError:|ReferenceError:|ReactNativeJS: Error:',log),log[-4000:]
 assert adb('shell','pidof',APP).strip();record('no-native-crash-or-worklet-errors')
 (OUT/'memory.json').write_text(json.dumps(memory,indent=2));(OUT/'gfxinfo.txt').write_text(adb('shell','dumpsys','gfxinfo',APP,'framestats'))
finally:
 (OUT/'memory.json').write_text(json.dumps(memory,indent=2));(OUT/'gfxinfo.txt').write_text(adb('shell','dumpsys','gfxinfo',APP,'framestats'))
 logger.terminate();(OUT/'results.json').write_text(json.dumps({'checks':checks,'physicalDeviceTested':False},indent=2));adb('shell','wm','size','reset');adb('shell','wm','density','reset');motion()
