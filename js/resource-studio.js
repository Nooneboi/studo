const VALID_TYPES = ['pdf','worksheet','study_guide','notes','reference','link','docx'];
const registryPath = ['content-src','resources','rla.resources.json'];
let projectHandle = null;
let skills = [];
let registry = { schemaVersion: 2, subject: 'rla', resources: [] };
let selectedFile = null;

await init();

async function init() {
  try {
    const [skillDoc, resourceDoc] = await Promise.all([
      fetch('content-src/skills/rla.skills.json', { cache:'no-store' }).then(r => r.json()),
      fetch('content-src/resources/rla.resources.json', { cache:'no-store' }).then(r => r.json()),
    ]);
    skills = skillDoc.skills || [];
    registry = resourceDoc || registry;
    registry.schemaVersion = Math.max(2, Number(registry.schemaVersion || 1));
  } catch (err) {
    console.warn(err);
  }

  bind();
  renderDomains();
  renderSkills();
  renderExisting();
  syncPlacement();
  syncPath();
}

function bind() {
  document.getElementById('resource-connect-btn').addEventListener('click', connectFolder);
  document.getElementById('resource-scope').addEventListener('change', () => { syncPlacement(); syncPath(); });
  document.getElementById('resource-domain').addEventListener('change', () => { renderSkills(); syncPlacement(); syncPath(); });
  document.getElementById('resource-skill').addEventListener('change', syncPath);
  document.getElementById('resource-file').addEventListener('change', (e) => {
    selectedFile = e.target.files?.[0] || null;
    document.getElementById('resource-file-name').textContent = selectedFile?.name || 'No file selected';
    if (selectedFile && !document.getElementById('resource-title').value) {
      document.getElementById('resource-title').value = cleanTitle(selectedFile.name);
    }
  });
  document.getElementById('resource-type').addEventListener('change', syncSourceMode);
  document.getElementById('resource-form').addEventListener('submit', saveResource);
  document.getElementById('resource-reset-btn').addEventListener('click', resetForm);
  document.getElementById('resource-download-registry').addEventListener('click', downloadRegistry);
  syncSourceMode();
}

function domains() {
  return [...new Set(skills.map(s => s.domain).filter(Boolean))];
}

function renderDomains() {
  const el = document.getElementById('resource-domain');
  el.innerHTML = `<option value="">Choose a topic</option>` + domains().map(d => `<option value="${escAttr(d)}">${esc(d)}</option>`).join('');
}

function renderSkills() {
  const domain = document.getElementById('resource-domain').value;
  const el = document.getElementById('resource-skill');
  const list = domain ? skills.filter(s => s.domain === domain) : [];
  el.innerHTML = `<option value="">Choose a skill</option>` + list.map(s => `<option value="${escAttr(s.id)}">${esc(s.label)}</option>`).join('');
}

function syncPlacement() {
  const scope = val('resource-scope') || 'domain';
  const skillLabel = document.getElementById('resource-skill-label');
  const skillSelect = document.getElementById('resource-skill');
  const help = document.getElementById('resource-placement-help');
  const isSkill = scope === 'skill';
  skillSelect.disabled = !isSkill;
  skillLabel.classList.toggle('resource-field-muted', !isSkill);
  help.textContent = isSkill
    ? 'Use Specific skill for notes, worksheets, or practice written only for that one sub-skill.'
    : 'Use Whole topic for a guide or practice pack that covers the full topic.';
}

function syncPath() {
  const scope = val('resource-scope') || 'domain';
  const domain = val('resource-domain');
  const sid = val('resource-skill');
  const skill = skills.find(s => s.id === sid);
  document.getElementById('resource-path').textContent = scope === 'skill'
    ? `RLA → ${domain || 'Choose a topic'} → ${skill?.label || 'Choose a skill'}`
    : `RLA → ${domain || 'Choose a topic'} → Topic files`;
}

function syncSourceMode() {
  const isLink = document.getElementById('resource-type').value === 'link';
  document.getElementById('resource-file-picker-label').style.opacity = isLink ? '.45' : '1';
  document.getElementById('resource-file').disabled = isLink;
  document.getElementById('resource-url').disabled = !isLink;
}

async function connectFolder() {
  if (!window.showDirectoryPicker) {
    setStatus('Folder access unavailable', 'Use Chrome or Edge, or download the registry JSON instead.');
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode:'readwrite' });
    await getDir(handle, 'content-src');
    await getDir(handle, 'assets');
    projectHandle = handle;
    document.getElementById('resource-folder-status').textContent = handle.name;
    setStatus('Connected', 'Files and the resource registry can now be saved directly.');
    await loadRegistryFromProject();
  } catch (err) {
    if (err?.name !== 'AbortError') setStatus('Could not connect', err.message || 'Choose the Chee Skool project folder.');
  }
}

async function loadRegistryFromProject() {
  try {
    const file = await getFileFromPath(projectHandle, registryPath);
    registry = JSON.parse(await file.text());
    registry.schemaVersion = Math.max(2, Number(registry.schemaVersion || 1));
    renderExisting();
  } catch (err) {
    console.warn(err);
  }
}

