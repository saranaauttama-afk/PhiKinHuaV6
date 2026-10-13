const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
(async()=>{
 const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-v35-web',reports=[],errors=[];
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});await new Promise(r=>server.listen(8136,'127.0.0.1',r));
 const browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
 const box=async locator=>{const b=await locator.boundingBox();assert(b);return b;};
 try{
  for(const viewport of [{width:320,height:568},{width:360,height:640},{width:393,height:852},{width:412,height:915}]){
   for(const reduced of [false,true]){
    const ctx=await browser.newContext({viewport}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
    const save=JSON.parse(fs.readFileSync(root+'/v35-battle.json','utf8'));
    await ctx.addInitScript(({save,reduced})=>{if(!sessionStorage.getItem('v35-seeded')){localStorage.clear();localStorage.setItem('phikinhua_autosave',JSON.stringify(save));localStorage.setItem('phi-ui-settings',JSON.stringify({reducedMotion:reduced}));sessionStorage.setItem('v35-seeded','1');}}, {save,reduced});
    await p.goto('http://127.0.0.1:8136');await p.getByRole('button',{name:/^เล่นต่อ/}).click();await p.getByRole('button',{name:'จบเทิร์น',exact:true}).waitFor();
    const metrics=async()=>JSON.parse(await p.getByTestId('v33-battle-state').textContent());
    assert.equal((await metrics()).enemyHand,1);assert.equal(await p.getByTestId('enemy-held-0').count(),1);
    const rack=await box(p.getByTestId('enemy-held-hand')),hud=await box(p.getByTestId('enemy-hud-0')),history=await box(p.getByTestId('card-history'));
    assert(rack.y+rack.height<=hud.y+1);assert(history.y+history.height<=rack.y);assert.equal(await p.getByText('ข้าม ▸▸',{exact:true}).count(),0);
    await p.getByTestId('hand-card-v35-opening-0').click();await p.getByRole('button',{name:'ใช้การ์ด',exact:true}).click();
    assert.equal((await metrics()).history.length,1);assert.equal((await metrics()).history[0].side,'player');
    await p.evaluate(()=>{window.v35Dealt=[];const hand=document.querySelector('[data-testid="battle-hand"]');window.v35Observer=new MutationObserver(()=>{for(const e of hand.querySelectorAll('[data-testid^="hand-card-v35-draw-"]'))if(!window.v35Dealt.some(s=>s.id===e.dataset.testid))window.v35Dealt.push({id:e.dataset.testid,transform:getComputedStyle(e).transform});});window.v35Observer.observe(hand,{childList:true,subtree:true});});
    await p.getByRole('button',{name:'จบเทิร์น',exact:true}).click();
    await p.waitForFunction(()=>{const e=document.querySelector('[data-testid="v33-battle-state"]');return e&&JSON.parse(e.textContent).presentedEnemyHand===3;},null,{timeout:10000});
    assert.equal(await p.getByTestId('enemy-held-2').count(),1);assert.equal(await p.getByText('ข้าม ▸▸',{exact:true}).count(),0);
    await p.getByTestId('enemy-card-face-0').waitFor();
    // Native owner anchors and scaled card must stay clear of the HUD.
    await p.waitForTimeout(600);const revealed=await box(p.getByTestId('enemy-card-face-0'));assert(revealed.y>=history.y+history.height-1);assert(revealed.y+revealed.height<=hud.y+1);
    await p.waitForFunction(()=>{const e=document.querySelector('[data-testid="v33-battle-state"]');if(!e)return false;const s=JSON.parse(e.textContent);return s.turn===2&&s.uiPhase==='player';},null,{timeout:30000});
    const after=await metrics();await p.waitForTimeout(750);const dealt=await p.evaluate(()=>window.v35Dealt.map(s=>({...s,final:getComputedStyle(document.querySelector('[data-testid="'+s.id+'"]')).transform})));assert.equal(dealt.length,2);if(!reduced)assert(dealt.some(s=>s.transform!==s.final),'new cards must animate into the hand');await p.evaluate(()=>window.v35Observer.disconnect());assert.equal(after.enemyHand,1);assert.equal(after.presentedEnemyHand,1);assert.deepEqual(after.history.map(e=>e.side),['player','enemy','enemy']);assert.equal(await p.getByTestId('enemy-held-0').count(),1);assert.equal(after.hand.filter(id=>id==='qa_phra_prathan').length,1);
    const played=after.history[2];await p.getByTestId('history-'+played.seq).click();await p.getByText('ผลที่เกิดขึ้น',{exact:true}).waitFor();await p.getByText(played.card.name,{exact:true}).waitFor();for(const line of played.results)await p.getByText(line,{exact:true}).waitFor();await p.getByRole('button',{name:'ปิดประวัติ',exact:true}).click();
    await p.getByRole('button',{name:'พักการต่อสู้',exact:true}).click();await p.getByRole('button',{name:'กลับเมนูหลัก',exact:true}).click();await p.getByRole('button',{name:/^เล่นต่อ/}).waitFor();
    const persisted=await p.evaluate(()=>JSON.parse(localStorage.getItem('phikinhua_autosave')));assert.deepEqual(persisted.state.cardHistory,after.history);assert.equal(persisted.state.enemyPiles.hand.length,1);
    await p.goto('http://127.0.0.1:8136/');await p.getByRole('button',{name:/^เล่นต่อ/}).click();await p.getByRole('button',{name:'จบเทิร์น',exact:true}).waitFor();const restored=await metrics();assert.deepEqual(restored.history,after.history);assert.equal(restored.enemyHand,1);
    reports.push({viewport,reduced,check:'draw, reveal, retained hand, combined history, QA card and cold resume',result:'passed'});await ctx.close();
   }
   const ctx=await browser.newContext({viewport}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));const save=JSON.parse(fs.readFileSync(root+'/v35-map.json','utf8'));
   await ctx.addInitScript(save=>{localStorage.clear();localStorage.setItem('phikinhua_autosave',JSON.stringify(save));},save);
   await p.goto('http://127.0.0.1:8136');await p.getByRole('button',{name:/^เล่นต่อ/}).click();
   const shopIndex=save.state.pages.current.offers.findIndex(o=>o.kind==='shop_card');assert(shopIndex>=0);
   await p.getByTestId('adventure-slot-'+shopIndex).click();const enter=p.getByTestId('adventure-enter-'+shopIndex);assert((await box(enter)).height>=44);await enter.click();
   await p.getByTestId('shop-destroy-page').waitFor();const stock=await p.getByTestId('shop-card-0').count();assert(stock>0);
   await p.getByTestId('shop-card-0').click();await p.getByRole('button',{name:/^ยืนยันซื้อ \d+ เบี้ย$/}).click();
   await p.getByRole('button',{name:'กลับจุดพัก',exact:true}).click();await p.getByTestId('adventure-slot-'+shopIndex).waitFor();
   await p.getByTestId('adventure-slot-'+shopIndex).click();await p.getByTestId('adventure-enter-'+shopIndex).click();await p.getByTestId('shop-destroy-page').waitFor();
   assert.equal(await p.getByTestId('shop-card-2').count(),0);await p.getByTestId('shop-destroy-page').click();await p.getByTestId('adventure-choices').waitFor();assert.equal(await p.getByTestId('adventure-slot-'+shopIndex).count(),0);
   reports.push({viewport,check:'themed encounter entry, shop purchase, persistent return and explicit X',result:'passed'});await ctx.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS',reports.length,'v35 mobile checks; no captures');
 }finally{fs.mkdirSync('backlog-audit',{recursive:true});fs.writeFileSync('backlog-audit/v35-mobile-ui.json',JSON.stringify({reports,errors,screenshots:false},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
