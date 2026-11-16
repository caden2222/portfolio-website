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
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const until=async(expression,label)=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await wait(100);}throw Error(label);};
  const navigate=async file=>{await send('Page.navigate',{url:'http://127.0.0.1:4173'+base+file});await wait(400);await until(`!!document.querySelector('.project-toggle')`,'home loaded');};
  const mode=()=>evaluate(`document.querySelector('.workbench').dataset.mode`);
  const running=()=>evaluate(`document.querySelector('.workbench').dataset.running`);
  const neutral=async()=>{
   await evaluate(`document.activeElement.blur();window.scrollTo({top:0,behavior:'instant'})`);
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:2,y:2});await wait(200);
  };
  const screenshot=async name=>{
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   fs.writeFileSync(path.join(root,`.qa/${name}.png`),Buffer.from(shot.data,'base64'));
  };
  await send('Runtime.enable');await send('Network.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.bringToFront');
  await navigate('index.html');await neutral();
  await until(`!!document.querySelector('.shader-surface')`,'React shader mounted');
  assert.equal(await running(),'true');
  const initial=await mode();const scrollStart=await evaluate('scrollY');
  await wait(6250);assert.notEqual(await mode(),initial,'automatically advances after six seconds');
  assert.equal(await evaluate('scrollY'),scrollStart,'automatic advance does not scroll');
  assert.equal(await evaluate(`document.getElementById('showcase-announcement').textContent`),'','automatic changes not announced');
  for(const selected of ['models','data','software']){
   await evaluate(`document.querySelector('[data-capability="${selected}"]').click()`);await wait(80);
   assert.equal(await mode(),selected);assert.equal(await running(),'false');
   assert.equal(await evaluate(`document.querySelectorAll('.console-key[aria-pressed="true"]').length`),1);
   assert.equal(await evaluate(`document.querySelector('.shader-surface').dataset.variant`),String(['models','data','software'].indexOf(selected)));
   assert.ok(await evaluate(`document.getElementById('showcase-announcement').textContent.length>0`));
  }
  await neutral();await wait(6250);assert.equal(await mode(),'software','manual selection persists');
  await evaluate(`document.getElementById('showcase-toggle').click()`);await neutral();
  assert.equal(await running(),'true');await wait(6250);assert.equal(await mode(),'models','explicit resume');
  await evaluate(`document.getElementById('showcase-toggle').click()`);await neutral();
  await wait(6250);assert.equal(await mode(),'models','explicit pause persists');
  await evaluate(`document.getElementById('showcase-toggle').click()`);await neutral();
  const rect=await evaluate(`(()=>{const r=document.querySelector('.workbench').getBoundingClientRect();return {x:r.x+20,y:r.y+20}})()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',...rect});await wait(100);
  assert.equal(await running(),'false','hover suspends');await wait(6250);assert.equal(await mode(),'models');
  await neutral();assert.equal(await running(),'true');await wait(1000);assert.equal(await mode(),'models','full interval on return');
  await evaluate(`document.getElementById('capability-link').focus()`);await wait(100);
  assert.equal(await running(),'false','focus suspends');await wait(6250);assert.equal(await mode(),'models');
  await neutral();
  await evaluate(`document.getElementById('contact').scrollIntoView({behavior:'instant'})`);await wait(150);
  assert.equal(await running(),'false','offscreen suspends');await wait(6250);assert.equal(await mode(),'models');
  await neutral();assert.equal(await running(),'true');
  // Use a real second tab to exercise document visibility rather than a mocked flag.
  const other=await send('Target.createTarget',{url:'about:blank'});
  await send('Target.activateTarget',{targetId:other.targetId});await wait(250);
  assert.equal(await evaluate('document.hidden'),true,'original tab hidden');
  assert.equal(await running(),'false','hidden tab suspends');await wait(6250);assert.equal(await mode(),'models');
  await send('Target.closeTarget',{targetId:other.targetId});await send('Page.bringToFront');await neutral();
  assert.equal(await running(),'true');await wait(1000);assert.equal(await mode(),'models','return starts a fresh interval');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(100);
  assert.equal(await running(),'false');assert.equal(await evaluate(`getComputedStyle(document.documentElement).scrollBehavior`),'auto');
  await evaluate(`document.querySelector('[data-capability="data"]').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(100);
  assert.equal(await mode(),'data','keyboard manual mode with reduced motion');
  assert.equal(await evaluate(`getComputedStyle(document.activeElement).outlineStyle`),'solid');
  console.log('PASS: real six-second cycling; manual selection; pause/resume; hover, focus, offscreen and real hidden-tab suspension; no automatic scrolling/announcements; reduced motion.');
  await send('Emulation.setEmulatedMedia',{features:[]});
  for(const [width,height,name] of [[1440,900,'desktop'],[768,1024,'tablet'],[390,844,'mobile'],[320,740,'small-mobile']]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   await neutral();
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),name+' no overflow');
   await screenshot(name+'-viewport');
   for(const slug of ['sentiment','powerbi','sql','analogy']){
    await evaluate(`document.getElementById('project-${slug}').scrollIntoView({behavior:'instant'})`);
    const before=await evaluate('scrollY');
    await evaluate(`document.getElementById('toggle-${slug}').click()`);
    assert.equal(await evaluate(`document.getElementById('details-${slug}').hidden`),false);
    assert.ok(Math.abs(await evaluate('scrollY')-before)<2,name+' opening preserves scroll position');
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),name+' expanded no overflow');
    if(slug==='powerbi')await screenshot(name+'-expanded');
    await evaluate(`document.getElementById('toggle-${slug}').click()`);
    assert.equal(await evaluate(`document.getElementById('details-${slug}').hidden`),true);
    assert.ok(Math.abs(await evaluate('scrollY')-before)<2,name+' closing preserves scroll position');
    assert.equal(await evaluate(`[...document.querySelectorAll('#details-${slug} a')].some(a=>a.getClientRects().length)`),false,'collapsed links not focusable');
   }
   console.log(name,'layout, expansion and position checks passed');
  }
  await evaluate(`document.querySelector('.menu-toggle').click()`);
  assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'true');
  await evaluate(`document.querySelector('.nav-links a').click()`);
  assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'false');
  for(const id of ['home','projects','about','experience','contact','resume']){
   assert.ok(await evaluate(`!!document.querySelector('a[href="#${id}"]')&&!!document.getElementById('${id}')`));
  }
  for(const slug of ['sentiment','powerbi','sql','analogy']){
   await navigate(`index.html#project-${slug}`);
   assert.equal(await evaluate(`document.getElementById('toggle-${slug}').getAttribute('aria-expanded')`),'true','direct link opens detail');
   await navigate(`projects/${slug}.html`);
   await until(`location.hash==='#project-${slug}'`,'legacy redirect');
   assert.equal(await evaluate(`document.getElementById('details-${slug}').hidden`),false,'legacy link opens detail');
  }
  for(const file of ['cnn','chatbot','prudential','vae']){await navigate(`projects/${file}.html`);assert.equal(await evaluate('location.hash'),'#projects');}
  await navigate('motion-study.html');assert.equal(await evaluate('location.hash'),'#home');
  await navigate('resume.html');assert.equal(await evaluate('location.hash'),'#resume');
  assert.ok(await evaluate(`!!document.querySelector('a[href="mailto:cadentoh22@gmail.com?subject=Resume%20request"]')`));
  await navigate('index.html');
  await evaluate(`document.getElementById('capability-link').click()`);await wait(100);
  assert.equal(await evaluate(`document.getElementById('details-sentiment').hidden`),false,'showcase link opens inline');
  const urls=await evaluate(`[...document.querySelectorAll('a[href],img[src],script[src],link[rel="stylesheet"]')].map(e=>e.href||e.src).filter(h=>h.startsWith(location.origin))`);
  for(const url of new Set(urls))assert.equal((await fetch(url)).status,200,url);
  const external=await evaluate(`[...document.querySelectorAll('a[href^="https:"]')].map(a=>a.href)`);
  assert.ok(external.includes('https://github.com/caden2222/analogy-tutor'));
  assert.ok(external.includes('https://www.linkedin.com/in/caden-toh-wei-jie/'));
  assert.notEqual(await evaluate('document.body.style.position'),'fixed','native scrolling retained');
  await send('Emulation.setScriptExecutionDisabled',{value:true});await navigate('index.html?static=1#project-sql');
  assert.equal(await evaluate(`document.querySelectorAll('.inline-study:not([hidden])').length`),4,'no-JS studies remain available');
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.nav-links')).display`),'none');
  assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(missing.length,0,JSON.stringify(missing));
  console.log('PASS: navigation, direct links, legacy URLs, resume/email/source links, no-JS fallback, no missing assets or runtime exceptions.');
 }finally{if(socket)socket.close();chrome.kill();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
