const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
(async()=>{
 const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-backlog-web',reports=[],errors=[];
 const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.jpg':'image/jpeg'}[path.extname(file)])||'application/octet-stream');fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(8134,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{for(const viewport of [{width:360,height:640},{width:393,height:852}]){
  const ctx=await browser.newContext({viewport,hasTouch:true}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  const load=async screen=>{await p.goto('http://127.0.0.1:8134/ui-review?screen='+screen);await p.getByTestId('qa-state').waitFor({state:'attached'});await p.getByText('กำลังเปิดภาพจากเกม…',{exact:true}).waitFor({state:'hidden'});};
  for(const difficulty of [1,5]){
   await load('three-menu-'+difficulty);await p.getByRole('button',{name:'ดูระดับอาถรรพ์ 5',exact:true}).click();
   if(difficulty===1)assert.ok(await p.getByRole('button',{name:'ชนะระดับ 4 ก่อน',exact:true}).isDisabled());
   else assert.ok(await p.getByRole('button',{name:'เริ่มรอบ · ระดับ 5',exact:true}).isEnabled());
   assert.equal(await p.getByText('ผีครบทุกตัว',{exact:false}).count(),0);assert.ok(await p.getByText(/31 ศึก/).count());
   await p.getByRole('button',{name:'ดูระดับอาถรรพ์ 1',exact:true}).click();assert.ok(await p.getByRole('button',{name:'เริ่มรอบ · ระดับ 1',exact:true}).isEnabled());await p.getByRole('button',{name:'เริ่มรอบ · ระดับ 1',exact:true}).click();await p.getByText('ปุ่มตอบสนองแล้ว',{exact:true}).waitFor();reports.push({viewport,check:'difficulty-select-'+difficulty,result:'passed'});
   for(const night of [1,2,3]){
    await load(`three-map-${difficulty}-${night}`);const state=JSON.parse(await p.getByTestId('qa-state').textContent());assert.equal(state.campaign.night,night);assert.equal(state.campaign.difficulty,difficulty);assert.equal(state.adventure.deck.filter(e=>e.offer.kind==='monster').length,night===1?7:10);assert.equal(await p.getByTestId('adventure-row').count(),1);const sizes=await p.locator('[data-testid^="adventure-frame-"]').evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));assert.ok(sizes.every(s=>s.w===sizes[0].w&&s.h===sizes[0].h));reports.push({viewport,check:`framed-route-${difficulty}-${night}`,result:'passed'});
    await load(`three-story-${difficulty}-${night}`);const src=await p.getByTestId('story-object').locator('img').getAttribute('src');assert.ok(src);await p.getByTestId('event-choice-0').click();await p.getByRole('button',{name:/^ยืนยัน · /}).click();assert.ok((await p.getByTestId('qa-state').textContent()).includes('"phase":"event"'));reports.push({viewport,check:`story-${difficulty}-${night}`,result:'passed'});
    if(night>1){await load(`three-dawn-${difficulty}-${night}`);await p.getByRole('button',{name:/^(ข้ามบทนี้|เดินทางต่อ)$/}).click();const state=JSON.parse(await p.getByTestId('qa-state').textContent());assert.equal(state.campaign.night,night);assert.equal(state.fights,night===2?8:19);reports.push({viewport,check:`dawn-${difficulty}-${night}`,result:'passed'});}
   }
   await load('three-summary-'+difficulty);assert.ok(await p.getByText(`ผ่านสามคืน · ระดับ ${difficulty}!`,{exact:true}).count());assert.ok(await p.getByText(`${difficulty===5?31:30} / ${difficulty===5?31:30}`,{exact:true}).count());reports.push({viewport,check:'full-run-summary-'+difficulty,result:'passed'});
  }await ctx.close();
 }assert.deepEqual(errors,[]);console.log('PASS',reports.length,'three-night mobile checks; no captures.');}
 finally{fs.mkdirSync('backlog-audit',{recursive:true});fs.writeFileSync('backlog-audit/three-night-ui.json',JSON.stringify({reports,errors,screenshots:false},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
