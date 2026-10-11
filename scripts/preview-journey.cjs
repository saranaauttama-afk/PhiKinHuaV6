const fs=require('fs');
module.exports=async function({browser,base,errors}){
 const data=JSON.parse(fs.readFileSync('/tmp/quiet-review-fixtures.json','utf8'));
 const out='docs/previews/quiet-comic-journey';fs.mkdirSync(out,{recursive:true});
 for(let stage=1;stage<=15;stage++){
  const save=data.routeSaves['route-'+stage];if(!save)throw Error('Missing legal journey checkpoint '+stage);
  const ctx=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1});
  await ctx.addInitScript(({save})=>{localStorage.clear();localStorage.setItem('phikinhua_autosave',JSON.stringify(save));localStorage.setItem('phi-ui-settings',JSON.stringify({reducedMotion:true}));},{save});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.getByRole('button',{name:/^เล่นต่อ/}).click();
  await page.getByText('เลือกทางเดิน',{exact:true}).waitFor();
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  await page.waitForTimeout(300);
  await page.screenshot({type:'jpeg',quality:88,animations:'disabled',path:out+'/'+String(stage).padStart(2,'0')+'-route.jpg'});
  await ctx.close();
 }
 console.log('PASS: 15 real route screens restored from legal engine checkpoints, with all images decoded');
};
