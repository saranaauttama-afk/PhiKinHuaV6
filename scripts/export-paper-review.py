"""Export the actual prototype without router paths, for an offline review file.
Temporarily override only the export entry; always restore package.json.
"""
import json,os,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1];p=root/'package.json';original=p.read_bytes()
try:
 package=json.loads(original);package['main']='preview/paper-entry.tsx';p.write_text(json.dumps(package,indent=2)+'\n')
 env={**os.environ,'EXPO_PUBLIC_PAPER_DIORAMA':'1'}
 subprocess.run(['npx','expo','export','--platform','web','--output-dir','/tmp/assembly-review-web'],cwd=root,env=env,check=True)
finally:p.write_bytes(original)
