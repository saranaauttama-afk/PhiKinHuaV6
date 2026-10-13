const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
(async()=>{
 const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-phase7-web',out=process.env.PHIKINHUA_AUDIT_DIR||'phase7-audit';fs.mkdirSync(out,{recursive:true});const errors=[],checks=[];
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});await new Promise(r=>server.listen(8138,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.PHIKINHUA_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const open=async(viewport,file)=>{
  const ctx=await browser.newContext({viewport}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  const save=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  await ctx.addInitScript(save=>{if(!sessionStorage.getItem('phase7')){localStorage.clear();localStorage.setItem('phikinhua_autosave',JSON.stringify(save));localStorage.setItem('phi-ui-settings',JSON.stringify({reducedMotion:true}));sessionStorage.setItem('phase7','1');}},save);
  await p.goto('http://127.0.0.1:8138');await p.getByRole('button',{name:/^เล่นต่อ/}).click();return {ctx,p,save};
 };
 const inBounds=async(p,locator)=>{await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();assert(b);const v=p.viewportSize();assert(b.x>=-1&&b.y>=-1&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1,JSON.stringify(b));};
 try{
  for(const viewport of [{width:320,height:568},{width:360,height:640},{width:393,height:852},{width:412,height:915}]){
   for(const cls of ['warrior','shaman','nun','medium']){
    const {ctx,p}=await open(viewport,`phase7-${cls}.json`);await p.getByRole('button',{name:'สำรับ 10',exact:true}).click();await p.getByText('ทั้งหมด 10 ใบ · แตะการ์ดเพื่ออ่านรายละเอียด',{exact:true}).waitFor();
    // Each owned card is represented in a typed section, including Action/Spell/Prayer/Mana.
    const headings=await p.locator('body').innerText();assert(headings.includes('วิชา'));if(cls==='shaman'||cls==='medium')assert(headings.includes('คาถา'));if(cls==='nun')assert(headings.includes('บทสวด'));
    await p.screenshot({path:`${out}/deck-${cls}-${viewport.width}.png`,fullPage:false});checks.push({viewport,check:`${cls} starter 10 visible`,result:'passed'});await ctx.close();
   }
   const {ctx,p,save}=await open(viewport,'phase7-all-types.json');await p.getByRole('button',{name:'สำรับ 8',exact:true}).click();
   for(const label of ['โจมตี','วิชา','คาถา','เครื่องราง','มานา','บทสวด','สวนกลับ','คำสาป'])assert((await p.locator('body').innerText()).includes(`${label} (1 ใบ)`));
   await p.getByRole('button',{name:'ปิด',exact:true}).click();await p.getByTestId('adventure-slot-0').click();await p.getByTestId('adventure-enter-0').click();
   await p.getByText('เตรียมเครื่องราง',{exact:true}).waitFor();await p.getByRole('button',{name:/^เลือกเครื่องราง/}).click();await inBounds(p,p.getByTestId('equipment-confirm'));await p.screenshot({path:`${out}/prepare-${viewport.width}.png`});await p.getByTestId('equipment-confirm').click();
   await p.getByRole('button',{name:'จบเทิร์น',exact:true}).waitFor();const m=JSON.parse(await p.getByTestId('v33-battle-state').textContent());assert.equal(m.equipped.length,1);assert(!m.hand.includes('equipment_iron_bracer'));await p.getByRole('button',{name:/^ดูเครื่องราง /}).click();await p.getByTestId('status-detail-paper').waitFor();await p.getByTestId('status-detail-close').click();checks.push({viewport,check:'8 types and owned pre-equipment',result:'passed'});await ctx.close();
   const archive=await browser.newContext({viewport}),ap=await archive.newPage();ap.on('pageerror',e=>errors.push(e.message));await ap.goto('http://127.0.0.1:8138');await ap.getByRole('button',{name:'บันทึกอาถรรพ์ · ผีและการ์ด',exact:true}).click();await ap.getByRole('button',{name:'การ์ด',exact:true}).click();await ap.getByRole('button',{name:'ทุกประเภท',exact:true}).click();
   for(const label of ['โจมตี','วิชา','คาถา','เครื่องราง','มานา','บทสวด','สวนกลับ','คำสาป'])await ap.getByRole('button',{name:label,exact:true}).waitFor();await ap.getByRole('button',{name:'บทสวด',exact:true}).click();await ap.getByRole('button',{name:'บทสวด',exact:true}).waitFor();await ap.screenshot({path:`${out}/archive-${viewport.width}.png`});checks.push({viewport,check:'archive filter offers all eight current types',result:'passed'});await archive.close();
   const q=await open(viewport,'phase7-prayer.json');const page=q.p;await page.getByRole('button',{name:'จบเทิร์น',exact:true}).waitFor();
   const metrics=async()=>JSON.parse(await page.getByTestId('v33-battle-state').textContent());assert.equal((await metrics()).prayers[0].turnsLeft,3);
   await page.getByRole('button',{name:/^ดูบทสวด /}).click();assert((await page.getByTestId('status-detail-paper').innerText()).includes('เหลือ 3 เทิร์น'));await page.getByTestId('status-detail-close').click();await page.screenshot({path:`${out}/prayer-${viewport.width}.png`});
   for(const left of [2,1,0]){await page.getByRole('button',{name:'จบเทิร์น',exact:true}).click();await page.waitForFunction(left=>{const e=document.querySelector('[data-testid="v33-battle-state"]');if(!e)return false;const s=JSON.parse(e.textContent);return s.uiPhase==='player'&&(left===0?s.prayers.length===0:s.prayers[0]?.turnsLeft===left)},left,{timeout:30000});}
   // Pause time is excluded from the actual UI/store wiring, not just the helper.
   await page.getByRole('button',{name:'พักการต่อสู้',exact:true}).click();await page.waitForTimeout(150);const before=(await metrics()).activeMs.combat;await page.waitForTimeout(1600);const after=(await metrics()).activeMs.combat;assert.equal(after,before);
   await page.getByRole('button',{name:'กลับเมนูหลัก',exact:true}).click();await page.getByRole('button',{name:/^เล่นต่อ/}).waitFor();const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('phikinhua_autosave')));assert.equal(persisted.state.prayers.length,0);assert.equal(persisted.state.equipped.length,1);checks.push({viewport,check:'prayer 3/2/1/resolved, detail, pause exclusion, saved equipment',result:'passed'});await q.ctx.close();
  }
  assert.deepEqual(errors,[]);console.log(`PASS ${checks.length} Phase 7 mobile checks`);
 }catch(e){checks.push({result:'failed',error:String(e)});throw e;}finally{fs.writeFileSync(`${out}/mobile-results.json`,JSON.stringify({syntheticFixtures:true,checks,errors},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
