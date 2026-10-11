"""Update only the bundled JS in an audited APK; no assets/dependencies may differ."""
import sys, zipfile
from pathlib import Path
base,bundle,output=map(Path,sys.argv[1:])
assert bundle.stat().st_size>100000,'Missing release Hermes bundle'
with zipfile.ZipFile(base) as src,zipfile.ZipFile(output,'w') as dst:
    assert 'assets/index.android.bundle' in src.namelist()
    for entry in src.infolist():
        if entry.filename.startswith('META-INF/') and entry.filename.upper().endswith(('.SF','.RSA','.DSA','.EC')):continue
        data=bundle.read_bytes() if entry.filename=='assets/index.android.bundle' else src.read(entry.filename)
        dst.writestr(entry,data)
print('Replaced embedded release JS; native libraries and assets preserved.')
