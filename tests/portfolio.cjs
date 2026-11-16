const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const root = process.cwd(), base = '/portfolio-website/';
const publicRoot = path.join(root,'dist');
const server = http.createServer((req,res) => {
 const url = decodeURIComponent(req.url.split('?')[0]);
 if(!url.startsWith(base)){res.writeHead(404);return res.end();}
 const file=path.resolve(publicRoot,url.slice(base.length)||'index.html');
 if(!file.startsWith(publicRoot+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpeg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(r=>server.listen(4173,'127.0.0.1',r));
 const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9223',`--user-data-dir=${path.join(root,'.qa/chrome-redesign')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let socket;
 try{
  let tabs;
  for(let i=0;i<60;i++){try{tabs=await(await fetch('http://127.0.0.1:9223/json')).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
  assert.ok(tabs,'Chrome started');
  socket=new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>socket.addEventListener('open',r,{once:true}));
  let id=0;const pending=new Map(),errors=[],missing=[];
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.method==='Network.responseReceived'&&m.params.response.status>=400)missing.push(m.params.response.url);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
  const navigate=async file=>{await send('Page.navigate',{url:'http://127.0.0.1:4173'+base+file});await new Promise(r=>setTimeout(r,350));};
  await send('Runtime.enable');await send('Network.enable');await send('Page.enable');
  await navigate('index.html');
  await evaluate(`Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode()}))`);
  for(const [width,height,name] of [[1440,900,'desktop'],[768,1024,'tablet'],[390,844,'mobile'],[320,740,'small-mobile']]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   await new Promise(r=>setTimeout(r,100));
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),name+' no horizontal overflow');
   assert.ok(await evaluate(`[...document.querySelectorAll('.console-key')].every(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.left>=0&&r.right<=innerWidth})`),name+' controls fit');
   const metrics=await send('Page.getLayoutMetrics');
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:metrics.cssContentSize.height,scale:1}});
   fs.writeFileSync(path.join(root,`.qa/${name}.png`),Buffer.from(shot.data,'base64'));
   const hero=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,`.qa/${name}-viewport.png`),Buffer.from(hero.data,'base64'));
   console.log(name,'layout and screenshot passed');
  }
  for(const mode of ['models','data','software']){
   await evaluate(`document.querySelector('[data-capability="${mode}"]').click()`);
   assert.equal(await evaluate(`document.querySelector('.workbench').dataset.mode`),mode);
   assert.equal(await evaluate(`document.querySelectorAll('.console-key[aria-pressed="true"]').length`),1);
   assert.equal(await evaluate(`getComputedStyle(document.querySelector('.scene-${mode}')).display`),'flex');
   const href=await evaluate(`document.getElementById('capability-link').href`);assert.equal((await fetch(href)).status,200);
  }
  await evaluate(`document.querySelector('[data-capability="data"]').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate(`document.querySelector('.workbench').dataset.mode`),'data');
  assert.equal(await evaluate(`getComputedStyle(document.activeElement).outlineStyle`),'solid');
  await evaluate(`document.querySelector('.menu-toggle').click()`);
  assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'true');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'false');
  await evaluate(`document.querySelector('.menu-toggle').click();document.querySelector('.nav-links a').click()`);
  assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'false');
  const urls=await evaluate(`[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin))`);
  for(const url of new Set(urls)){assert.equal((await fetch(url)).status,200,url);}
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate(`getComputedStyle(document.documentElement).scrollBehavior`),'auto');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.console-key')).transitionDuration`),'0s');
  for(const file of ['projects/sentiment.html','projects/powerbi.html','projects/sql.html','projects/analogy.html','resume.html','projects/cnn.html']){
   await navigate(file);assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),file+' mobile overflow');
   for(const url of await evaluate(`[...document.querySelectorAll('a[href],img[src],script[src],link[rel="stylesheet"]')].map(e=>e.href||e.src).filter(h=>h.startsWith(location.origin))`)){assert.equal((await fetch(url)).status,200,url);}
  }
  await navigate('projects/powerbi.html');
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(root,'.qa/project.png'),Buffer.from(shot.data,'base64'));
  await send('Emulation.setScriptExecutionDisabled',{value:true});await navigate('index.html');
  assert.equal(await evaluate(`document.querySelectorAll('.project-card').length`),4);
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.nav-links')).display`),'none');
  assert.ok(await evaluate(`document.querySelector('h1').innerText.includes('Learning deeply')`));
  assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(missing.length,0,JSON.stringify(missing));
  console.log('PASS: capability modes, keyboard/focus, mobile menu, local links, project pages, resume landing page, reduced motion, no-JS fallback, no runtime errors or missing assets.');
 }finally{if(socket)socket.close();chrome.kill();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
