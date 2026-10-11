const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/paper-web',out='paper-preview-audit';
fs.mkdirSync(out,{recursive:true});
const reports=[],errors=[];let frameTiming,recordingFrameTiming;
const layers=['sky','forest','village','ghost','foliage'];
const state=p=>p.getByTestId('paper-state').textContent().then(JSON.parse);
const matrices=p=>Promise.all(layers.map(id=>p.getByTestId('paper-layer-'+id).evaluate(el=>getComputedStyle(el).transform)));
const rect=p=>p.getByTestId('player-hud').boundingBox();
const sampleFrames=(p,recording)=>p.evaluate(recording=>new Promise(resolve=>{const samples=[];let previous;const start=performance.now();function frame(now){if(previous!==undefined)samples.push(now-previous);previous=now;if(now-start<4200)requestAnimationFrame(frame);else{samples.sort((a,b)=>a-b);resolve({frames:samples.length,meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95Ms:samples[Math.floor(samples.length*.95)],worstMs:samples.at(-1),recording});}}requestAnimationFrame(frame);}),recording);
const instantBattle=p=>p.waitForFunction(()=>JSON.parse(document.querySelector('[data-testid="paper-state"]').textContent).phase==='battle',undefined,{timeout:500});
(async()=>{
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.json':'application/json'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
 await new Promise(r=>server.listen(8140,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.PAPER_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
  for(const viewport of [{width:360,height:640},{width:393,height:852}]){
   const ctx=await browser.newContext({viewport,hasTouch:true}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.goto('http://127.0.0.1:8140/paper-diorama');await p.getByTestId('paper-state').waitFor({state:'attached'});
   assert.equal((await state(p)).enemy,'phi-nang-yai');assert.equal((await state(p)).progressionWritten,false);
   assert.equal(await p.getByRole('button',{name:'เดินเข้าหมู่บ้าน',exact:true}).isEnabled(),false);
   for(const id of layers.filter(id=>id!=='ghost'))assert.equal(await p.getByTestId('paper-layer-'+id).evaluate(el=>[...el.children].every(img=>img.getBoundingClientRect().width<=el.getBoundingClientRect().width+1)),true,'paper images must fit their plane, not use intrinsic pixel widths');
   if(viewport.width===393)await p.screenshot({path:out+'/route.png'});
   const initial=await matrices(p);await p.waitForTimeout(700);const moved=await matrices(p);assert.notDeepEqual(initial,moved,'independent idle parallax is active');assert.ok(new Set(moved).size>3,'layers must not share one flattened transform');
   await p.getByRole('button',{name:'เลือกเส้นทางผีตายโหงเรือนร้าง',exact:true}).click();const started=Date.now();await p.getByRole('button',{name:'เดินเข้าหมู่บ้าน',exact:true}).click();
   await p.waitForTimeout(350);assert.equal((await state(p)).phase,'arrival');
   await p.waitForFunction(()=>JSON.parse(document.querySelector('[data-testid="paper-state"]').textContent).phase==='battle');
   const elapsed=Date.now()-started;assert.ok(elapsed>=1450&&elapsed<5000,'push-in must last approximately 1.6 seconds');
   const ui=p.getByTestId('paper-screen-ui');assert.equal(await ui.evaluate(el=>getComputedStyle(el).transform),'none');
   const before=await rect(p),cards=await p.getByTestId('battle-hand').boundingBox();await p.waitForTimeout(900);assert.deepEqual(await rect(p),before);assert.deepEqual(await p.getByTestId('battle-hand').boundingBox(),cards);
   assert.ok(before.x>=0&&before.x+before.width<=viewport.width+1&&before.y+before.height<=viewport.height+1);
   const blurred=await p.locator('[data-testid="paper-world"] img').evaluateAll(es=>es.some(e=>getComputedStyle(e).filter.includes('blur')));assert.equal(blurred,false);
   if(viewport.width===393)await p.screenshot({path:out+'/battle.png'});
   reports.push({viewport,check:'portrait-five-independent-layers-1600ms-push-fixed-HUD-hand-no-blur',elapsed,result:'passed'});
   await p.getByRole('switch',{name:'ลดการเคลื่อนไหวของฉาก'}).click();assert.equal((await state(p)).reduced,true);await p.waitForTimeout(150);const still=await matrices(p);await p.waitForTimeout(700);assert.deepEqual(await matrices(p),still);
   await p.getByRole('button',{name:'กลับฉากเส้นทาง',exact:true}).click();await p.getByRole('button',{name:'เลือกเส้นทางผีตายโหงเรือนร้าง',exact:true}).click();await p.getByRole('button',{name:'เดินเข้าหมู่บ้าน',exact:true}).click();await instantBattle(p);assert.equal((await state(p)).phase,'battle');
   reports.push({viewport,check:'game-setting-stops-parallax-and-skips-push',result:'passed'});
   await p.getByRole('switch',{name:'ลดการเคลื่อนไหวของฉาก'}).click();await p.getByRole('button',{name:'กลับฉากเส้นทาง',exact:true}).click();await p.getByRole('button',{name:'เลือกเส้นทางผีตายโหงเรือนร้าง',exact:true}).click();await p.getByRole('button',{name:'เดินเข้าหมู่บ้าน',exact:true}).click();await p.waitForTimeout(350);await p.getByRole('button',{name:'กลับฉากเส้นทาง',exact:true}).click();await p.waitForTimeout(1900);assert.equal((await state(p)).phase,'route');
   reports.push({viewport,check:'cancelled-camera-cannot-enter-battle-later',result:'passed'});
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(150);assert.equal((await state(p)).active,false);const paused=await matrices(p);await p.waitForTimeout(600);assert.deepEqual(await matrices(p),paused);
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(100);assert.equal((await state(p)).active,true);
   reports.push({viewport,check:'background-visibility-stops-parallax',result:'passed'});
   await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);assert.equal((await state(p)).reduced,true);await p.getByRole('button',{name:'เลือกเส้นทางผีตายโหงเรือนร้าง',exact:true}).click();await p.getByRole('button',{name:'เดินเข้าหมู่บ้าน',exact:true}).click();await instantBattle(p);assert.equal((await state(p)).phase,'battle');
   reports.push({viewport,check:'live-OS-reduced-motion-overrides-game-setting',result:'passed'});
   const persistent=await p.evaluate(()=>Object.keys(localStorage).filter(k=>/autosave|journal|archive/.test(k)));assert.deepEqual(persistent,[]);
   if(viewport.width===393){await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(150);frameTiming=await sampleFrames(p,false);}
   await ctx.close();
  }
  for(const reduced of [false,true]){
   const viewport={width:393,height:852};const ctx=await browser.newContext({viewport,hasTouch:true,reducedMotion:reduced?'reduce':'no-preference',recordVideo:{dir:out+'/raw',size:viewport}}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.goto('http://127.0.0.1:8140/paper-diorama');await p.getByTestId('paper-state').waitFor({state:'attached'});await p.waitForTimeout(1700);
   await p.getByRole('button',{name:'เลือกเส้นทางผีตายโหงเรือนร้าง',exact:true}).click();await p.waitForTimeout(650);await p.getByRole('button',{name:'เดินเข้าหมู่บ้าน',exact:true}).click();await p.getByTestId('player-hud').waitFor();
   if(reduced)await p.waitForTimeout(4200);
   else recordingFrameTiming=await sampleFrames(p,true);
   const video=p.video();await ctx.close();const source=await video.path();
   execFileSync('ffmpeg',['-y','-i',source,'-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',out+'/'+(reduced?'paper-diorama-reduced-motion':'paper-diorama-route-to-battle')+'.mp4'],{stdio:'pipe'});
  }
  assert.deepEqual(errors,[]);console.log('PASS',reports.length,'paper diorama browser checks; two portrait recordings.');
 } finally {fs.writeFileSync(out+'/results.json',JSON.stringify({reports,errors,frameTiming,recordingFrameTiming,androidDeviceProfiled:false},null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
