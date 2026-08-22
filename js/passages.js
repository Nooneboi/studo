/* passages.js — grouped mixed-skill passage library */
let allSets = [];
let query = "";
init();

async function init(){
  const mount=document.getElementById("passage-list");
  let curriculum;
  try { curriculum=await Data.loadCurriculum(); }
  catch (_) { mount.innerHTML=`<div class="empty-state">Passage practice could not be loaded.</div>`; return; }
  allSets=[...(curriculum.passagePractice||[])];
  setupSearch();
  render();
}

function setupSearch(){
  const input=document.getElementById("passage-search");
  input.addEventListener("input",()=>{
    query=input.value.trim().toLowerCase().replace(/_/g,"-");
    render();
  });
}

function render(){
  const mount=document.getElementById("passage-list");
  const summary=document.getElementById("passage-results-summary");
  const model=window.StudoLibraryModel;
  const filtered=query ? allSets.filter((set)=>model.passageSearchText(set).includes(query)) : allSets;
  const groups=model.groupPassageSets(filtered);
  summary.textContent=query ? `${filtered.length} of ${allSets.length} passages` : `${allSets.length} passages · grouped by reading context`;
  if(!filtered.length){
    mount.innerHTML=`<div class="empty-state passage-library-empty">No passages match “${escapeHtml(query)}”.</div>`;
    return;
  }
  mount.innerHTML=groups.map(renderGroup).join("");
}

function renderGroup(group){
  const empty=!group.items.length;
  return `<section class="passage-group ${empty?"is-empty":""}" aria-labelledby="passage-group-${group.id}">
    <header class="passage-group-head">
      <h2 id="passage-group-${group.id}">${escapeHtml(group.label)}</h2>
      <span>${group.items.length}</span>
    </header>
    <div class="passage-group-list">
      ${empty ? `<p class="passage-group-empty">No matches in this group.</p>` : group.items.map(renderSet).join("")}
    </div>
  </section>`;
}

function renderSet(set){
  const p=set.passageMeta||{};
  const textType=p.textType==="literary" ? "Literary" : "Informational";
  const difficulty=label(set.difficulty||"mixed");
  const meta=[textType,difficulty,set.questionCount?`${set.questionCount} questions`:null].filter(Boolean).join(" · ");
  return `<a class="passage-group-row" href="module.html?file=${encodeURIComponent(set.file)}&return=${encodeURIComponent('passages.html')}">
    <strong>${escapeHtml(set.title)}</strong>
    <span>${escapeHtml(meta)}</span>
  </a>`;
}

function label(v){ return String(v||"").replace(/_/g," ").replace(/\b\w/g,(m)=>m.toUpperCase()); }
function escapeHtml(v){const d=document.createElement("div");d.textContent=v??"";return d.innerHTML;}
