/* skill.js — files first, web assessment second */
init();
async function init() {
  const mount = document.getElementById("skill-view");
  const p = new URLSearchParams(location.search);
  const trackId=p.get("track")||"reading", domainId=p.get("domain"), skillId=p.get("skill");
  let curriculum;
  try { curriculum=await Data.loadCurriculum(); }
  catch (_) { mount.innerHTML=`<div class="empty-state">The curriculum could not be loaded.</div>`; return; }
  const track=curriculum.tracks.find((x)=>x.id===trackId)||curriculum.tracks[0];
  const domain=track?.domains.find((x)=>x.id===domainId)||track?.domains[0];
  const skill=domain?.skills.find((x)=>x.id===skillId);
  if(!track||!domain||!skill){ mount.innerHTML=`<div class="empty-state">This skill could not be found.</div>`; return; }

  const resources=skill.studyResources||skill.resources||[];
  const checks=skill.checks||skill.sets||[];
  document.title=`Studo — ${skill.label}`;
  mount.innerHTML=`
    <header class="skill-library-hero">
      <a class="curriculum-back" href="domain.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}">← ${escapeHtml(domain.label)}</a>
      <div class="page-kicker">${escapeHtml(track.label)}</div>
      <h1>${escapeHtml(skill.label)}</h1>
    </header>

    <section class="skill-library-section">
      <div class="skill-library-heading"><h2>Study material</h2></div>
      ${resources.length ? `<div class="skill-library-list">${resources.map(renderResource).join("")}</div>` : `<p class="skill-library-empty">No study files published yet.</p>`}
    </section>

    <section class="skill-library-section skill-check-section">
      <div class="skill-library-heading"><h2>Check yourself</h2><span>Optional</span></div>
      ${checks.length ? `<div class="skill-library-list">${checks.map(renderCheck).join("")}</div>` : `<p class="skill-library-empty">No quiz is available yet.</p>`}
    </section>`;
}

function renderResource(r){
  const type=({pdf:"PDF",worksheet:"Worksheet",study_guide:"Study guide",notes:"Notes",reference:"Reference",link:"Link"})[r.type]||"File";
  const external=/^https?:\/\//i.test(r.href||r.path||"");
  return `<a class="skill-library-row" href="${escapeAttr(r.href||r.path||"#")}" ${r.download!==false&&!external?"download":""} ${external?'target="_blank" rel="noopener"':''}>
    <span class="skill-library-type">${escapeHtml(type)}</span><strong>${escapeHtml(r.title)}</strong><b aria-hidden="true">${external?"↗":"↓"}</b>
  </a>`;
}
function renderCheck(set){
  const kind=({quiz:"Quiz",mixed_review:"Review",extended_response:"Extended response",editing_practice:"Quiz",passage_practice:"Quiz",skill_drill:"Quiz"})[set.curriculum?.contentKind]||"Quiz";
  return `<a class="skill-library-row" href="module.html?file=${encodeURIComponent(set.file)}"><span class="skill-library-type">${escapeHtml(kind)}</span><strong>${escapeHtml(set.title)}</strong><b aria-hidden="true">→</b></a>`;
}
function escapeHtml(v){const d=document.createElement("div");d.textContent=v??"";return d.innerHTML;}
function escapeAttr(v){return escapeHtml(v).replace(/"/g,"&quot;");}
