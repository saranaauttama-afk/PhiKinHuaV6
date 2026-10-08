const fs=require('fs');
module.exports=async function({browser,base,errors}){
 const out='docs/previews/quiet-comic-rest';fs.mkdirSync(out,{recursive:true});
 const data=JSON.parse(fs.readFileSync('/tmp/quiet-review-fixtures.json','utf8'));
 const ctx=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:Number(process.env.PHIKINHUA_PREVIEW_SCALE??2)});
 await ctx.addInitScript(({journal})=>{localStorage.clear();localStorage.setItem('phikinhua_journal_v1',JSON.stringify(journal));localStorage.setItem('phi-ui-settings',JSON.stringify({reducedMotion:true}));},{journal:data.journal});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 const shot=async name=>{console.log('Capture',name);await p.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));await p.waitForTimeout(250);await p.screenshot({type:'jpeg',quality:88,animations:'disabled',timeout:60000,path:out+'/'+name+'.jpg'});};
 await p.goto(base);await p.getByRole('button',{name:'เริ่มเกม',exact:true}).waitFor();await shot('01-menu');
 await p.getByRole('button',{name:'ตั้งค่า',exact:true}).click();await shot('02-settings');
 await p.getByRole('switch',{name:'ลดการเคลื่อนไหวของฉาก'}).click();await p.getByRole('button',{name:'กลับ',exact:true}).click();
 await p.getByRole('button',{name:'สมุดผ่านคืน',exact:true}).click();await p.getByRole('button',{name:'การเดินทาง',exact:true}).waitFor();await shot('03-journal');
 await p.getByRole('button',{name:'วิชาห้าคืน',exact:true}).click();await shot('04-unlocks');
 await p.getByRole('button',{name:'ความสำเร็จ',exact:true}).click();await shot('05-achievements');
 await p.getByRole('button',{name:'กลับ',exact:true}).click();await p.getByRole('button',{name:'เริ่มเกม',exact:true}).click();await shot('06-class-table');
 for(const [id,name] of [['shaman','หมอผี'],['nun','แม่ชี'],['medium','คนทรง'],['warrior','นักรบวัด']]){
  const button=p.getByRole('button',{name:'เลือก'+name,exact:true});
  // Class names are authoritative; selectors for less common translations use test IDs.
  await p.getByTestId('occupation-'+id).click();await p.getByRole('button',{name:'กลับไปเลือกอาชีพ',exact:true}).waitFor();await shot('07-class-'+id);
  if(id!=='warrior')await p.getByRole('button',{name:'กลับไปเลือกอาชีพ',exact:true}).click();
 }
 await p.getByRole('button',{name:'เลือกนักรบวัด · ออกเดินทาง →',exact:true}).click();
 await p.getByRole('button',{name:'ดูคืนที่ 5',exact:true}).click();if(await p.getByRole('button',{name:'ผ่านคืนที่ 4 ก่อน',exact:true}).isEnabled())throw Error('Locked night selectable');await shot('08-night-locked');
 await p.getByRole('button',{name:'ดูคืนที่ 1',exact:true}).click();await shot('09-night-select');
 // Snapshot routes render the production components and apply real engine commands.
 const screens=['chapter','event','event-result','shop-card','shop-equipment','shop-healing','shop-upgrade','shop-remove','shop-fusion','shop-treasure_single','levelup','reward','deck','blessings','summary','defeat','summary-defeat'];
 for(const screen of screens){
  if(!data.fixtures[screen])throw Error('Missing review fixture '+screen);
  await p.goto(base+'/ui-review?screen='+screen);await p.getByText('กำลังเปิดภาพจากเกม…',{exact:true}).waitFor({state:'hidden'});await p.waitForTimeout(800);
  if(await p.getByRole('alert').count())throw Error(await p.getByRole('alert').textContent());await shot('10-'+screen);
  if(screen==='shop-upgrade'){
   await p.getByRole('button',{name:/^เลือกการ์ด /}).first().click();await shot('11-upgrade-selected');
   const action=p.getByRole('button',{name:'ปลุกเสกใบนี้',exact:true});if(await action.isEnabled()){await action.click();await p.getByText(/ปลุกเสกสำเร็จ/).waitFor();}
  }
  if(screen==='shop-healing'){
   const action=p.getByRole('button',{name:/^ขอพร /});if(await action.count()){await action.click();await p.getByText(/พักฟื้นแล้ว/).waitFor();}
  }
  if(screen==='shop-fusion'){
   await p.getByText('เลือกการ์ดสองใบ (0/2)',{exact:true}).waitFor();
   const picks=p.getByRole('button',{name:/^ผสาน /});await picks.nth(0).click();await picks.nth(1).click();await shot('11-fusion-selected');
   const confirm=p.getByRole('button',{name:'ผสาน',exact:true});if(await confirm.count())await confirm.click();
  }
  if(screen==='deck'){
   await p.getByRole('button',{name:/^ดูการ์ด /}).first().click();await shot('11-deck-detail');await p.getByRole('button',{name:'กลับไปดูสำรับ',exact:true}).click();await p.getByRole('button',{name:'ปิด',exact:true}).click();await p.getByText('ปุ่มตอบสนองแล้ว').waitFor();
  }
  if(screen==='blessings'){
   const object=p.getByRole('button',{name:/^ดูพร /}).first();await object.click();await shot('11-blessing-detail');await p.getByRole('button',{name:'กลับไปดูพร',exact:true}).click();
  }
  if(screen==='reward'){
   await p.getByRole('button',{name:/^การ์ด /}).first().click();await shot('11-reward-selected');await p.getByRole('button',{name:/^รับ /}).click();await p.getByText('เลือกรางวัลแล้ว',{exact:true}).waitFor();
  }
  if(screen==='levelup'){await p.getByRole('button',{name:'ข้ามไปก่อน',exact:true}).click();await p.getByText('รับวิชาแล้ว',{exact:true}).waitFor();}
  if(screen==='event-result'){await p.getByRole('button',{name:'กลับจุดพัก',exact:true}).click();await p.getByText('กลับจุดพักแล้ว',{exact:true}).waitFor();}
 }
 // Small viewport review of the same production screens; action area must stay reachable.
 await p.setViewportSize({width:360,height:640});
 for(const screen of ['shop-card','reward','summary']){await p.goto(base+'/ui-review?screen='+screen);await p.getByText('กำลังเปิดภาพจากเกม…',{exact:true}).waitFor({state:'hidden'});await p.waitForTimeout(600);await shot('12-small-'+screen);}
 await ctx.close();console.log('PASS remaining menu, settings, all class details, journal tabs, locked nights and legal deep-screen fixtures');
};
