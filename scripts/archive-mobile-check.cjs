const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
(async()=>{
 const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-backlog-web',reports=[],errors=[];
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});await new Promise(r=>server.listen(8132,'127.0.0.1',r));
 const browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const viewport of [{width:360,height:640},{width:393,height:852}]){
   const ctx=await browser.newContext({viewport,hasTouch:true}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
   const button=name=>p.getByRole('button',{name,exact:true});
   const load=async screen=>{await p.goto('http://127.0.0.1:8132/ui-review?screen='+screen);await p.getByTestId('qa-state').waitFor({state:'attached'});await p.getByText('กำลังเปิดภาพจากเกม…',{exact:true}).waitFor({state:'hidden'});};
   const state=async()=>JSON.parse(await p.getByTestId('qa-state').textContent());
   const pass=check=>reports.push({viewport,check,result:'passed'});
   await load('archive-empty');assert.match(await p.getByTestId('archive-summary').textContent(),/0 \/ 34/);
   await button('รายการที่ยังไม่พบ 1').click();await button('ดูรายการทั้งหมด').click();
   const before=await state();await p.getByRole('textbox',{name:'ค้นหาชื่อหรือความสามารถ'}).fill('ผีปอบ');await button('ดูผี ผีปอบ').click();await p.getByText('HP พื้นฐาน 22 · พลังจริงเพิ่มตามคืน',{exact:true}).waitFor();await button('ปิดรายละเอียด').click();assert.deepEqual(await state(),before);assert.match(await p.getByTestId('archive-summary').textContent(),/0 \/ 34/);pass('locked-ghosts-full-catalog-search-detail-no-credit');
   await p.getByRole('textbox',{name:'ค้นหาชื่อหรือความสามารถ'}).fill('');await button('ทุกกลุ่ม').click();await button('บอสแต่ละคืน').click();await p.getByRole('heading',{name:'บอสแต่ละคืน · 5',exact:true}).waitFor();await button('บอสแต่ละคืน').click();await button('ผีกินหัว').click();await button('ดูผี ผีกินหัว').click();await p.getByText('ผีกินหัว · คืนที่ 5',{exact:true}).waitFor();await button('ปิดรายละเอียด').click();pass('five-night-bosses-and-ultimate-group');
   await button('การ์ด').click();await button('ทุกกลุ่ม').click();await button('นักรบวัด').click();await p.getByRole('heading',{name:'นักรบวัด · 32',exact:true}).waitFor();
   const first=button('ดูการ์ด ฟันดาบวัด');const box=await first.boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=viewport.width+1);
   await first.click();await button('ดูการ์ดปลุกเสกขั้น 1').click();await p.getByText('ฟันดาบวัด +1',{exact:true}).waitFor();await button('ดูการ์ดขั้นปกติ').click();await button('ปิดรายละเอียด').click();assert.deepEqual(await state(),before);pass('actual-two-column-card-face-upgrade-preview-read-only');
   await button('ทุกประเภท').click();await button('โจมตี').click();await button('ทุกความหายาก').click();await button('หายาก').click();await p.getByRole('textbox',{name:'ค้นหาชื่อหรือความสามารถ'}).fill('zz-no-match');await p.getByText('ไม่พบรายการที่ตรงกับตัวกรอง',{exact:true}).waitFor();pass('type-rarity-search-empty-result');
   await button('ผี').click();await button('ดูทั้งหมด').click();await button('ลำดับสารานุกรม').click();await button('ชื่อ ก–ฮ').click();await button('กลับ').click();await p.getByText('ดำเนินการแล้ว',{exact:true}).first().waitFor();pass('sort-tab-reset-back-return');
   await load('archive-populated');const initial=await state();const summary=await p.getByTestId('archive-summary').textContent();assert.ok(!summary.includes('พบแล้ว 0 / 34'));await button('พบแล้ว').click();await button('การ์ด').click();assert.match(await p.getByTestId('archive-summary').textContent(),/126/);assert.deepEqual(await state(),initial);pass('real-engine-owned-discoveries-fixture');
   await ctx.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS',reports.length,'archive mobile checks; no captures.');
 }finally{fs.mkdirSync('backlog-audit',{recursive:true});fs.writeFileSync('backlog-audit/archive-ui.json',JSON.stringify({reports,errors,screenshots:false},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
