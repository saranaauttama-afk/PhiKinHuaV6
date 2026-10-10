const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
(async()=>{
 const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-backlog-web',reports=[],errors=[];
 const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.jpg':'image/jpeg'}[path.extname(file)])||'application/octet-stream');fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(8133,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{for(const viewport of [{width:360,height:640},{width:393,height:852}]){
  const ctx=await browser.newContext({viewport,hasTouch:true}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  const load=async screen=>{await p.goto('http://127.0.0.1:8133/ui-review?screen='+screen);await p.getByTestId('qa-state').waitFor({state:'attached'});await p.getByText('กำลังเปิดภาพจากเกม…',{exact:true}).waitFor({state:'hidden'});};
  const objectSources=[];
  for(const kind of ['shop_card','shop_equipment','shop_upgrade','shop_remove','well','healing_shrine','treasure','treasure_single','fusion_altar','story_event','next_event']){
   await load('adventure-prop-'+kind);const prop=p.getByTestId('adventure-prop-1').locator('img'),src=await prop.getAttribute('src');assert.ok(src);objectSources.push(src);
   await p.getByTestId('adventure-slot-1').click();assert.equal(await prop.getAttribute('src'),src);
   if(kind!=='next_event'){
    await p.getByRole('button',{name:/^(เข้าร้าน|ปลุกเสก|สละการ์ด|ดื่มน้ำ|พักฟื้น|รับสมบัติ|ผสานการ์ด) · |^สำรวจเรื่องราว$/}).click();
    const destination=p.getByTestId(kind==='story_event'?'story-object':'destination-object');await destination.waitFor();assert.equal(await destination.locator('img').getAttribute('src'),src,'route/destination artwork mismatch: '+kind);
    if(kind==='story_event'){await p.getByTestId('event-choice-0').click();await p.getByRole('button',{name:/^ยืนยัน · /}).click();}
    await p.getByRole('button',{name:'กลับจุดพัก',exact:true}).click();if(kind!=='story_event')assert.equal(await p.getByTestId('adventure-prop-1').locator('img').getAttribute('src'),src);
   }
   reports.push({viewport,check:'distinct-matched-object-'+kind,result:'passed'});
  }
  assert.equal(new Set(objectSources).size,objectSources.length);
  await load('adventure-1');assert.equal(await p.getByText('เลือกหนึ่งหน้า · หน้าอื่นยังรออยู่',{exact:true}).count(),0);
  await load('hand');const hud=p.getByTestId('enemy-hud-0');assert.equal(await p.getByRole('button',{name:'ที่มา',exact:true}).count(),0);
  const labels=await hud.locator('[aria-label]').evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')).filter(x=>/^(พลัง|เกราะ|การ์ดในมือ) \d/.test(x)));assert.match(labels[0],/^พลัง /);assert.match(labels[1],/^เกราะ /);assert.match(labels[2],/^การ์ดในมือ /);
  const card=p.getByRole('button',{name:/^การ์ด /}).first();assert.ok(!(await card.textContent()).includes('ขั้น 0'));
  const stats=p.getByTestId('player-hud');const labelsBox=await stats.locator('[aria-label]').evaluateAll(els=>els.filter(e=>/^(พลังงาน|ป้องกัน|สำรับ)/.test(e.getAttribute('aria-label')||'')).map(e=>({label:e.getAttribute('aria-label'),x:e.getBoundingClientRect().x})));assert.ok(labelsBox.every((b,i)=>i===0||b.x>=labelsBox[i-1].x));
  reports.push({viewport,check:'card-cost-upgrade-hud-order-and-removed-copy',result:'passed'});
  await load('shop-upgrade');assert.ok(await p.getByText('+3',{exact:true}).count()>0);assert.equal(await p.getByText('ขั้น 0',{exact:true}).count(),0);await p.getByRole('button',{name:/^ดูการ์ด /}).nth(1).click();assert.ok(await p.getByText('+1',{exact:true}).count()>0);assert.ok(await p.getByText('ปลุกเสกขั้น 1',{exact:true}).count()>0);reports.push({viewport,check:'readable-real-upgrade-before-after',result:'passed'});
  await ctx.close();
 }assert.deepEqual(errors,[]);console.log('PASS',reports.length,'final tuning mobile checks; no captures.');}
 finally{fs.mkdirSync('backlog-audit',{recursive:true});fs.writeFileSync('backlog-audit/final-tuning-ui.json',JSON.stringify({reports,errors,screenshots:false},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
