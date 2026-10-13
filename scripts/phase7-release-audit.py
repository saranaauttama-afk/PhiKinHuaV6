"""Scoped publication check. Reports filenames only; never prints matched credentials."""
import hashlib, json, re, subprocess
from pathlib import Path
base = 'bce58b93333e02e9ca214c0468e59bd5d89fada1'
paths = subprocess.check_output(['git','diff','--name-only',base],text=True).splitlines()
paths += subprocess.check_output(['git','ls-files','--others','--exclude-standard'],text=True).splitlines()
patterns = [r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',r'\bgh[pousr]_[A-Za-z0-9]{30,}\b',r'\bgithub_pat_[A-Za-z0-9_]{40,}\b',r'\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b',r'\bAKIA[A-Z0-9]{16}\b']
findings=[]
for name in sorted(set(paths)):
 p=Path(name)
 if not p.is_file():continue
 if p.name.startswith('.env') and p.name!='.env.example' or p.suffix in ['.pem','.jks','.p12','.key']:findings.append({'file':name,'reason':'credential material filename'})
 try:s=p.read_text()
 except UnicodeDecodeError:continue
 if any(re.search(pattern,s) for pattern in patterns):findings.append({'file':name,'reason':'high-confidence credential pattern'})
 # New content is code/data and synthetic test evidence: no personal email address should be needed.
 if re.search(r'(?<![\w@])[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',s):findings.append({'file':name,'reason':'email-like text requires review'})
report={'base':base,'filesReviewed':len(set(paths)),'scope':'Changed and untracked publishable files; key filenames, private keys, GitHub/OpenAI/AWS token patterns, email-like text. Not a guarantee against every secret format.','findings':findings}
Path('phase7-audit').mkdir(exist_ok=True);Path('phase7-audit/publication-scan.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if findings:raise SystemExit(1)
