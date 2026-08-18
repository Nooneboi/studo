/* passages.js — one home for mixed-skill passage sets */
init();

async function init(){
  const mount=document.getElementById("passage-list");
  let curriculum;
  try { curriculum=await Data.loadCurriculum(); }
  catch (_) { mount.innerHTML=`<div class="empty-state">Passage practice could not be loaded.</div>`; return; }
  const sets=[...(curriculum.passagePractice||[])].sort((a,b)=>(b.questionCount||0)-(a.questionCount||0) || String(a.title||"").localeCompare(String(b.title||"")));
  if(!sets.length){ mount.innerHTML=`<p class="passage-practice-empty">No passage practice published yet.</p>`; return; }
  mount.innerHTML=sets.map(renderSet).join("");
}

function renderSet(set){
  const p=set.passageMeta||{};
  const info=[];
  if(p.textType==="literary") info.push("Literary");
  else {
    if(p.context) info.push(label(p.context));
    if(p.textType) info.push(label(p.textType));
  }
  if(set.questionCount) info.push(`${set.questionCount} questions`);
  const source=sourceLine(p);
  return `<a class="passage-practice-row" href="module.html?file=${encodeURIComponent(set.file)}&return=${encodeURIComponent('passages.html')}">
    <div class="passage-practice-copy">
      <strong>${escapeHtml(set.title)}</strong>
      <span class="passage-practice-meta">${escapeHtml(info.join(" · "))}</span>
      ${source?`<span class="passage-practice-source">${escapeHtml(source)}</span>`:""}
    </div>
  </a>`;
}

function sourceLine(p){
  if(p.sourceType==="original") return p.author && p.author!=="Studo" ? p.author : "Studo original";
  const parts=[];
  if(p.author) parts.push(p.author);
  if(p.workTitle) parts.push(p.workTitle);
  if(parts.length) return parts.join(" · ");
  return p.attribution || "";
}
function label(v){ return String(v||"").replace(/_/g," ").replace(/\b\w/g,(m)=>m.toUpperCase()); }
function escapeHtml(v){const d=document.createElement("div");d.textContent=v??"";return d.innerHTML;}
