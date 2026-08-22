/* resources.js — curriculum-first learner resource library */
let library = [];
let activeTrack = "all";
let query = "";
init();

async function init() {
  const listEl = document.getElementById("resource-list");
  try {
    const res = await fetch("data/generated/curriculum.json", { cache: "no-store" });
    if (!res.ok) throw new Error("curriculum unavailable");
    const curriculum = await res.json();
    library = window.StudoLibraryModel.buildResourceLibrary(curriculum.tracks || []);
  } catch (_) {
    listEl.innerHTML = `<div class="empty-state">Resources could not be loaded.</div>`;
    return;
  }
  setupSearch();
  renderTrackFilter();
  renderLibrary();
}

function setupSearch() {
  const input = document.getElementById("resource-search");
  input.addEventListener("input", () => {
    query = input.value.trim().toLowerCase();
    renderLibrary();
  });
}

function renderTrackFilter() {
  const mount = document.getElementById("resource-track-filter");
  const chips = [{ id: "all", label: "All" }, ...library.map((track) => ({ id: track.id, label: track.shortLabel || track.label }))];
  mount.innerHTML = chips.map((item) => `<button class="filter-chip ${activeTrack===item.id?"active":""}" type="button" data-track="${escapeAttr(item.id)}">${escapeHtml(item.label)}</button>`).join("");
  mount.querySelectorAll("[data-track]").forEach((btn) => btn.addEventListener("click", () => {
    activeTrack = btn.dataset.track;
    renderTrackFilter();
    renderLibrary();
  }));
}

function renderLibrary() {
  const mount = document.getElementById("resource-list");
  const summary = document.getElementById("resource-results-summary");
  let resourceCount = 0;
  let topicCount = 0;
  const sections = [];

  for (const track of library) {
    if (activeTrack !== "all" && track.id !== activeTrack) continue;
    const domains = [];
    for (const domain of track.domains) {
      const contextMatch = query && `${domain.label} ${track.label}`.toLowerCase().includes(query);
      const general = contextMatch ? domain.generalResources : domain.generalResources.filter(matchesResource);
      const topics = domain.topics.map((topic) => {
        const topicMatch = matchesTopicLabel(topic, track, domain);
        return { ...topic, resources: (!query || topicMatch) ? topic.resources : topic.resources.filter(matchesResource) };
      }).filter((topic) => topic.resources.length);
      if (!general.length && !topics.length) continue;
      resourceCount += general.length + topics.reduce((sum, topic) => sum + topic.resources.length, 0);
      topicCount += topics.length;
      domains.push(renderDomain(domain, general, topics));
    }
    if (domains.length) sections.push(`<section class="resource-track-section" data-track-section="${escapeAttr(track.id)}">
      <header class="resource-track-heading"><span>RLA</span><h2>${escapeHtml(track.label)}</h2></header>
      ${domains.join("")}
    </section>`);
  }

  summary.textContent = `${resourceCount} resources · ${topicCount} topics${query?" matching your search":""}`;
  mount.innerHTML = sections.length ? sections.join("") : `<div class="empty-state">No resources match your search.</div>`;
}

function matchesTopicLabel(topic, track, domain) {
  if (!query) return true;
  return `${topic.label} ${topic.summary||""} ${domain.label} ${track.label}`.toLowerCase().includes(query);
}

function matchesResource(resource) {
  if (!query) return true;
  return `${resource.title||""} ${resource.description||""} ${resource.type||""}`.toLowerCase().includes(query);
}

function renderDomain(domain, general, topics) {
  const maxWorkbook = Math.max(0, ...topics.flatMap((topic) => topic.resources.map((r) => {
    const role = window.StudoLibraryModel.resourceRole(r);
    return role.id.startsWith("workbook-") ? Number(role.id.split("-")[1]) : 0;
  })));
  return `<section class="resource-domain-section">
    <header class="resource-domain-heading"><h3>${escapeHtml(domain.label)}</h3></header>
    ${general.length ? `<div class="resource-general-block"><div class="resource-general-label">General resources</div><div class="resource-general-links">${general.map((r)=>resourceLink(r, true)).join("")}</div></div>` : ""}
    ${topics.length ? `<div class="resource-topic-table" style="--workbook-count:${maxWorkbook}">${renderTopicHeader(maxWorkbook)}${topics.map((topic)=>renderTopicRow(topic,maxWorkbook)).join("")}</div>` : ""}
  </section>`;
}

function renderTopicHeader(maxWorkbook) {
  const columns = ["Study Guide", ...Array.from({length:maxWorkbook},(_,i)=>`Workbook ${i+1}`)];
  return `<div class="resource-topic-row resource-topic-header" style="--resource-columns:${columns.length}"><span>Topic</span>${columns.map((c)=>`<span>${escapeHtml(c)}</span>`).join("")}</div>`;
}

function renderTopicRow(topic, maxWorkbook) {
  const roleMap = new Map();
  for (const resource of topic.resources) {
    const role = window.StudoLibraryModel.resourceRole(resource);
    roleMap.set(role.id, resource);
  }
  const cells=[resourceCell(roleMap.get("guide"),"Study Guide")];
  for(let i=1;i<=maxWorkbook;i++) cells.push(resourceCell(roleMap.get(`workbook-${i}`),`Workbook ${i}`));
  return `<div class="resource-topic-row" style="--resource-columns:${maxWorkbook+1}" data-resource-topic="${escapeAttr(topic.id)}">
    <div class="resource-topic-name"><strong>${escapeHtml(topic.label)}</strong>${topic.summary?`<span>${escapeHtml(topic.summary)}</span>`:""}</div>
    ${cells.join("")}
  </div>`;
}

function resourceCell(resource, label) {
  if (!resource) return `<span class="resource-cell is-empty" data-label="${escapeAttr(label)}" aria-label="${escapeAttr(label)} unavailable">—</span>`;
  return `<span class="resource-cell" data-label="${escapeAttr(label)}">${resourceLink(resource, false, label)}</span>`;
}

function resourceLink(resource, showTitle=false, fallbackLabel="Open") {
  const href=resource.href||resource.path||"#";
  const external=/^https?:\/\//i.test(href);
  const text=showTitle ? resource.title : fallbackLabel;
  return `<a class="resource-file-link" href="${escapeAttr(safeHref(href))}" ${external?'target="_blank" rel="noopener"':(resource.download!==false?'download':'')}>
    <span>${escapeHtml(text)}</span><b aria-hidden="true">↗</b>
  </a>`;
}

function escapeHtml(str) { const div=document.createElement("div"); div.textContent=str??""; return div.innerHTML; }
function escapeAttr(str) { return escapeHtml(str).replace(/"/g,"&quot;"); }
function safeHref(value) {
  const raw=String(value??"").trim();
  if(!raw) return "#";
  if(raw.startsWith("#")) return raw;
  try {
    const parsed=new URL(raw,window.location.href);
    if(!["http:","https:"].includes(parsed.protocol)) return "#";
    if(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return parsed.href;
    return raw;
  } catch (_) { return "#"; }
}
