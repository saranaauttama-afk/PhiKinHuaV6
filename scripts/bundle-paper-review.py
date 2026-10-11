"""Bundle exact Expo prototype export as a browser-openable review HTML.
No copied UI or animation implementation. Review assets are embedded, including the complete preview starter deck.
"""
import base64,mimetypes,re,json,sys
from pathlib import Path
root=Path('/tmp/assembly-review-web');html=(root/'index.html').read_text()
jsfile=re.search(r'<script src="([^"]+)"[^>]*></script>',html).group(1)
js=(root/jsfile.lstrip('/')).read_text()
# Asset registry stores relative httpServerLocation, name and hash. Replace
# its resolved asset URLs via a compact registry table, not Metro code edits.
assets={}
# CI can supply its ordered browser-audit directory.
import os
loaded=json.loads((Path(os.environ.get("PAPER_AUDIT_DIR","/tmp/paper-assembly-audit"))/"assets.json").read_text())
warrior={"temple_blade","muay_stance","ward_riposte","threefold_strike","parry_step","thunder_clap","fighter_breath"}
for p in (root/'assets').rglob('*'):
 if p.is_file():
  # Include all artwork needed by this warrior preview, not other scenes.
  rel='/'+str(p.relative_to(root));name=rel.split('/')[-1].split('.')[0]
  from urllib.parse import unquote
  if any(unquote(u)==rel for u in loaded) or '/fonts/' in rel or '/@expo-google-fonts/' in rel or name in warrior:
   mime=mimetypes.guess_type(str(p))[0] or 'application/octet-stream';assets[rel]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
# Replace emitted static asset URIs directly; source code and scene are exact.
from urllib.parse import quote
for uri,data in assets.items():
 js=js.replace(uri,data).replace(quote(uri,safe='/@'),data)
html=re.sub(r'<title>.*?</title>','<title>PhiKinHua — Paper Assembly Review</title>',html)
html=re.sub(r'<script src="[^"]+"[^>]*></script>',lambda _: '<script>'+js.replace('</script','<\\/script')+'</script>',html)
# Inline generated stylesheet if present.
for href in re.findall(r'<link[^>]+href="([^"]+\.css)"[^>]*>',html):html=re.sub(r'<link[^>]+href="'+re.escape(href)+r'"[^>]*>',lambda _:'<style>'+(root/href.lstrip('/')).read_text()+'</style>',html)
out=Path(sys.argv[1]);out.write_text(html);print(json.dumps({'html':str(out),'bytes':out.stat().st_size,'embedded_assets':len(assets)}))
