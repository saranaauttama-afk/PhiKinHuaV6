const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const root=process.env.PHIKINHUA_WEB_DIR||'/tmp/assembly-web',out=process.env.PAPER_AUDIT_DIR||'/tmp/paper-assembly-audit';fs.mkdirSync(out,{recursive:true});
const ids=['sky','forest','village','ghost','foliage'],reports=[],errors=[],assets=new Set();let timing;
const state=p=>p.getByTestId('paper-state').textContent().then(JSON.parse);
const waitBattle=p=>p.waitForFunction(()=>JSON.parse(document.querySelector('[data-testid="paper-state"]').textContent).phase==='battle');
const ready=async p=>{await p.getByTestId('paper-state').waitFor({state:'attached'});await p.waitForFunction(()=>JSON.parse(document.querySelector('[data-testid="paper-state"]').textContent).assetsReady);};
const settings=async(p,label)=>{await p.getByRole('button',{name:'ตั้งค่า',exact:true}).click();await p.getByRole('switch',{name:label,exact:true}).click();await p.getByRole('button',{name:'กลับ',exact:true}).click();};
const select=async p=>p.getByRole('button',{name:'เลือกเส้นทางผีตายโหงเรือนร้าง',exact:true}).click();
const enter=async p=>p.getByRole('button',{name:'เดินเข้าหมู่บ้าน',exact:true}).click();
const reset=async p=>p.getByRole('button',{name:'กลับฉากเส้นทาง',exact:true}).click();
// Measure from the browser click event, not Playwright actionability/transport.
// Also verify the fully assembled pixels on every observed OFF/reduced frame.
const immediateEntry=async p=>{
 await p.getByRole('button',{name:'เดินเข้าหมู่บ้าน',exact:true}).evaluate(el=>el.addEventListener('click',()=>{
  const start=performance.now(),probe=window.paperImmediate={samples:[],elapsed:null};
  const read=()=>{const phase=JSON.parse(document.querySelector('[data-testid="paper-state"]').textContent).phase;
   if(phase!=='route'){probe.samples.push({phase,layers:['sky','forest','village','ghost','foliage'].map(id=>Number(getComputedStyle(document.querySelector('[data-testid="paper-layer-'+id+'"]')).opacity)),hud:Number(getComputedStyle(document.querySelector('[data-testid="paper-battle-ui"]')).opacity)});}
   if(phase==='battle'){probe.elapsed=performance.now()-start;observer.disconnect();return true;}return false;
  };
  const observer=new MutationObserver(read);observer.observe(document.querySelector('[data-testid="paper-state"]'),{childList:true,characterData:true,subtree:true});
  function frame(){if(!read())requestAnimationFrame(frame);}requestAnimationFrame(frame);
 },{once:true}));
 await enter(p);await waitBattle(p);await p.waitForFunction(()=>window.paperImmediate?.elapsed!==null);
 const result=await p.evaluate(()=>window.paperImmediate);
 assert.ok(result.elapsed<1200,'must bypass the 3000ms assembly');assert.ok(result.samples.length);
 for(const sample of result.samples){assert.deepEqual(sample.layers,[1,1,1,1,1]);assert.equal(sample.hud,1,'HUD is immediately assembled');}
 return result;
};

