"""Native isolated prototype checks; never touch the production application data."""
import json,re,subprocess,time,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
APP='com.phikinhua.dioramatest'; OUT=Path('paper-native-audit');OUT.mkdir(exist_ok=True)
checks=[]
def adb(*args):return subprocess.check_output(['adb',*args],text=True)
def quiet():
 # Android UIAutomator waits for accessibility-event idle. Stop ONLY ambient
 # motion after a completed assembly so hierarchy reads are deterministic.
 adb('shell','settings','put','global','transition_animation_scale','0');time.sleep(.65)
def motion():
 adb('shell','settings','put','global','transition_animation_scale','1');time.sleep(.65)
def nodes():
 adb('shell','rm','-f','/sdcard/paper-test.xml')
 output=adb('shell','uiautomator','dump','/sdcard/paper-test.xml')
 if 'dumped' not in output:raise RuntimeError('UIAutomator did not return a fresh hierarchy')
 xml=adb('shell','cat','/sdcard/paper-test.xml');(OUT/'latest.xml').write_text(xml)
 return list(ET.fromstring(xml).iter('node'))
def label(n):return (n.attrib.get('content-desc','')+' '+n.attrib.get('text','')).strip()
def bounds(n):return tuple(map(int,re.findall(r'\d+',n.attrib.get('bounds',''))))
def find(pattern,timeout=45):
 end=time.monotonic()+timeout;ns=[]
 while time.monotonic()<end:
  try:ns=nodes()
  except (RuntimeError,subprocess.CalledProcessError,ET.ParseError):time.sleep(.4);continue
  n=next((n for n in ns if re.search(pattern,label(n)) and n.attrib.get('clickable')=='true' and n.attrib.get('enabled')=='true' and len(bounds(n))==4 and bounds(n)[3]>bounds(n)[1]),None)
  if n is not None:return n
  time.sleep(.3)
 raise RuntimeError('Missing enabled '+pattern+': '+repr([(label(n),n.attrib.get('bounds')) for n in ns]))
def click(n,pause=.3):
 x1,y1,x2,y2=bounds(n);adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(pause)
def tap(p):click(find(p))
def shot(name):
 with (OUT/(name+'.png')).open('wb') as f:subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
 return Image.open(OUT/(name+'.png'))
def launch():
 adb('shell','am','force-stop',APP);motion();adb('shell','am','start','-W','-n',APP+'/.MainActivity');find(r'^ตั้งค่า$');quiet()
def switch(pattern):
 tap(r'^ตั้งค่า$');n=find(pattern);before=n.attrib.get('checked');click(n);after=find(pattern).attrib.get('checked');assert before!=after,(pattern,before,after);tap(r'^กลับ$');return after=='true'
def enter(immediate_shot=None):
 tap(r'^เลือกเส้นทางผีตายโหงเรือนร้าง$');button=find(r'^เดินเข้าหมู่บ้าน$');motion();click(button,pause=0)
 if immediate_shot:
  time.sleep(.25);shot(immediate_shot) # Capture BEFORE any OS reduced-motion override.
 else:time.sleep(2.2) # Complete the full normal animation BEFORE hierarchy inspection.
 quiet()
def assert_instant(name,reference,box):
 actual=Image.open(OUT/(name+'.png')).convert('RGB').crop(box)
 expected=reference.convert('RGB').crop(box)
 assert max(ImageStat.Stat(ImageChops.difference(actual,expected)).mean)<8,(name,'fixed player HP must be visible before quiet()')
