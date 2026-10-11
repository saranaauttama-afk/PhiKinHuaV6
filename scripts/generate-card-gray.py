"""Rebuild native grayscale hand-card art, retaining ink detail and transparency."""
from pathlib import Path
import re
from PIL import Image, ImageOps
ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'app/cardArt.ts').read_text().split('export const GRAY_CARD_ART_SOURCES')[0]
paths = set(re.findall(r"require\('([^']+)'\)", source))
paths.update('../assets/ui/' + name + '.png' for name in ['card-clap','card-sword','card-stance','card-parry','card-breath','ritual-knife','ritual-jar','trail-ghost','occupation-page'])
for relative in sorted(paths):
    original = ROOT / 'app' / relative
    target = ROOT / 'assets/ui/card-gray' / (original.stem + '.webp')
    if target.exists() and target.stat().st_mtime >= original.stat().st_mtime:
        try:
            Image.open(target).load()
            continue
        except OSError:
            pass
    image = Image.open(original).convert('RGBA')
    image.thumbnail((512, 512))
    gray = ImageOps.grayscale(image).convert('RGBA')
    gray.putalpha(image.getchannel('A'))
    target = ROOT / 'assets/ui/card-gray' / (original.stem + '.webp')
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix('.tmp.webp')
    gray.save(temporary, quality=88, method=2)
    temporary.replace(target)
