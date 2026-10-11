const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-backlog-web',out=process.env.PAPER_ROLLOUT_AUDIT||'backlog-audit/paper-rollout';fs.mkdirSync(out,{recursive:true});
const scenes=fs.readdirSync('assets/scence/journey/thai-v24').filter(f=>f.endsWith('.jpg')).map(f=>f.slice(0,-4)).sort();
const representatives=['01-village','03-temple-gate','06-bamboo-forest','08-stream','10-mountain-trail','13-cave-river','16-secret-throne'];
const reports=[],errors=[];
(async()=>{
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.css':'text/css'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});await new Promise(r=>server.listen(8144,'127.0.0.1',r));
 const browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
 const load=async(p,id,ghost='phi-pop')=>{await p.goto(`http://127.0.0.1:8144/paper-environments-review?sceneId=${id}&ghostId=${ghost}`);await p.getByTestId(`theater-${id}-ready`).waitFor({state:'attached'});};
 const enter=async p=>{const ghost=JSON.parse(await p.getByTestId('rollout-review-state').textContent()).ghostId;const name=ghost==='phi-pop'?'ผีปอบ':'ผีตายโหงเรือนร้าง';await p.getByRole('button',{name,exact:true}).click();await p.getByRole('button',{name:/^เผชิญหน้า/}).click();};
 const settings=async(p,label)=>{await p.getByRole('button',{name:'ตั้งค่า',exact:true}).click();await p.getByRole('switch',{name:label,exact:true}).click();await p.getByRole('button',{name:'กลับ',exact:true}).click();};
 try{
 for(const viewport of [{width:360,height:640},{width:393,height:852}]){
  const ctx=await browser.newContext({viewport,hasTouch:true}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await ctx.addInitScript(()=>localStorage.setItem('phi-ui-settings',JSON.stringify({dioramaAnimation:false,audioVolume:.42})));
  for(const id of scenes){
   await load(p,id);await p.screenshot({path:`${out}/route-${id}-${viewport.width}.png`});await enter(p);await p.getByTestId(`theater-${id}-ready`).waitFor({state:'attached'});
   const actor=await p.getByTestId('theater-character').boundingBox(),hud=await p.getByTestId('enemy-hud-0').boundingBox(),hand=await p.getByTestId('battle-hand').boundingBox(),player=await p.getByTestId('player-hud').boundingBox();
   assert.ok(actor.y>=0&&actor.y+actor.height<=hud.y-5,'full ghost clears HUD '+id);assert.ok(hud.y+hud.height<hand.y,'HUD clears hand '+id);assert.ok(hand.y+hand.height<=player.y,'hand clears player '+id);
   const coverage=await p.locator(id==='01-village'?'[data-testid="paper-print-sky"]':'[data-testid="environment-static-base"]').boundingBox();assert.ok(coverage.x<=0&&coverage.y<=0&&coverage.x+coverage.width>=viewport.width&&coverage.y+coverage.height>=viewport.height,'full static background '+id);
   assert.equal(await p.getByTestId('theater-screen-ui').evaluate(e=>getComputedStyle(e).transform),'none');assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
   assert.equal(await p.locator('img').evaluateAll(es=>es.some(e=>getComputedStyle(e).filter.includes('blur'))),false);
   await p.screenshot({path:`${out}/battle-${id}-${viewport.width}.png`});reports.push({viewport,scene:id,check:'route-battle-OFF-coverage-and-layout',passed:true});
  }
  await ctx.close();
  for(const id of representatives){
   const recordVideo=viewport.width===393&&['03-temple-gate','06-bamboo-forest','13-cave-river'].includes(id);const c=await browser.newContext({viewport,hasTouch:true,...(recordVideo?{recordVideo:{dir:out+'/raw-video',size:viewport}}:{})}),q=await c.newPage();q.on('pageerror',e=>errors.push(e.message));await load(q,id,id==='01-village'?'phi-nang-yai':'phi-pop');
   const name=id==='01-village'?'ผีตายโหงเรือนร้าง':'ผีปอบ';await q.getByRole('button',{name,exact:true}).click();
   await q.getByRole('button',{name:/^เผชิญหน้า/}).evaluate(el=>el.addEventListener('click',()=>{window.rolloutTrace=[];const start=performance.now();function tick(){const ui=document.querySelector('[data-testid="theater-screen-ui"]'),actor=document.querySelector('[data-testid="theater-character"]');const base=document.querySelector('[data-testid="environment-static-base"]')||document.querySelector('[data-testid="paper-print-sky"]');if(actor&&ui&&base){const r=base.getBoundingClientRect();window.rolloutTrace.push({t:performance.now()-start,ui:Number(getComputedStyle(ui).opacity),actor:Number(getComputedStyle(actor).opacity),base:{x:r.x,y:r.y,w:r.width,h:r.height},layers:[...document.querySelectorAll('[data-testid^="environment-layer-"]')].map(e=>({id:e.dataset.testid,opacity:Number(getComputedStyle(e).opacity),transform:getComputedStyle(e).transform}))});}if(performance.now()-start<3600)requestAnimationFrame(tick);}requestAnimationFrame(tick);},{once:true}));
   const start=Date.now();await q.getByRole('button',{name:/^เผชิญหน้า/}).click();await q.waitForTimeout(120);await q.screenshot({path:`${out}/first-${id}-${viewport.width}.png`});await q.waitForTimeout(1300);await q.screenshot({path:`${out}/middle-${id}-${viewport.width}.png`});await q.getByTestId(`theater-${id}-ready`).waitFor({state:'attached'});const elapsed=Date.now()-start;assert.ok(elapsed>=2900&&elapsed<4500,'three-second assembly '+elapsed);await q.waitForTimeout(350);
   const trace=await q.evaluate(()=>window.rolloutTrace);assert.ok(trace.length>30,'normal-speed frames sampled');for(const f of trace)assert.ok(f.base.x<=0&&f.base.y<=0&&f.base.x+f.base.w>=viewport.width&&f.base.y+f.base.h>=viewport.height,'first/middle/final coverage');
   assert.ok(trace.some(f=>f.t<800&&f.actor===0),'ghost does not rush in');assert.ok(trace.some(f=>f.t>1200&&f.actor>0&&f.actor<1),'gentle ghost reveal');assert.ok(trace.some(f=>f.ui>0&&f.ui<1&&f.t>2450),'late fixed HUD fade');
   for(const key of ['actor','ui']){let last=0;for(const f of trace){assert.ok(f[key]+.0001>=last,'no flicker or reset');last=f[key];}}
   const steps=trace.slice(1).map((f,i)=>f.t-trace[i].t).sort((a,b)=>a-b),perf={frames:trace.length,meanMs:steps.reduce((a,b)=>a+b,0)/steps.length,p95Ms:steps[Math.floor(steps.length*.95)],worstMs:steps.at(-1)};
   fs.writeFileSync(`${out}/trace-${id}-${viewport.width}.json`,JSON.stringify(trace));await q.screenshot({path:`${out}/final-${id}-${viewport.width}.png`});
   await q.getByRole('button',{name:'จบเทิร์น',exact:true}).click();await q.waitForTimeout(300);assert.equal(await q.getByTestId('theater-character').evaluate(e=>Number(getComputedStyle(e).opacity)),1,'turn must not replay');assert.equal(await q.getByTestId('theater-input-guard').count(),0);
   await settings(q,'แอนิเมชันฉากกระดาษ');await settings(q,'แอนิเมชันฉากกระดาษ');await q.waitForTimeout(200);assert.equal(await q.getByTestId('theater-input-guard').count(),0,'re-enabling applies to next entry only');
   reports.push({viewport,scene:id,check:'normal-speed-ON-assembly-no-replay',elapsed,perf,passed:true});const video=recordVideo?q.video():null;await c.close();if(video){require('node:child_process').execFileSync('ffmpeg',['-y','-i',await video.path(),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/assembly-${id}.mp4`],{stdio:'ignore'});}
  }
 }
 const ctx=await browser.newContext({viewport:{width:393,height:852},reducedMotion:'reduce'}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await load(p,'13-cave-river');await enter(p);await p.getByTestId('theater-13-cave-river-ready').waitFor({state:'attached'});assert.equal(await p.getByTestId('theater-input-guard').count(),0);reports.push({check:'OS-reduced-motion-overrides-ON',passed:true});
 await settings(p,'แอนิเมชันฉากกระดาษ');await p.reload();await p.getByTestId('theater-13-cave-river-ready').waitFor({state:'attached'});assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('phi-ui-settings')).dioramaAnimation),false);reports.push({check:'OFF-cold-reload-persistence',passed:true});await ctx.close();
 assert.deepEqual(errors,[]);console.log('PASS',reports.length,'paper rollout checks; 24 environments, both portrait viewports; normal playback sampled.');
 }finally{fs.writeFileSync(`${out}/results.json`,JSON.stringify({reports,errors,physicalAndroidProfiled:false},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
