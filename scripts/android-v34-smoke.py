"""Launch/install/cold-reopen smoke for the signed v34 test APK. No screenshots."""
import json, subprocess, time
from pathlib import Path
out=Path('v34-native-audit');out.mkdir(exist_ok=True)
app='com.phikinhua.episode'
def adb(*args):return subprocess.check_output(['adb',*args],text=True,stderr=subprocess.STDOUT)
adb('logcat','-c')
checks=[]
for i in range(2):
    adb('shell','am','force-stop',app)
    adb('shell','am','start','-W','-n',app+'/.MainActivity')
    deadline=time.time()+45
    while time.time()<deadline:
        try:
            adb('shell','uiautomator','dump','/sdcard/v34.xml')
            xml=adb('shell','cat','/sdcard/v34.xml')
            if 'ผีกินหัว' in xml or 'PhiKinHua' in xml or 'เริ่ม' in xml:
                break
        except subprocess.CalledProcessError:pass
        time.sleep(2)
    else:raise AssertionError('No visible game screen within 45 seconds')
    assert adb('shell','pidof',app).strip()
    (out/f'launch-{i}.xml').write_text(xml)
    checks.append('initial launch' if i==0 else 'cold reopen')
log=adb('logcat','-d');(out/'logcat.txt').write_text(log)
assert 'FATAL EXCEPTION' not in log and 'JavascriptException' not in log
(out/'result.json').write_text(json.dumps({'checks':checks,'screenshots':False,'scope':'install, launch and cold reopen; engine battle coverage is in Vitest and paired simulations'},indent=2))
