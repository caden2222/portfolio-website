const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const root = process.cwd();
fs.mkdirSync(path.join(root, '.qa'), {recursive:true});
const server = http.createServer((req,res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403); return res.end();}
  fs.readFile(file,(err,data) => {
    if(err){res.writeHead(404); return res.end();}
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async()=>{
 await new Promise(r=>server.listen(4173,'127.0.0.1',r));
 const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9223',`--user-data-dir=${path.join(root,'.qa/chrome')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let socket;
 try {
  let tabs;
  for(let i=0;i<60;i++){try{tabs=await(await fetch('http://127.0.0.1:9223/json', {signal:AbortSignal.timeout(1500)})).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
  assert.ok(tabs,'Chrome started');
  socket = new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>socket.addEventListener('open',r,{once:true}));
  let id=0; const pending=new Map(); const errors=[];
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);} if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setFocusEmulationEnabled',{enabled:true}); await send('Page.bringToFront');
  await send('Page.navigate',{url:'http://127.0.0.1:4173'});
  await new Promise(r=>setTimeout(r,1500)); await evaluate(`Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{})}))`);
  for (const [width,height,name] of [[1440,1000,'desktop'],[768,1024,'tablet'],[390,844,'mobile'],[320,740,'small-mobile']]) {
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   await new Promise(r=>setTimeout(r,300));
   const layout=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,keys:[...document.querySelectorAll('.console-key')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,height:r.height}})})`);
   assert.ok(layout.scroll<=layout.width, `${name} no overflow: ${JSON.stringify(layout)}`);
   assert.ok(layout.keys.every(k=>k.x>=0 && k.right<=width && k.height>=44),`${name} keys fit`);
   const metrics = await send('Page.getLayoutMetrics'); const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:metrics.cssContentSize.height,scale:1}});
   fs.writeFileSync(path.join(root,`.qa/${name}.png`),Buffer.from(screenshot.data,'base64'));
   console.log(name, JSON.stringify(layout));
  }
  for(const mode of ['data','code','ml']) {
   await evaluate(`document.querySelector('[data-capability="${mode}"]').click()`);
   const state=await evaluate(`({selected:document.querySelectorAll('.console-key[aria-pressed="true"]').length, mode:document.querySelector('.workbench').dataset.mode, link:document.getElementById('capability-link').getAttribute('href')})`);
   assert.equal(state.selected,1);assert.equal(state.mode,mode);assert.ok(fs.existsSync(state.link)); console.log('capability',mode,state.link);
  }
  await evaluate(`document.getElementById('motion-toggle').click()`);
  assert.equal(await evaluate(`document.getElementById('motion-toggle').getAttribute('aria-pressed')`),'true');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate(`document.querySelector('.workbench').classList.contains('motion-paused')`),true);
  const filter=await evaluate(`({filters:document.querySelectorAll('[aria-label="Filter projects by category"] button').length,search:!!document.querySelector('input[type="search"]')})`);
  console.log('existing tools',filter);
  await evaluate(`document.querySelector('#projects input[type="search"]').value='TensorFlow';document.querySelector('#projects input[type="search"]').dispatchEvent(new Event('input',{bubbles:true}))`);
  await new Promise(r=>setTimeout(r,250));
  assert.equal(await evaluate(`document.querySelectorAll('.project-card:not([hidden])').length`),1);
  await evaluate(`document.querySelector('#projects input[type="search"]').value='';document.querySelector('#projects input[type="search"]').dispatchEvent(new Event('input',{bubbles:true}))`);
  await new Promise(r=>setTimeout(r,250));
  assert.equal(await evaluate(`document.querySelectorAll('.project-card:not([hidden])').length`),4);
  await evaluate(`document.querySelector('[data-capability="data"]').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate(`document.querySelector('.workbench').dataset.mode`),'data');
  await evaluate(`document.querySelector('.menu-toggle').click()`);
  assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'true');
  console.log('Keyboard activation, mobile menu and project search passed.');
  await send('Emulation.setScriptExecutionDisabled',{value:true});
  await send('Page.reload'); await new Promise(r=>setTimeout(r,500));
  assert.equal(await evaluate(`document.querySelectorAll('.project-card').length`),4);
  assert.ok(await evaluate(`document.querySelector('.console-key').getBoundingClientRect().height >= 44`));
  console.log('Static fallback and reduced-motion passed. Runtime errors:',errors);
  assert.equal(errors.length,0);
 }finally{if(socket)socket.close();chrome.kill();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
