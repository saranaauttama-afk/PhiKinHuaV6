const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
(async()=>{

 const root=path.resolve(process.env.PHIKINHUA_WEB_DIR||'/tmp/quiet-web'),out=path.resolve('docs/previews/quiet-comic');fs.mkdirSync(out,{recursive:true});const errors=[];
 const server=http.createServer((req,res)=>{let p=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'})[ext]||'application/octet-stream');fs.createReadStream(p).pipe(res);});await new Promise(r=>server.listen(8129,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.PHIKINHUA_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader'],headless:true});const ctx=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 try{
 await p.goto('http://127.0.0.1:8129');await p.getByRole('button',{name:'เริ่มเกม',exact:true}).click();
 await p.getByRole('button',{name:'เลือกนักรบวัด',exact:true}).click();
 await p.getByRole('button',{name:'เลือกนักรบวัด · ออกเดินทาง →',exact:true}).click();
 await p.getByRole('button',{name:'เล่นคืนที่ 1',exact:true}).click();
 await p.getByRole('button',{name:'ข้ามบทนี้',exact:true}).click();
 if(await p.getByRole('button',{name:'ยืนยันพร',exact:true}).isEnabled())throw Error('Blessing confirmation enabled without a choice');
 await p.getByRole('button',{name:/^พรติดตัว 1:/}).click();
 await p.screenshot({type:'jpeg',quality:88,path:out+'/01-blessing.jpg'});
 await p.getByRole('button',{name:'ยืนยันพร',exact:true}).click();
 await p.waitForTimeout(3600);await p.screenshot({type:'jpeg',quality:88,path:out+'/02-map.jpg'});
 
 const ghost=p.getByRole('button').filter({hasText:'ต่อสู้'}).first();await ghost.click();
 await p.getByRole('button',{name:'เผชิญหน้า →',exact:true}).click();
 await p.waitForTimeout(1800);await p.screenshot({type:'jpeg',quality:88,path:out+'/03-battle.jpg'});
 
 const card=p.getByRole('button',{name:/^การ์ด /}).first();await card.click();await p.screenshot({type:'jpeg',quality:88,path:out+'/04-card-detail.jpg'});
 await p.getByRole('button',{name:'ปิด',exact:true}).click();
 await p.setViewportSize({width:360,height:640});await p.screenshot({type:'jpeg',quality:88,path:out+'/05-battle-small.jpg'});
 await p.setViewportSize({width:393,height:852});
 const fixture=JSON.parse(fs.readFileSync('/tmp/quiet-near-win.json','utf8'));
 const win=await ctx.newPage();win.on('pageerror',e=>errors.push(e.message));
 await win.addInitScript(({save})=>{localStorage.clear();localStorage.setItem('phikinhua_autosave',JSON.stringify(save))},{save:fixture.save});
 await win.goto('http://127.0.0.1:8129');await win.getByRole('button',{name:/^เล่นต่อ/}).click();
 await win.waitForTimeout(1500);await win.getByRole('button',{name:/^การ์ด /}).nth(fixture.index).click();
 await win.getByRole('button',{name:'ใช้การ์ด',exact:true}).click();
 await win.getByRole('button',{name:'รับรางวัล',exact:true}).waitFor();await win.waitForTimeout(500);await win.screenshot({type:'jpeg',quality:88,path:out+'/06-victory.jpg'});
 await win.getByRole('button',{name:'รับรางวัล',exact:true}).click();
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS live menu, class, night, blessing confirmation, map, battle, card detail; two mobile sizes; legal checkpoint card win and reward continuation');

 }catch(e){console.error(e);process.exitCode=1;await p.screenshot({type:'jpeg',quality:88,path:out+'/failure.jpg'});}finally{await browser.close();server.close();}
})();
