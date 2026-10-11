"""Native isolated prototype checks; never touch the production application data."""
import json,re,subprocess,time,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image
APP='com.phikinhua.dioramatest'; OUT=Path('paper-native-audit');OUT.mkdir(exist_ok=True)
checks=[]
def adb(*args):return subprocess.check_output(['adb',*args],text=True)
def nodes():
 adb('shell','uiautomator','dump','/sdcard/paper-test.xml')
 xml=adb('shell','cat','/sdcard/paper-test.xml');(OUT/'latest.xml').write_text(xml)
 return list(ET.fromstring(xml).iter('node'))
def label(n):return (n.attrib.get('content-desc','')+' '+n.attrib.get('text','')).strip()
def bounds(n):return tuple(map(int,re.findall(r'\d+',n.attrib.get('bounds',''))))
def find(pattern,timeout=35):
 end=time.monotonic()+timeout
 while time.monotonic()<end:
  ns=nodes()
  n=next((n for n in ns if re.search(pattern,label(n)) and n.attrib.get('enabled')=='true' and len(bounds(n))==4 and bounds(n)[3]>bounds(n)[1]),None)
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
 adb('shell','am','force-stop',APP);adb('shell','am','start','-W','-n',APP+'/.MainActivity');find(r'^ตั้งค่า$')
def switch(pattern):
 tap(r'^ตั้งค่า$');n=find(pattern);before=n.attrib.get('checked');click(n);after=find(pattern).attrib.get('checked');assert before!=after,(pattern,before,after);tap(r'^กลับ$');return after=='true'
def enter():tap(r'^เลือกเส้นทางผีตายโหงเรือนร้าง$');click(find(r'^เดินเข้าหมู่บ้าน$'),pause=0)
def record(name,**details):checks.append({'check':name,'passed':True,**details});print('PASS native:',name,details,flush=True)
adb('shell','pm','clear',APP);adb('logcat','-c')
for key in ['window_animation_scale','transition_animation_scale','animator_duration_scale']:adb('shell','settings','put','global',key,'1')
logger=subprocess.Popen(['adb','logcat','-v','threadtime','ReactNativeJS:V','ReactNative:V','AndroidRuntime:E','*:S'],stdout=(OUT/'logcat.txt').open('w'),stderr=subprocess.STDOUT)
try:
 for w,h,density in [(720,1280,320),(720,1600,320),(1080,2340,440),(1080,2400,420),(1440,3200,560),(1080,1800,360)]:
  adb('shell','wm','size',f'{w}x{h}');adb('shell','wm','density',str(density));launch()
  route=shot(f'route-{w}x{h}');assert route.height>route.width
  entry=find(r'^เดินเข้าหมู่บ้าน$');assert 0<=bounds(entry)[1]<bounds(entry)[3]<=h
  enter();end=find(r'^จบเทิร์น$');battle=shot(f'battle-{w}x{h}');assert battle.size==(w,h)
  ns=nodes();cards=[n for n in ns if label(n).startswith('การ์ด ') and len(bounds(n))==4];assert cards,'Native cards must be present'
  end_y=bounds(end)[1];assert all(0<=bounds(n)[0]<bounds(n)[2]<=w and bounds(n)[3]<=end_y for n in cards),[(label(n),bounds(n),end_y) for n in cards]
  record('portrait-route-battle-safe-controls-and-hand',resolution=[w,h],density=density)
  tap(r'^กลับฉากเส้นทาง$');enter();find(r'^จบเทิร์น$');record('repeated-entry',resolution=[w,h])
 # Video uses the actual native animation, not a web renderer.
 adb('shell','wm','size','1080x2340');adb('shell','wm','density','440');launch();tap(r'^เลือกเส้นทางผีตายโหงเรือนร้าง$');button=find(r'^เดินเข้าหมู่บ้าน$')
 video=subprocess.Popen(['adb','shell','screenrecord','--time-limit','6','/sdcard/paper-assembly.mp4']);time.sleep(.5);click(button,0)
 for delay,name in [(0.15,'sky'),(.4,'structures'),(.4,'ghost'),(.4,'foliage'),(.65,'assembled')]:time.sleep(delay);shot('native-assembly-'+name)
 video.wait(timeout=15);adb('pull','/sdcard/paper-assembly.mp4',str(OUT/'native-assembly.mp4'));find(r'^จบเทิร์น$');record('native-assembly-recording')
 # Defaults ON, then OFF survives a process restart in AsyncStorage.
 assert switch(r'^ฉากประกอบเคลื่อนไหว \(Diorama Animation\)$') is False
 launch();tap(r'^ตั้งค่า$');assert find(r'^ฉากประกอบเคลื่อนไหว \(Diorama Animation\)$').attrib.get('checked')=='false';tap(r'^กลับ$');enter();find(r'^จบเทิร์น$');shot('native-OFF');record('OFF-persisted-after-cold-restart')
 assert switch(r'^ฉากประกอบเคลื่อนไหว \(Diorama Animation\)$') is True
 assert switch(r'^ลดการเคลื่อนไหวของฉาก$') is True
 launch();enter();find(r'^จบเทิร์น$');shot('native-reduced');record('reduced-motion-with-ON')
 assert switch(r'^ลดการเคลื่อนไหวของฉาก$') is False
 launch();tap(r'^ตั้งค่า$');assert find(r'^ฉากประกอบเคลื่อนไหว \(Diorama Animation\)$').attrib.get('checked')=='true';tap(r'^กลับ$');record('ON-persisted-after-cold-restart')
 log=adb('logcat','-d');assert not re.search(r'FATAL EXCEPTION|WorkletError|TypeError:|ReferenceError:|ReactNativeJS: Error:',log),log[-5000:]
 record('no-native-crash-or-worklet-errors');assert adb('shell','pidof',APP).strip()
 (OUT/'gfxinfo.txt').write_text(adb('shell','dumpsys','gfxinfo',APP,'framestats'))
finally:
 logger.terminate();(OUT/'results.json').write_text(json.dumps({'checks':checks,'physicalAndroidProfiled':False},indent=2));adb('shell','wm','size','reset');adb('shell','wm','density','reset')
