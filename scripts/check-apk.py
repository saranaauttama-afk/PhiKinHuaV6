"""Inspect ELF load alignment and local ZIP offsets of the 64-bit libraries."""
import json, struct, sys, zipfile
path = sys.argv[1]
checks = []
with zipfile.ZipFile(path) as z, open(path, 'rb') as f:
    assert any(n == 'assets/index.android.bundle' for n in z.namelist()), 'Missing offline JS bundle'
    abis = sorted({n.split('/')[1] for n in z.namelist() if n.startswith('lib/')})
    assert 'arm64-v8a' in abis and 'x86_64' in abis, abis
    for n in z.namelist():
        if not (n.startswith('lib/arm64-v8a/') or n.startswith('lib/x86_64/')): continue
        d = z.read(n)
        assert d[:4] == b'\x7fELF' and d[4] == 2, n
        off = struct.unpack_from('<Q', d, 32)[0]
        size, num = struct.unpack_from('<HH', d, 54)
        aligns = [struct.unpack_from('<Q', d, off + i * size + 48)[0]
                  for i in range(num) if struct.unpack_from('<I', d, off + i * size)[0] == 1]
        assert aligns and min(aligns) >= 16384, (n, aligns)
        info = z.getinfo(n)
        f.seek(info.header_offset + 26)
        name_len, extra_len = struct.unpack('<HH', f.read(4))
        offset = info.header_offset + 30 + name_len + extra_len
        if info.compress_type == 0: assert offset % 16384 == 0, (n, offset)
        checks.append({'file': n, 'elf_align': min(aligns), 'zip_aligned_16k': offset % 16384 == 0})
print(json.dumps({'abis': abis, 'libraries': checks}, indent=2))
