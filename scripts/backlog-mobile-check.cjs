const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
(async()=>{
 const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-backlog-web';const reports=[],errors=[];
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});await new Promise(r=>server.listen(8130,'127.0.0.1',r));
 const browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 for(const viewport of [{width:360,height:640},{width:393,height:852}]){
  const ctx=await browser.newContext({viewport});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  const load=async screen=>{await p.goto('http://127.0.0.1:8130/ui-review?screen='+screen);await p.getByText('กำลังเปิดภาพจากเกม…',{exact:true}).waitFor({state:'hidden'});};
  const metrics=async()=>JSON.parse(await p.getByTestId('qa-state').textContent());
  // Real shop components, selection/cancel/confirmation through reducer, no capture.
  for(const kind of ['card','remove','upgrade']){
   await load('shop-'+kind);const before=await metrics();const cards=p.getByRole('button',{name:/^ดูการ์ด /});
   if(kind==='card'){
    await cards.first().click();assert.deepEqual(await metrics(),before);await p.getByRole('button',{name:'ยกเลิกการเลือก',exact:true}).click();assert.deepEqual(await metrics(),before);
    await cards.first().click();await p.getByRole('button',{name:/^ยืนยันซื้อ /}).click();const after=await metrics();assert.equal(after.gold,before.gold-70);assert.equal(after.deck.length,before.deck.length+1);assert.equal(after.stock,before.stock-1);
   }else{
    const label=kind==='remove'?'ยืนยันสละใบนี้':'ยืนยันปลุกเสกใบนี้';
    await cards.nth(kind==='remove'?0:2).click();assert.deepEqual(await metrics(),before);assert.equal(await p.getByRole('button',{name:label,exact:true}).isEnabled(),false);
    await p.getByRole('button',{name:'ยกเลิกการเลือก',exact:true}).click();await cards.nth(1).click();assert.deepEqual(await metrics(),before);
    if(kind==='upgrade'){await p.getByText('ก่อน',{exact:true}).waitFor();await p.getByText('หลัง',{exact:true}).waitFor();}
    await p.getByRole('button',{name:label,exact:true}).click();const after=await metrics();assert.ok(after.gold<before.gold);assert.equal(after.deck.length,before.deck.length-(kind==='remove'?1:0));if(kind==='upgrade')assert.equal(after.deck[1][1],before.deck[1][1]+1);
   }
   reports.push({viewport,check:'shop-'+kind,result:'passed'});
   await load('shop-'+kind+'-poor');const poor=await metrics();await p.getByRole('button',{name:/^ดูการ์ด /}).nth(1).click();const confirm=p.getByRole('button',{name:kind==='card'?/^ยืนยันซื้อ /:kind==='remove'?'ยืนยันสละใบนี้':'ยืนยันปลุกเสกใบนี้',exact:kind!=='card'});assert.equal(await confirm.isEnabled(),false);assert.deepEqual(await metrics(),poor);
  }
  await load('rest-cards');const restBounds=await p.locator('[data-testid^="rest-choice-"]').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height,y:r.y};}));assert.equal(restBounds.length,3);assert.ok(restBounds.every(r=>Math.abs(r.w-restBounds[0].w)<1&&Math.abs(r.h-restBounds[0].h)<1&&Math.abs(r.y-restBounds[0].y)<1));reports.push({viewport,check:'equal-rest-cards',result:'passed'});
  await load('event');const eventBefore=await metrics();const eventChoices=p.locator('[data-testid^="event-choice-"]');const eventBounds=await eventChoices.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height};}));assert.ok(eventBounds.every(r=>Math.abs(r.w-eventBounds[0].w)<1&&Math.abs(r.h-eventBounds[0].h)<1));await eventChoices.first().click();assert.deepEqual(await metrics(),eventBefore);await p.getByRole('button',{name:/^ยืนยัน · /}).click();await p.getByRole('button',{name:'กลับจุดพัก',exact:true}).click();await p.getByText('กลับจุดพักแล้ว',{exact:true}).waitFor();reports.push({viewport,check:'event-selection-confirm-return',result:'passed'});
  for(const kind of ['shop_card','shop_equipment','shop_remove','shop_upgrade','well','healing_shrine','treasure','treasure_single','fusion_altar','story_event']){
   await load('rest-'+kind);assert.equal((await metrics()).phase,'map');await p.getByRole('button').first().click();const enter=p.getByRole('button',{name:kind.startsWith('shop_')?/^เข้าร้าน/:kind==='story_event'?/^สำรวจเหตุการณ์/:/^แวะจุดพัก/});await enter.click();assert.equal((await metrics()).phase,kind==='story_event'?'event':'shop');assert.equal(await p.getByRole('button',{name:'จบเทิร์น',exact:true}).count(),0);
   if(kind==='story_event'){await p.locator('[data-testid^="event-choice-"]').first().click();await p.getByRole('button',{name:/^ยืนยัน · /}).click();}
   await p.getByRole('button',{name:'กลับจุดพัก',exact:true}).click();assert.equal((await metrics()).phase,'map');reports.push({viewport,check:'route-'+kind,result:'passed'});
  }
  await load('status');await p.getByRole('button',{name:'ดูพิษ',exact:true}).first().click();await p.getByText(/เหลือ 3 เทิร์น/).first().waitFor();await p.getByRole('button',{name:'ปิด',exact:true}).click();await p.getByRole('button',{name:/กุมาร.*เหลือ/}).click();await p.getByRole('button',{name:'ดูพิษ',exact:true}).last().click();await p.getByRole('button',{name:'ปิด',exact:true}).click();await p.getByRole('button',{name:'ปิดรายละเอียดมินเนี่ยน'}).click();reports.push({viewport,check:'status-player-minion',result:'passed'});
  await load('blessing-seals');await p.getByRole('button',{name:/^ดูพร /}).first().click();await p.getByText('พรติดตัว · แยกจากสถานะชั่วคราว').waitFor();await p.getByRole('button',{name:'ปิด',exact:true}).click();reports.push({viewport,check:'blessing-details',result:'passed'});
  await load('combo-book');await p.getByText('ตำราคอมโบ',{exact:true}).waitFor();await p.getByText('ผลเมื่อสำเร็จ',{exact:true}).first().waitFor();await p.getByText(/ป้องกัน \+6/).first().waitFor();await p.getByText(/เล่นแล้ว/).first().waitFor();await p.getByRole('button',{name:'ปิดตำรา',exact:true}).click();reports.push({viewport,check:'combo-ordered-real-payoff',result:'passed'});
  await load('levelup');const choices=p.getByRole('button',{name:/^(พลังชีวิต|พลังงาน)/});await choices.first().click();const style=await choices.first().evaluate(el=>({border:getComputedStyle(el).borderWidth,opacity:getComputedStyle(el).opacity}));assert.equal(style.border,'0px');await p.getByRole('button',{name:'เพิ่มพลังชีวิต',exact:true}).click();reports.push({viewport,check:'levelup-selection',result:'passed'});
  for(const screen of ['enemy-card','enemy-card-multi']){
   await load(screen);const owner=screen.endsWith('multi')?1:0;await p.waitForTimeout(900);const card=await p.getByTestId('enemy-played-'+owner).boundingBox(),art=await p.getByTestId('enemy-art-'+owner).boundingBox(),hud=await p.getByTestId('enemy-hud-'+owner).boundingBox();assert.ok(card&&art&&hud);assert.ok(card.y+card.height<=hud.y+1,'played card covers HUD');assert.ok(card.x+card.width<=art.x+1,'played card covers ghost');await p.getByRole('button',{name:'ดูความอ่อนแอ',exact:true}).first().click();await p.getByText(/เหลือ 3 เทิร์น/).first().waitFor();await p.getByRole('button',{name:'ปิด',exact:true}).click();reports.push({viewport,check:screen+'-status-and-geometry',result:'passed'});
  }
  // Actual main-menu->battle->card->enemy turn->pause flow from a real autosave.
  const battleSave=JSON.parse(fs.readFileSync('/tmp/phikinhua-backlog-battle.json','utf8'));
  await ctx.addInitScript(save=>{localStorage.setItem('phikinhua_autosave',JSON.stringify(save));},battleSave);
  await p.goto('http://127.0.0.1:8130');await p.getByRole('button',{name:/^เล่นต่อ/}).click();await p.getByRole('button',{name:'จบเทิร์น',exact:true}).waitFor();const seals=await p.getByTestId('player-blessing-seals').boundingBox(),end=await p.getByRole('button',{name:'จบเทิร์น',exact:true}).boundingBox();assert.ok(seals&&end&&seals.y+seals.height<=end.y+1,'blessings cover End Turn');await p.getByRole('button',{name:/^การ์ด (?!.*พระประธาน)/}).first().click();await p.getByRole('button',{name:'ใช้การ์ด',exact:true}).click();await p.getByRole('button',{name:'จบเทิร์น',exact:true}).click();await p.waitForTimeout(18000);assert.ok(await p.getByRole('button',{name:'จบเทิร์น',exact:true}).isEnabled());reports.push({viewport,check:'real-battle-enemy-turn',result:'passed'});
  await ctx.close();
 }
 assert.deepEqual(errors,[]);fs.mkdirSync('backlog-audit',{recursive:true});fs.writeFileSync('backlog-audit/mobile-ui.json',JSON.stringify({reports,errors,screenshots:false},null,2));console.log('PASS',reports.length,'mobile interaction checks; no screenshots.');
 }finally{fs.mkdirSync('backlog-audit',{recursive:true});fs.writeFileSync('backlog-audit/mobile-ui.json',JSON.stringify({reports,errors,screenshots:false},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
