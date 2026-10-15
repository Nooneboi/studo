#!/usr/bin/env node
// Browser-level learner smoke test; uses Chrome DevTools Protocol, no npm dependencies.
// Run after build-public.mjs: node scripts/browser-smoke.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn, spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const dist = path.resolve('dist');
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.woff2':'font/woff2'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const filename = path.resolve(dist, '.' + pathname);
  if (!filename.startsWith(dist + path.sep)) {res.writeHead(403).end(); return;}
  fs.readFile(filename, (err, body) => {
    if (err) {res.writeHead(404).end(); return;}
    res.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
    res.writeHead(200).end(body);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'chee-chrome-'));
const candidates = [process.env.CHROME_BIN, 'google-chrome', 'chromium', 'chromium-browser'].filter(Boolean);
let child;
for (const binary of candidates) {
  if (spawnSync('which',[binary],{stdio:'ignore'}).status !== 0) continue;
  child = spawn(binary, ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile, 'about:blank'], {stdio:'ignore'});
  if (child.pid) break;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(fn, label, timeout=12000) {
  const end=Date.now()+timeout;
  while(Date.now()<end) {try {const value=await fn(); if(value) return value;} catch{} await delay(150);}
  throw new Error('Timeout waiting for '+label);
}
let socket;
try {
  const portFile=path.join(profile,'DevToolsActivePort');
  const port=await waitFor(()=>fs.existsSync(portFile)&&Number(fs.readFileSync(portFile,'utf8').split('\n')[0]),'Chrome debugger');
  const pages=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  const target=pages.find(p=>p.type==='page');
  assert.ok(target?.webSocketDebuggerUrl, 'No CDP tab');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open', resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let seq=0;
  const pending=new Map();
  socket.addEventListener('message',event=>{
    const packet=JSON.parse(event.data);
    if(!packet.id) return;
    const waiter=pending.get(packet.id); if(!waiter) return;
    pending.delete(packet.id);
    if(packet.error) waiter.reject(new Error(JSON.stringify(packet.error)));
    else waiter.resolve(packet.result);
  });
  function call(method,params={}) {
    const id=++seq;
    return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  }
  const evalJs=async expression=>{
    const data=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(data.exceptionDetails) throw Error(JSON.stringify(data.exceptionDetails));
    return data.result?.value;
  };
  const navigate=async (file, question='q1')=>{
    await call('Page.navigate',{url:origin+'/module.html?file=generated%2Fmodules%2F'+file+'.json&question='+question});
    await waitFor(()=>evalJs("Boolean(location.search.includes('question="+question+"') && document.querySelector('#question-stage .q-prompt') && document.querySelector('#next-question'))"),'module ready');
  };
  await call('Page.enable');
  await call('Runtime.enable');
  await navigate('set-rla-args-text-data-formats');
  assert.equal(await evalJs("document.body.classList.contains('mainidea-v22-runtime')"),true);
  assert.notEqual(await evalJs("document.getElementById('mainidea-v22-skill-name').textContent"),'Main Idea');
  assert.equal(await evalJs("getComputedStyle(document.querySelector('.mainidea-v22-chrome')).display"),'block');
  assert.equal(await evalJs("document.querySelectorAll('.answer-radio').length"),4);
  await evalJs("document.querySelector('.answer-radio[value=a]').click()");
  await waitFor(()=>evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),'Myanmar help after answer');
  assert.equal(await evalJs("getComputedStyle(document.getElementById('question-footer')).visibility"),'visible');
  assert.equal(await evalJs("document.getElementById('next-question').disabled"),false);
  await evalJs("document.querySelector('[data-myanmar-help]').click()");
  assert.equal(await evalJs("document.getElementById('chee-mm-drawer').getAttribute('aria-hidden')"),'false');
  await evalJs("document.querySelector('.chee-mm-close').click()");
  assert.equal(await evalJs("document.getElementById('chee-mm-drawer').getAttribute('aria-hidden')"),'true');
  await evalJs("document.getElementById('next-question').click()");
  await waitFor(()=>evalJs("document.querySelector('.q-prompt')?.textContent.includes('How does the table')"),'Next question');
  // Guided mode has explicit submission; do not reveal the explanation on selection alone.
  await navigate('set-rla-inference-active-methods-v1','q3');
  assert.equal(await evalJs("document.body.classList.contains('mainidea-v22-runtime')"),true);
  assert.notEqual(await evalJs("document.getElementById('mainidea-v22-skill-name').textContent"),'Main Idea');
  const guided=await evalJs("Boolean(document.querySelector('.interaction-check'))");
  if(guided){
    await evalJs("document.querySelector('.answer-radio[value=a]').click()");
    assert.equal(await evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),false);
    await evalJs("document.querySelector('.interaction-check').click()");
    await waitFor(()=>evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),'guided explanation after submit');
  }
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await navigate('set-rla-summary-active-methods-v1','q2');
  assert.equal(await evalJs("document.querySelectorAll('.answer-radio').length"),4);
  // Full unit entry: Arguments are grouped by unit rather than direct skill page.
  await call('Page.navigate', {url:origin+'/skill.html?track=arguments&domain=argument-analysis&unit=claims-argument-structure'});
  await waitFor(()=>evalJs("Boolean(document.querySelector('#skill-view h1')?.textContent.includes('Claims'))"),'Arguments unit skill page');
  assert.equal(await evalJs("Boolean(document.querySelector('.simple-primary-action a[href*=\"module.html\"]'))"),true);
  const startUrl=await evalJs("document.querySelector('.simple-primary-action a').href");
  assert.ok(startUrl.includes('return=') && startUrl.includes('unit%3Dclaims-argument-structure'));
  await call('Page.navigate',{url:startUrl});
  await waitFor(()=>evalJs("Boolean(document.querySelector('#question-stage .q-prompt') && document.getElementById('mainidea-v22-skill-name')?.textContent.includes('Claims'))"),'Arguments module workspace');
  assert.equal(await evalJs("document.body.classList.contains('mainidea-v22-runtime')"),true);
  assert.equal(await evalJs("document.getElementById('mainidea-v22-check').hasAttribute('href')"),true);
  const checkHref = await evalJs("document.getElementById('mainidea-v22-check').href");
  assert.ok(checkHref.includes('/check.html?'));
  await call('Page.navigate',{url:checkHref});
  await waitFor(()=>evalJs("Boolean(document.querySelector('#check-view .q-prompt') && document.querySelector('#check-next'))"),'Arguments Skill Check');
  assert.equal(await evalJs("document.body.classList.contains('mainidea-v22-runtime')"),true);
  assert.equal(await evalJs("document.querySelector('.mainidea-v22-meta').textContent.includes('Claims')"),true);
  assert.equal(await evalJs("Boolean(document.querySelector('.answer-review, .chee-mm-trigger, [data-myanmar-help]'))"),false);
  const beforeAnswer = await evalJs("document.querySelector('.q-prompt').textContent");
  await evalJs("document.querySelector('.answer-radio')?.click()");
  assert.equal(await evalJs("Boolean(document.querySelector('.answer-review, .chee-mm-trigger, [data-myanmar-help]'))"),false);
  await evalJs("document.getElementById('check-next').click()");
  await waitFor(()=>evalJs("Boolean(document.querySelector('.question-number')?.textContent.includes('Question 2'))"),'Skill Check second question');
  assert.notEqual(await evalJs("document.querySelector('.q-prompt').textContent"),beforeAnswer);
  assert.equal(await evalJs("Boolean(document.querySelector('.answer-review, .chee-mm-trigger, [data-myanmar-help]'))"),false);
  // Cross-page learner shell: all primary entry pages expose the same three links.
  for (const page of ['index.html','practice.html','resources.html','progress.html','curriculum.html','domain.html','skill.html','passages.html','category.html','quiz.html','about.html','methodology.html','privacy.html','404.html']) {
    const params = page === 'domain.html' ? '?track=reading&domain=core-meaning'
      : page === 'skill.html' ? '?track=reading&domain=core-meaning&skill=R1.2' : '';
    await call('Page.navigate', {url:origin+'/'+page+params});
    await waitFor(()=>evalJs("location.pathname.endsWith("+JSON.stringify(page)+") && document.readyState === 'complete' && !!document.querySelector('nav.site-nav, nav.simple-nav')"),page+' header');
    const links = await evalJs("Array.from(document.querySelectorAll('nav.site-nav > a, nav.simple-nav > a')).map(a=>[a.textContent.trim(),new URL(a.href).pathname.split('/').pop()])");
    assert.deepEqual(links.map(pair=>pair[0]), ['Home','Practice Tests','Resources'], page+' navigation labels');
    assert.deepEqual(links.map(pair=>pair[1]), ['index.html','quiz.html','resources.html'], page+' nav destinations');
    const width = await evalJs("({screen:document.documentElement.clientWidth, document:document.documentElement.scrollWidth})");
    assert.ok(width.document <= width.screen + 2, page+' has horizontal overflow at 390px: '+JSON.stringify(width));
  }
  console.log('PASS: interactions, unit journeys, Skill Check isolation and mobile fourteen-page navigation audit');


} finally {
  try {socket?.close();} catch {}
  if(child?.pid) child.kill('SIGKILL');
  server.close();
  fs.rmSync(profile,{recursive:true,force:true});
}
