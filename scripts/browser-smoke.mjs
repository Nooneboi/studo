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
let chromeStderr = '';
for (const binary of candidates) {
  if (spawnSync('which',[binary],{stdio:'ignore'}).status !== 0) continue;
  child = spawn(binary, ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile, 'about:blank'], {stdio:['ignore','ignore','pipe']});
  child.stderr?.on('data', data => { chromeStderr=(chromeStderr+String(data)).slice(-4000); });
  child.on('error', error => { chromeStderr += '\\nChrome launch error: '+error.message; });
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
  const port=await waitFor(()=>fs.existsSync(portFile)&&Number(fs.readFileSync(portFile,'utf8').split('\n')[0]),'Chrome debugger',25000).catch(error=>{throw new Error(error.message+'; exit='+child?.exitCode+'; stderr='+chromeStderr);});
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
  await evalJs("document.querySelector('[data-myanmar-help]').focus()");
  await evalJs("document.querySelector('[data-myanmar-help]').click()");
  assert.equal(await evalJs("document.getElementById('chee-mm-drawer').getAttribute('aria-hidden')"),'false');
  assert.equal(await evalJs("document.getElementById('chee-mm-drawer').getAttribute('role')"),'dialog');
  assert.equal(await evalJs("document.activeElement.classList.contains('chee-mm-close')"),true);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  assert.equal(await evalJs("document.getElementById('chee-mm-drawer').getAttribute('aria-hidden')"),'true');
  assert.equal(await evalJs("document.activeElement.hasAttribute('data-myanmar-help')"),true);
  await evalJs("document.querySelector('[data-myanmar-help]').click()");
  await evalJs("document.querySelector('.chee-mm-close').click()");
  assert.equal(await evalJs("document.getElementById('chee-mm-drawer').getAttribute('aria-hidden')"),'true');
  await evalJs("document.getElementById('next-question').click()");
  await waitFor(()=>evalJs("document.querySelector('.q-prompt')?.textContent.includes('How does the table')"),'Next question');
  // Guided sorting: partial draft must not enable Check or reveal correctness.
  await navigate('set-rla-inference-active-methods-v1','q1');
  assert.equal(await evalJs("document.querySelectorAll('[data-classify-item]').length"),4);
  assert.equal(await evalJs("document.querySelector('.interaction-check').disabled"),true);
  await evalJs("document.querySelector('[data-classify-item=i1] [data-choice-zone=stated]').focus()");
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  assert.equal(await evalJs("document.querySelector('[data-classify-item=i1] [data-choice-zone=stated]').getAttribute('aria-pressed')"),'true');
  assert.equal(await evalJs("document.querySelector('.interaction-check').disabled"),true);
  assert.equal(await evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),false);
  await evalJs("document.querySelector('[data-classify-item=i2] [data-choice-zone=guess]').click()");
  await evalJs("document.querySelector('[data-classify-item=i3] [data-choice-zone=guess]').click()");
  await evalJs("document.querySelector('[data-classify-item=i4] [data-choice-zone=stated]').click()");
  assert.equal(await evalJs("document.querySelector('.interaction-check').disabled"),false);
  await evalJs("document.querySelector('.interaction-check').click()");
  assert.equal(await evalJs("Boolean(document.querySelector('.guided-retry-feedback'))"),true);
  assert.equal(await evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),false);
  assert.equal(await evalJs("document.getElementById('next-question').disabled"),true);
  assert.equal(await evalJs("document.querySelector('[data-classify-item=i2] [data-choice-zone=guess]').getAttribute('aria-pressed')"),'true');
  await call('Page.reload',{ignoreCache:true});
  await waitFor(()=>evalJs("Boolean(document.querySelector('.guided-retry-feedback') && document.querySelector('[data-classify-item=i2] [data-choice-zone=guess]'))"),'retry hint restored after reload');
  assert.equal(await evalJs("document.getElementById('next-question').disabled"),true);
  assert.equal(await evalJs("document.querySelector('[data-classify-item=i2] [data-choice-zone=guess]').getAttribute('aria-pressed')"),'true');
  await evalJs("document.querySelector('[data-classify-item=i2] [data-choice-zone=inference]').click()");
  await evalJs("document.querySelector('.interaction-check').click()");
  await waitFor(()=>evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),'sorting explanation after successful retry');
  assert.equal(await evalJs("document.getElementById('next-question').disabled"),false);

  // Select text: highlighted passage target is chosen before Check but not graded early.
  await navigate('set-rla-inference-active-methods-v1','q2');
  assert.ok(await evalJs("document.querySelectorAll('[data-select-target]').length") >= 2);
  assert.equal(await evalJs("document.querySelector('.interaction-check').disabled"),true);
  await evalJs("document.querySelector('[data-select-target=s2]').click()");
  assert.equal(await evalJs("document.querySelector('[data-select-target=s2]').getAttribute('aria-pressed')"),'true');
  assert.equal(await evalJs("document.querySelector('.interaction-check').disabled"),false);
  assert.equal(await evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),false);
  await evalJs("document.querySelector('.interaction-check').click()");
  assert.equal(await evalJs("Boolean(document.querySelector('.guided-retry-feedback'))"),true);
  assert.equal(await evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),false);
  assert.equal(await evalJs("document.getElementById('next-question').disabled"),true);
  await evalJs("document.querySelector('.interaction-check').click()");
  await waitFor(()=>evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),'selection explanation after second incorrect attempt');
  assert.equal(await evalJs("document.getElementById('next-question').disabled"),false);

  // Evidence-based choice: wrong selection still shows a teachable explanation.
  await navigate('set-rla-supporting-details-active-methods-v1','q3');
  assert.equal(await evalJs("document.querySelectorAll('.answer-radio').length"),4);
  await evalJs("document.querySelector('.answer-radio[value=c]').click()");
  assert.equal(await evalJs("document.querySelector('.interaction-check').disabled"),false);
  assert.equal(await evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),false);
  await evalJs("document.querySelector('.interaction-check').click()");
  await waitFor(()=>evalJs("Boolean(document.querySelector('[data-myanmar-help]'))"),'evidence feedback after Check');
  assert.equal(await evalJs("document.getElementById('next-question').disabled"),false);
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
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await navigate('set-rla-summary-active-methods-v1','q2');
  assert.equal(await evalJs("document.querySelectorAll('.answer-radio').length"),4);
  // Mobile learner can jump between passage and question without changing answer state.
  assert.equal(await evalJs("Boolean(document.querySelector('#study-passage') && document.querySelector('#study-question'))"),true);
  assert.equal(await evalJs("getComputedStyle(document.querySelector('.study-mobile-jump-forward')).display !== 'none'"),true);
  await evalJs("document.querySelector('.study-mobile-jump-forward').click()");
  assert.equal(await evalJs("location.hash"),'#study-question');
  await evalJs("document.querySelector('.study-mobile-jump-back').click()");
  assert.equal(await evalJs("location.hash"),'#study-passage');
  await evalJs("document.querySelector('.answer-radio[value=a]').click()");
  assert.equal(await evalJs("document.querySelector('.answer-radio[value=a]').checked"),true);
  await evalJs("document.querySelector('.study-mobile-jump-forward').click()");
  assert.equal(await evalJs("document.querySelector('.answer-radio[value=a]').checked"),true);
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
  // Release acceptance: independent Check must remain silent until every answer
  // has been submitted, and keyboard selection must work without a pointer.
  await call('Page.navigate',{url:origin+'/check.html?file=generated%2Fmodules%2Fset-rla-check-inference-v1.json'});
  await waitFor(()=>evalJs("Boolean(document.querySelector('#check-next') && document.querySelectorAll('.answer-radio').length===4)"),'Inference check ready');
  assert.equal(await evalJs("Boolean(document.querySelector('.answer-review, .chee-mm-trigger, [data-myanmar-help]'))"),false);
  await evalJs("document.querySelector('.answer-radio[value=a]').focus()");
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  assert.equal(await evalJs("document.querySelector('.answer-radio[value=a]').checked"),true,'keyboard Space selects MCQ answer');
  for(let question=1;question<=6;question++){
    if(question>1){
      await waitFor(()=>evalJs("document.querySelector('.question-number')?.textContent.includes('Question "+question+" of')"),'Check question '+question);
      await evalJs("document.querySelector('.answer-radio[value=a]').click()");
    }
    assert.equal(await evalJs("Boolean(document.querySelector('.answer-review, .chee-mm-trigger, [data-myanmar-help], .correct-answer, .incorrect-answer'))"),false,'No grading before final submit');
    await evalJs("document.getElementById('check-next').click()");
  }
  await waitFor(()=>evalJs("Boolean(document.querySelector('#check-result-heading'))"),'submitted check result');
  assert.equal(await evalJs("document.querySelector('#check-result-heading').textContent.trim()"),'1 / 6 correct');
  assert.equal(await evalJs("document.querySelectorAll('.answer-review.is-wrong').length"),5);
  assert.equal(await evalJs("document.activeElement.id"),'check-result-heading','Result heading receives keyboard focus');
  assert.equal(await evalJs("document.getElementById('check-header-progress').textContent.trim()"),'Complete');
  assert.equal(await evalJs("document.querySelector('.check-next-step')?.textContent.includes('Main Idea')"),false,'Inference results must not recommend Main Idea');
  assert.equal(await evalJs("document.querySelector('.check-next-step')?.textContent.includes('Review your missed questions.')"),true);
  if (await evalJs("document.querySelectorAll('[data-check-myanmar]').length") > 0) {
    await evalJs("document.querySelector('[data-check-myanmar]').focus()");
    await evalJs("document.querySelector('[data-check-myanmar]').click()");
    assert.equal(await evalJs("document.getElementById('chee-mm-drawer').getAttribute('role')"),'dialog');
    assert.equal(await evalJs("document.getElementById('chee-mm-drawer').getAttribute('aria-modal')"),'true');
    assert.equal(await evalJs("document.activeElement.classList.contains('chee-mm-close')"),true);
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    assert.equal(await evalJs("document.getElementById('chee-mm-drawer').getAttribute('aria-hidden')"),'true');
    assert.equal(await evalJs("document.activeElement.hasAttribute('data-check-myanmar')"),true);
  }
  // A Check must never reveal answers early when the final question is reached
  // with earlier questions unanswered.
  await call('Page.navigate',{url:origin+'/check.html?file=generated%2Fmodules%2Fset-rla-check-inference-v1.json'});
  await waitFor(()=>evalJs("Boolean(document.querySelector('#check-next') && document.querySelectorAll('.answer-radio').length===4)"),'new Check ready');
  for(let question=1;question<6;question++) {
    await evalJs("document.getElementById('check-next').click()");
    await waitFor(()=>evalJs("document.querySelector('.question-number')?.textContent.includes('Question "+(question+1)+" of')"),'unanswered Check page');
  }
  await evalJs("document.getElementById('check-next').click()");
  await waitFor(()=>evalJs("Boolean(document.querySelector('#check-answer-status[role=alert]'))"),'missing answers notice');
  assert.equal(await evalJs("document.querySelector('#check-answer-status').textContent.includes('6 questions')"),true);
  assert.equal(await evalJs("Boolean(document.querySelector('#check-result-heading, .answer-review'))"),false);
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
  // Capture visual evidence at actual desktop, tablet and mobile viewports.
  const auditDir = path.resolve('visual-audit');
  fs.mkdirSync(auditDir, {recursive: true});
  const visualCases = [
    ['home', 'index.html', 'body'],
    ['practice', 'practice.html', '.practice-main-wide'],
    ['resources', 'resources.html', 'main'],
    ['skill', 'skill.html?track=reading&domain=core-meaning&skill=R1.2', '#skill-view'],
    ['lesson', 'module.html?file=generated%2Fmodules%2Fset-rla-inference-active-methods-v1.json&question=q3', '.study-workspace'],
    ['check', 'check.html?file=generated%2Fmodules%2Fset-rla-check-claims-structure-v1.json&return=skill.html%3Ftrack%3Darguments%26domain%3Dargument-analysis%26unit%3Dclaims-argument-structure', '.check-workspace'],
  ];
  const visualReport = [];
  for (const [size, width, height, mobile] of [['desktop',1280,900,false],['tablet',768,1024,true],['mobile',390,844,true]]) {
    // A mobile:true viewport can retain Chrome's 768px minimum layout width.
    // Use exact CSS viewport dimensions for responsive breakpoints; enable touch separately.
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await call('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:1});
    for (const [name,url,selector] of visualCases) {
      await call('Page.navigate',{url:origin+'/'+url});
      await waitFor(()=>evalJs("Boolean(document.readyState === 'complete' && document.querySelector("+JSON.stringify(selector)+"))"),name+' '+size+' ready');
      await evalJs('window.scrollTo(0, 0)');
      await delay(180);
      const metrics = await evalJs(`(() => {
        const main=document.querySelector(${JSON.stringify(selector)});
        const rect=main?.getBoundingClientRect();
        const root=document.documentElement;
        const headings=[...document.querySelectorAll('h1')].filter(e=>e.getBoundingClientRect().width>0);
        const tappable=[...document.querySelectorAll('a[href],button,input,select,textarea')].filter(e=>{
          const r=e.getBoundingClientRect(); const st=getComputedStyle(e);
          return r.width>0 && r.height>0 && st.visibility!=='hidden' && st.display!=='none';
        });
        return {title:document.title, viewport:root.clientWidth, layoutViewport:innerWidth, scrollWidth:root.scrollWidth,
          horizontalOverflow:root.scrollWidth>root.clientWidth+2,
          mainWidth:Math.round(rect?.width||0),
          missingMain:!rect||rect.width<100,
          headings:headings.length,
          tinyControls:tappable.filter(e=>{const r=e.getBoundingClientRect();return r.height<24 || r.width<24}).length,
          controlCount:tappable.length,
          bodyFont:getComputedStyle(document.body).fontFamily,
          headingFont:headings[0] ? getComputedStyle(headings[0]).fontSize : null };
      })()`);
      if (mobile && ['home','practice','resources','skill'].includes(name)) {
        const extraNav=await evalJs("Boolean(document.querySelector('.mobile-primary-nav'))");
        assert.equal(extraNav,false,'Duplicate fixed navigation on '+name+' '+size);
      }
      if (size === 'mobile' && name === 'resources') {
        const shortLinks=await evalJs("Array.from(document.querySelectorAll('.resource-file-link')).filter(a=>a.getBoundingClientRect().height<40).length");
        if (shortLinks) {
          const styleEvidence=await evalJs("(() => {const e=document.querySelector('.resource-file-link');const s=getComputedStyle(e);return {height:e?.getBoundingClientRect().height,display:s.display,minHeight:s.minHeight,padding:s.padding,width:innerWidth,css:document.querySelector('link[href=\\\"css/chee-system.css\\\"]')?.href}})()");
          console.error('Resource touch target computed styles',styleEvidence);
        }
        assert.equal(shortLinks,0,'Resource links should have usable mobile tap targets');
      }
      assert.equal(metrics.layoutViewport,width,name+' '+size+' CSS viewport mismatch');
      visualReport.push({page:name,size,...metrics});
      const result=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
      fs.writeFileSync(path.join(auditDir,name+'-'+size+'.png'),Buffer.from(result.data,'base64'));
    }
  }
  fs.writeFileSync(path.join(auditDir,'metrics.json'),JSON.stringify(visualReport,null,2)+'\\n');
  const overflows=visualReport.filter(x=>x.horizontalOverflow||x.missingMain);
  if(overflows.length) {
    console.error('Responsive audit detected layout problems:',JSON.stringify(overflows));
    process.exitCode=1;
  }
  console.log('Visual audit captured',visualReport.length,'viewport/page combinations;',overflows.length,'overflow or missing-main failures');
  console.log('PASS: interactions, unit journeys, Skill Check isolation, mobile fourteen-page navigation audit');


} finally {
  try {socket?.close();} catch {}
  if(child?.pid) child.kill('SIGKILL');
  server.close();
  // Chrome may still flush profile files briefly after process termination.
  // Retry cleanup instead of failing an otherwise successful browser audit.
  try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:150}); }
  catch (error) { console.warn('Chrome temp cleanup warning:', error.message); }
}