const sampleFrames=p=>p.evaluate(()=>new Promise(resolve=>{const s=[];let last;const start=performance.now();function f(t){if(last!==undefined)s.push(t-last);last=t;if(t-start<3000)requestAnimationFrame(f);else{s.sort((a,b)=>a-b);resolve({frames:s.length,meanMs:s.reduce((a,b)=>a+b,0)/s.length,p95Ms:s[Math.floor(s.length*.95)],worstMs:s.at(-1)});}}requestAnimationFrame(f);}));
(async()=>{
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.json':'application/json'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});await new Promise(r=>server.listen(8140,'127.0.0.1',r));
 const b=await chromium.launch({executablePath:process.env.PAPER_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const viewport of [{width:360,height:640},{width:360,height:720},{width:360,height:800},{width:393,height:852},{width:412,height:915},{width:432,height:960},{width:480,height:800}]){
   const ctx=await b.newContext({viewport,hasTouch:true}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{const u=new URL(r.url());if(u.pathname.startsWith('/assets/'))assets.add(u.pathname);});
   await p.goto('http://127.0.0.1:8140/paper-diorama');await ready(p);assert.equal((await state(p)).animationOn,true);
   await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('phi-ui-settings')||'{}');localStorage.setItem('phi-ui-settings',JSON.stringify({...s,audioVolume:0.42}));});await p.reload();await ready(p);
   await p.screenshot({path:out+'/route-'+viewport.width+'x'+viewport.height+'.png'});
   await select(p);
   await p.getByRole('button',{name:'เดินเข้าหมู่บ้าน',exact:true}).evaluate(el=>el.addEventListener('click',()=>{window.paperTrace=[];const start=performance.now();function tick(t){window.paperTrace.push({t:t-start,phase:JSON.parse(document.querySelector('[data-testid="paper-state"]').textContent).phase,layers:['sky','forest','village','ghost','foliage'].map(id=>{const s=getComputedStyle(document.querySelector('[data-testid="paper-layer-'+id+'"]'));return{opacity:Number(s.opacity),transform:s.transform};}),hud:document.querySelector('[data-testid="paper-battle-ui"]')?Number(getComputedStyle(document.querySelector('[data-testid="paper-battle-ui"]')).opacity):0});if(t-start<3400)requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
   const start=Date.now();await enter(p);await p.waitForTimeout(250);assert.equal((await state(p)).phase,'arrival');assert.equal(await p.getByRole('button',{name:/ข้าม|Skip/}).count(),0);assert.equal(await p.getByRole('button',{name:'กลับฉากเส้นทาง',exact:true}).count(),0);
   if([360,393].includes(viewport.width)&&[640,852].includes(viewport.height)){await p.screenshot({path:out+'/first-'+viewport.width+'x'+viewport.height+'.png'});await p.waitForTimeout(1100);await p.screenshot({path:out+'/middle-'+viewport.width+'x'+viewport.height+'.png'});}
   await waitBattle(p);const elapsed=Date.now()-start;assert.ok(elapsed>=2950&&elapsed<4000,'assembly duration');await p.waitForTimeout(250);
   const trace=await p.evaluate(()=>window.paperTrace),windows=[[0,150],[500,750],[550,800],[1300,1600],[1900,2150]];
   ids.forEach((id,i)=>{const first=trace.find(s=>s.layers[i].opacity>0.05);if(id==='sky')assert.ok(trace.every(s=>s.layers[i].opacity===1&&['none','matrix(1, 0, 0, 1, 0, 0)'].includes(s.layers[i].transform)),'static sky on every real-time frame');assert.ok(first&&first.t>=windows[i][0]&&first.t<windows[i][1],id+' reveal '+first?.t);for(const s of trace){const m=s.layers[i].transform.match(/matrix\(([^)]+)\)/);if(m)assert.equal(Number(m[1].split(',')[0]),1,id+' must not zoom');}});
   for(let i=1;i<ids.length;i++){let previous=0;for(const sample of trace){assert.ok(sample.layers[i].opacity+0.0001>=previous,'no layer reset/flicker');previous=sample.layers[i].opacity;}}
   assert.ok(trace.find(s=>s.hud>0.05&&s.phase==='arrival').t>=2500,'HUD fades only after foliage');fs.writeFileSync(out+'/trace-'+viewport.width+'x'+viewport.height+'.json',JSON.stringify(trace));reports.push({viewport,check:'ordered-independent-assembly-fixed-scale-3000ms-no-skip',elapsed,result:'passed'});
   const hud=await p.getByTestId('player-hud').boundingBox(),hand=await p.getByTestId('battle-hand').boundingBox();assert.equal(await p.getByTestId('paper-screen-ui').evaluate(e=>getComputedStyle(e).transform),'none');await p.waitForTimeout(700);assert.deepEqual(await p.getByTestId('player-hud').boundingBox(),hud);assert.deepEqual(await p.getByTestId('battle-hand').boundingBox(),hand);assert.ok(hud.x>=0&&hud.y+hud.height<=viewport.height+1);assert.equal(await p.locator('[data-testid="paper-world"] img').evaluateAll(es=>es.some(e=>getComputedStyle(e).filter.includes('blur'))),false);assert.equal(await p.locator('[data-testid^="paper-ink-"]').count(),5);const coverage=await p.evaluate(()=>{
    const world=document.querySelector('[data-testid="paper-world"]').getBoundingClientRect();
    return {world:{width:world.width,height:world.height},prints:[...document.querySelectorAll('[data-testid^="paper-print-"]')].map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.testid,x:r.x,y:r.y,w:r.width,h:r.height};}),overflow:document.documentElement.scrollHeight>innerHeight};
   });
   assert.equal(coverage.world.height,viewport.height);assert.equal(coverage.overflow,false);
   for(const r of coverage.prints)assert.ok(Math.abs(r.w/r.h-2/3)<.001,'source aspect ratio '+r.id);
   for(const id of ['sky','forest','village']){const r=coverage.prints.find(r=>r.id==='paper-print-'+id);assert.ok(r.x<0&&r.x+r.w>viewport.width&&r.y<0&&r.y+r.h>viewport.height,'full coverage '+id);}
   const leaves=coverage.prints.filter(r=>r.id==='paper-print-foliage');assert.equal(leaves.length,2);assert.ok(leaves[1].y+leaves[1].h>viewport.height,'bottom foliage cannot end early');
   const placement=(await state(p)).placement,actor=await p.getByTestId('paper-layer-ghost').boundingBox();assert.ok(Math.abs(actor.y+actor.height-placement.footY)<1,'cutout feet align with world anchor');assert.ok(placement.footY<placement.groundY,'intentional floating height');
   assert.ok(hand.y+hand.height<hud.y,'cards must stay above player HUD');
   await p.screenshot({path:out+'/battle-'+viewport.width+'x'+viewport.height+'.png'});
   reports.push({viewport,check:'portrait-crisp-ink-overlays-fixed-HUD-and-cards',coverage,result:'passed'});
   if(viewport.width===393){await p.screenshot({path:out+'/assembled.png'});timing=await sampleFrames(p);}
   for(let i=0;i<3;i++){await reset(p);await select(p);await enter(p);await waitBattle(p);for(const id of ids)assert.equal(await p.getByTestId('paper-layer-'+id).count(),1);}reports.push({viewport,check:'three-repeat-entries-no-duplicate-or-stale-layers',result:'passed'});
   await p.getByRole('button',{name:'จบเทิร์น',exact:true}).click();await p.waitForTimeout(250);assert.ok((await state(p)).eventTypes.includes('TurnEnded'));assert.equal(await p.getByTestId('paper-layer-ghost').evaluate(e=>Number(getComputedStyle(e).opacity)),1);assert.equal((await state(p)).phase,'battle');reports.push({viewport,check:'combat-does-not-replay-assembly',result:'passed'});
   await settings(p,'แอนิเมชันฉากกระดาษ');assert.equal((await state(p)).animationOn,false);await p.reload();await ready(p);assert.equal((await state(p)).animationOn,false);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('phi-ui-settings')).audioVolume),0.42);await select(p);const off=await immediateEntry(p);reports.push({viewport,check:'OFF-persists-through-restart-and-enters-immediately',probe:off,result:'passed'});
   await settings(p,'แอนิเมชันฉากกระดาษ');await settings(p,'ลดการเคลื่อนไหวของฉาก');assert.equal((await state(p)).animationOn,true);await reset(p);await select(p);const reduced=await immediateEntry(p);await settings(p,'ลดการเคลื่อนไหวของฉาก');await p.emulateMedia({reducedMotion:'reduce'});await reset(p);await select(p);const osReduced=await immediateEntry(p);assert.equal((await state(p)).reduced,true);reports.push({viewport,check:'game-and-OS-reduced-motion-override-ON',probe:reduced,osProbe:osReduced,result:'passed'});
   assert.deepEqual(await p.evaluate(()=>Object.keys(localStorage).filter(k=>/autosave|journal|archive/.test(k))),[]);await ctx.close();
  }
  for(const on of [true,false]){
   const viewport={width:393,height:852},ctx=await b.newContext({viewport,hasTouch:true,recordVideo:{dir:out+'/raw',size:viewport}}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
   if(!on)await p.addInitScript(()=>localStorage.setItem('phi-ui-settings',JSON.stringify({dioramaAnimation:false,reducedMotion:false})));
   p.on('request',r=>{const u=new URL(r.url());if(u.pathname.startsWith('/assets/'))assets.add(u.pathname);});await p.goto('http://127.0.0.1:8140/paper-diorama');await ready(p);await p.waitForTimeout(800);await select(p);await p.waitForTimeout(450);await enter(p);await waitBattle(p);await p.waitForTimeout(2200);const v=p.video();await ctx.close();execFileSync('ffmpeg',['-y','-i',await v.path(),'-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',out+'/paper-assembly-'+(on?'ON':'OFF')+'.mp4'],{stdio:'pipe'});
  }
  assert.deepEqual(errors,[]);console.log('PASS',reports.length,'assembly browser checks and ON/OFF videos');
 }finally{fs.writeFileSync(out+'/results.json',JSON.stringify({reports,errors,timing,androidDeviceProfiled:false},null,2));fs.writeFileSync(out+'/assets.json',JSON.stringify([...assets]));await b.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