def record(name,**details):checks.append({'check':name,'passed':True,**details});print('PASS native:',name,details,flush=True)
adb('shell','pm','clear',APP);adb('logcat','-c')
for key in ['window_animation_scale','transition_animation_scale','animator_duration_scale']:adb('shell','settings','put','global',key,'1')
logger=subprocess.Popen(['adb','logcat','-v','threadtime','ReactNativeJS:V','ReactNative:V','AndroidRuntime:E','*:S'],stdout=(OUT/'logcat.txt').open('w'),stderr=subprocess.STDOUT)
try:
 for w,h,density in [(720,1280,320),(720,1600,320),(1080,2340,440),(1080,2400,420),(1440,3200,560),(1080,1800,360)]:
  adb('shell','wm','size',f'{w}x{h}');adb('shell','wm','density',str(density));launch()
  route=shot(f'route-{w}x{h}');assert route.height>route.width
  entry=next(n for n in nodes() if re.search(r'^เดินเข้าหมู่บ้าน$',label(n)) and len(bounds(n))==4);assert 0<=bounds(entry)[1]<bounds(entry)[3]<=h
  enter();end=find(r'^จบเทิร์น$');battle=shot(f'battle-{w}x{h}');assert battle.size==(w,h)
  ns=nodes();cards=[n for n in ns if label(n).startswith('การ์ด ') and len(bounds(n))==4];assert cards,'Native cards must be present'
  end_y=bounds(end)[1];assert all(0<=bounds(n)[0]<bounds(n)[2]<=w and bounds(n)[3]<=end_y for n in cards),[(label(n),bounds(n),end_y) for n in cards]
  record('portrait-route-battle-safe-controls-and-hand',resolution=[w,h],density=density)
  tap(r'^กลับฉากเส้นทาง$');enter();find(r'^จบเทิร์น$');record('repeated-entry',resolution=[w,h])
 # Video uses the actual native animation, not a web renderer.
 adb('shell','wm','size','1080x2340');adb('shell','wm','density','440');launch();tap(r'^เลือกเส้นทางผีตายโหงเรือนร้าง$');button=find(r'^เดินเข้าหมู่บ้าน$')
 motion();video=subprocess.Popen(['adb','shell','screenrecord','--time-limit','6','/sdcard/paper-assembly.mp4']);time.sleep(.5);click(button,0)
 for delay,name in [(0.15,'sky'),(.4,'structures'),(.4,'ghost'),(.4,'foliage'),(.65,'assembled')]:time.sleep(delay);shot('native-assembly-'+name)
 video.wait(timeout=15);quiet();adb('pull','/sdcard/paper-assembly.mp4',str(OUT/'native-assembly.mp4'));find(r'^จบเทิร์น$');reference=shot('native-reference');hp=max((n for n in nodes() if 'พลังชีวิต' in label(n) and len(bounds(n))==4),key=lambda n:bounds(n)[1]);hpbox=bounds(hp);early=Image.open(OUT/'native-assembly-sky.png').convert('RGB').crop(hpbox);assert max(ImageStat.Stat(ImageChops.difference(early,reference.convert('RGB').crop(hpbox))).mean)>20,'ON must not show the assembled HUD immediately';record('native-assembly-recording')
 # Defaults ON, then OFF survives a process restart in AsyncStorage.
 assert switch(r'^ฉากประกอบเคลื่อนไหว \(Diorama Animation\)$') is False
 launch();tap(r'^ตั้งค่า$');assert find(r'^ฉากประกอบเคลื่อนไหว \(Diorama Animation\)$').attrib.get('checked')=='false';tap(r'^กลับ$');enter('native-OFF');assert_instant('native-OFF',reference,hpbox);find(r'^จบเทิร์น$');record('OFF-persisted-after-cold-restart')
 assert switch(r'^ฉากประกอบเคลื่อนไหว \(Diorama Animation\)$') is True
 assert switch(r'^ลดการเคลื่อนไหวของฉาก$') is True
 launch();enter('native-reduced');assert_instant('native-reduced',reference,hpbox);find(r'^จบเทิร์น$');record('reduced-motion-with-ON')
 assert switch(r'^ลดการเคลื่อนไหวของฉาก$') is False
 launch();tap(r'^ตั้งค่า$');assert find(r'^ฉากประกอบเคลื่อนไหว \(Diorama Animation\)$').attrib.get('checked')=='true';tap(r'^กลับ$');record('ON-persisted-after-cold-restart')
 log=adb('logcat','-d');assert not re.search(r'FATAL EXCEPTION|WorkletError|TypeError:|ReferenceError:|ReactNativeJS: Error:',log),log[-5000:]
 record('no-native-crash-or-worklet-errors');assert adb('shell','pidof',APP).strip()
 (OUT/'gfxinfo.txt').write_text(adb('shell','dumpsys','gfxinfo',APP,'framestats'))
finally:
 logger.terminate();(OUT/'results.json').write_text(json.dumps({'checks':checks,'physicalAndroidProfiled':False},indent=2));adb('shell','wm','size','reset');adb('shell','wm','density','reset');adb('shell','settings','put','global','transition_animation_scale','1')
