const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
(async()=>{
 const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-backlog-web',reports=[],errors=[];
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});await new Promise(r=>server.listen(8135,'127.0.0.1',r));
 const browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 for(const viewport of [{width:360,height:640},{width:393,height:852}]){
  for(const option of ['draw','hand']){
   const ctx=await browser.newContext({viewport}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.goto('http://127.0.0.1:8135/ui-review?screen=v33-dawn');await p.getByText('ผ่านคืนแรก · เลือกพัฒนาวิชา',{exact:true}).waitFor();
   assert.equal(await p.getByRole('button',{name:'ข้ามไปก่อน',exact:true}).count(),0);
   const label=option==='draw'?'จั่วเพิ่ม':'ขนาดมือ';await p.getByRole('button',{name:label,exact:true}).click();await p.getByRole('button',{name:option==='draw'?'เพิ่มจำนวนจั่ว':'เพิ่มขนาดมือ',exact:true}).click();
   const data=JSON.parse(await p.getByTestId('qa-state').textContent());assert.equal(data.drawPerTurn,option==='draw'?3:2);assert.equal(data.openingDraw,option==='draw'?3:2);assert.equal(data.maxHandSize,option==='hand'?3:2);assert.equal(data.handReward,option);reports.push({viewport,check:'independent-dawn-'+option,result:'passed'});await ctx.close();
  }
  for(const version of ['v33','v32']){
   const ctx=await browser.newContext({viewport}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));const save=JSON.parse(fs.readFileSync(root+'/'+version+'-battle.json','utf8'));
   await ctx.addInitScript(s=>{localStorage.clear();localStorage.setItem('phikinhua_autosave',JSON.stringify(s));},save);
   await p.goto('http://127.0.0.1:8135');await p.getByRole('button',{name:/^เล่นต่อ/}).click();await p.getByRole('button',{name:'จบเทิร์น',exact:true}).waitFor();
   const metrics=async()=>JSON.parse(await p.getByTestId('v33-battle-state').textContent());const before=await metrics();assert.equal(before.cap,version==='v33'?2:6);assert.equal(before.normalHand,7);
   assert.equal(await p.getByText(/คอมโบ|combo/i).count(),0);assert.equal(await p.getByTestId('combo-completed-notice').count(),0);reports.push({viewport,check:version+'-save-no-combo',result:'passed'});
   await p.getByRole('button',{name:'จบเทิร์น',exact:true}).click();const amount=version==='v33'?5:1;
   await p.getByText(`มือเต็ม · เลือก ${amount} ใบ (0/${amount})`,{exact:true}).waitFor();assert.equal(await p.getByRole('button',{name:'พระประธาน',exact:true}).isEnabled(),false);
   for(let i=0;i<amount;i++)await p.getByRole('button',{name:'ฟันดาบวัด',exact:true}).nth(i).click();
   await p.getByRole('button',{name:`ทิ้ง ${amount}/${amount} ใบ`,exact:true}).click();
   await p.waitForFunction(()=>{const e=document.querySelector('[data-testid="v33-battle-state"]');return e&&JSON.parse(e.textContent).turn>=2;},null,{timeout:30000});
   const after=await metrics();assert.equal(after.discard,amount);assert.equal(after.normalHand,(version==='v33'?2:6)+(version==='v33'?2:3));assert.equal(after.hand.filter(id=>id==='qa_phra_prathan').length,1);assert.equal(await p.getByText(/คอมโบ|combo/i).count(),0);
   reports.push({viewport,check:version+'-exact-discard-and-next-draw',result:'passed'});await ctx.close();
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS',reports.length,'v33 mobile checks; no captures');
 }finally{fs.mkdirSync('backlog-audit',{recursive:true});fs.writeFileSync('backlog-audit/v33-mobile-ui.json',JSON.stringify({reports,errors,screenshots:false},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