async function saveResource(event) {
  event.preventDefault();
  const title = val('resource-title');
  const type = val('resource-type');
  const scope = val('resource-scope') || 'domain';
  const domain = val('resource-domain');
  const skillId = val('resource-skill');
  const status = val('resource-status');
  const url = val('resource-url');

  if (!title || !domain) return setStatus('Needs attention', 'Add a title and choose a topic.');
  if (scope === 'skill' && !skillId) return setStatus('Needs attention', 'Choose the specific skill this file belongs to.');
  if (!VALID_TYPES.includes(type)) return setStatus('Needs attention', 'Choose a valid resource type.');
  if (type === 'link' && !/^https?:\/\//i.test(url)) return setStatus('Needs attention', 'Add a complete external URL.');
  if (type !== 'link' && !selectedFile) return setStatus('Needs attention', 'Choose the file you want to attach.');

  const id = uniqueId(`res-rla-${slug(title)}-v1`);
  let href = url;
  if (type !== 'link') {
    const safeName = safeFileName(selectedFile.name);
    href = `assets/resources/${safeName}`;
    if (projectHandle) {
      try {
        await writeBinary(projectHandle, ['assets','resources',safeName], selectedFile);
      } catch (err) {
        return setStatus('Could not save file', err.message || 'Check folder permission.');
      }
    }
  }

  const item = {
    id,
    title,
    type,
    scope,
    domainId: slug(domain),
    domainLabel: domain,
    ...(scope === 'skill' ? { primarySkillId: skillId, skillIds: [skillId] } : {}),
    description: val('resource-description') || undefined,
    href,
    download: type !== 'link',
    status,
    rightsStatus: val('resource-rights'),
    reviewer: val('resource-reviewer') || null,
  };

  registry.schemaVersion = 2;
  registry.resources = [...(registry.resources || []), item];

  if (projectHandle) {
    try {
      await writeText(projectHandle, registryPath, JSON.stringify(registry, null, 2) + '\n');
      setStatus('Saved', `${title} was added to ${scope === 'domain' ? domain : skills.find(s=>s.id===skillId)?.label || skillId}.`);
    } catch (err) {
      return setStatus('Registry save failed', err.message || 'Check folder permission.');
    }
  } else {
    setStatus('Added locally', 'Download the registry JSON, then place the study file in assets/resources/.');
  }

  renderExisting();
  resetForm(false);
}

function renderExisting() {
  const list = registry.resources || [];
  document.getElementById('resource-count').textContent = list.length;
  const mount = document.getElementById('resource-existing-list');
  if (!list.length) {
    mount.innerHTML = `<div class="resource-empty-side">No resources yet.</div>`;
    return;
  }
  mount.innerHTML = list.slice(-6).reverse().map(r => {
    const skill = skills.find(s => s.id === (r.primarySkillId || (r.skillIds || [])[0]));
    const placement = r.scope === 'domain'
      ? `${r.domainLabel || prettyDomain(r.domainId)} · whole topic`
      : `${skill?.label || r.primarySkillId || (r.skillIds || [])[0] || 'Skill'} · specific skill`;
    return `<div class="resource-existing-item">
      <strong>${esc(r.title)}</strong>
      <span>${esc(typeLabel(r.type))} · ${esc(placement)}</span>
    </div>`;
  }).join('');
}

function resetForm(clearStatus = true) {
  document.getElementById('resource-form').reset();
  document.getElementById('resource-scope').value = 'domain';
  selectedFile = null;
  document.getElementById('resource-file-name').textContent = 'No file selected';
  renderSkills();
  syncPlacement();
  syncPath();
  syncSourceMode();
  if (clearStatus) setStatus('Ready', projectHandle ? 'Connected to the project folder.' : 'Connect the project folder to save directly.');
}

function downloadRegistry() {
  const blob = new Blob([JSON.stringify(registry, null, 2) + '\n'], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rla.resources.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function setStatus(title, detail) {
  document.getElementById('resource-save-status').textContent = title;
  document.getElementById('resource-save-detail').textContent = detail;
}

async function getDir(root, name, create = false) {
  return await root.getDirectoryHandle(name, { create });
}
async function getFileFromPath(root, parts) {
  let dir = root;
  for (const name of parts.slice(0,-1)) dir = await dir.getDirectoryHandle(name);
  return await (await dir.getFileHandle(parts.at(-1))).getFile();
}
async function writeText(root, parts, text) {
  let dir = root;
  for (const name of parts.slice(0,-1)) dir = await dir.getDirectoryHandle(name, { create:true });
  const fh = await dir.getFileHandle(parts.at(-1), { create:true });
  const writable = await fh.createWritable();
  await writable.write(text);
  await writable.close();
}
async function writeBinary(root, parts, file) {
  let dir = root;
  for (const name of parts.slice(0,-1)) dir = await dir.getDirectoryHandle(name, { create:true });
  const fh = await dir.getFileHandle(parts.at(-1), { create:true });
  const writable = await fh.createWritable();
  await writable.write(await file.arrayBuffer());
  await writable.close();
}

function uniqueId(base) {
  const ids = new Set((registry.resources || []).map(r => r.id));
  if (!ids.has(base)) return base;
  let i = 2;
  while (ids.has(base.replace(/-v1$/, `-v${i}`))) i++;
  return base.replace(/-v1$/, `-v${i}`);
}
function cleanTitle(name) { return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g,' ').replace(/\b\w/g,m => m.toUpperCase()); }
function slug(text) { return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function prettyDomain(id) { return String(id || '').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase()); }
function safeFileName(name) { return String(name).replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-'); }
function typeLabel(type) { return ({pdf:'PDF',worksheet:'Worksheet',study_guide:'Study guide',notes:'Notes',reference:'Reference',link:'Link',docx:'DOCX'})[type] || type; }
function val(id) { return document.getElementById(id).value.trim(); }
function esc(value) { const d=document.createElement('div'); d.textContent=value??''; return d.innerHTML; }
function escAttr(value) { return esc(value).replace(/"/g,'&quot;'); }
