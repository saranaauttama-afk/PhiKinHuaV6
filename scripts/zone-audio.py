#!/usr/bin/env python3
"""Convert ElevenLabs zone-audio downloads into game assets (ชุด 3, docs/audio/AUDIO.md).

Usage: python3 scripts/zone-audio.py <folder with downloaded mp3s>

Files are matched by the game id in their name (the flow boxes are labelled "NN <id>",
so a download like "05 templeBed.mp3" or "05_templeBed.mp3" works). For every id found:
- beds (…Bed, battleDrum…): lowpass 10 kHz (AI hiss), gain to the target loudness,
  limiter at −2.5 dBFS, stereo 112k, NOT trimmed (they must loop) → assets/audio/ambience/<kebab>.mp3
- one-shots: trim silence both ends, 0.3 s tail fade, gain to −21 LUFS, limiter, mono 96k
  → assets/audio/sfx/<kebab>-1.mp3
Prints the measured loudness so the manifest volumes can be checked.
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BED_TARGET = -21.0
DRUM_TARGET = -24.0
ONESHOT_TARGET = -21.0


def kebab(name: str) -> str:
    return re.sub(r'(?<!^)(?=[A-Z])', '-', name).lower()


def loudness(path: Path) -> float:
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', out)
    return float(m[-1]) if m else -70.0


def duration(path: Path) -> float:
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                         capture_output=True, text=True).stdout
    return float(out.strip() or 0)


def run(args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def main(src: Path):
    report = []
    for f in sorted(src.glob('*.mp3')):
        m = re.search(r'([a-z]+(?:[A-Z][a-z]*)+)', f.stem)
        if not m:
            print('skip (no id in name):', f.name)
            continue
        sid = m.group(1)
        is_bed = sid.endswith('Bed') or sid.startswith('battleDrum')
        gain = (DRUM_TARGET if sid.startswith('battleDrum') else BED_TARGET if is_bed else ONESHOT_TARGET) - loudness(f)
        (ROOT / 'assets/audio/ambience').mkdir(parents=True, exist_ok=True)
        if is_bed:
            out = ROOT / 'assets/audio/ambience' / f'{kebab(sid)}.mp3'
            lp = '' if sid.startswith('battleDrum') else 'lowpass=f=10000,'
            run(['-i', str(f), '-af', f'{lp}volume={gain:.1f}dB,alimiter=limit=0.75:level=false',
                 '-ar', '44100', '-ac', '2', '-b:a', '112k', str(out)])
        else:
            out = ROOT / 'assets/audio/sfx' / f'{kebab(sid)}-1.mp3'
            tmp = out.with_suffix('.tmp.wav')
            # Gain first: a very quiet source (e.g. a distant owl at −40 LUFS) sits under the −50 dB
            # silence threshold and would be trimmed away entirely.
            run(['-i', str(f), '-af', f'volume={gain:.1f}dB,silenceremove=start_periods=1:start_threshold=-50dB,areverse,'
                 'silenceremove=start_periods=1:start_threshold=-50dB,areverse', str(tmp)])
            d = duration(tmp)
            run(['-i', str(tmp), '-af', f'afade=t=out:st={max(0, d - 0.3):.2f}:d=0.3,'
                 'alimiter=limit=0.75:level=false', '-ac', '1', '-ar', '44100', '-b:a', '96k', str(out)])
            tmp.unlink()
        report.append({'id': sid, 'file': str(out.relative_to(ROOT)), 'bed': is_bed,
                       'lufs': round(loudness(out), 1), 'secs': round(duration(out), 2)})
        print(f"{sid:28s} → {report[-1]['file']}  {report[-1]['lufs']} LUFS  {report[-1]['secs']} s")
    (ROOT / 'docs/audio/zone-audio-files.json').write_text(json.dumps(report, ensure_ascii=False, indent=1) + '\n')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
