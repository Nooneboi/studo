import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const curriculum = readJson('data/generated/curriculum.json');

function loadModel() {
  const modelPath = path.join(root, 'js/library-model.js');
  assert.ok(fs.existsSync(modelPath), 'js/library-model.js must exist');
  const code = fs.readFileSync(modelPath, 'utf8');
  const context = { globalThis: {}, window: undefined };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: modelPath });
  return context.globalThis.StudoLibraryModel;
}

test('homepage Explore RLA links use published curriculum track ids', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const published = new Set((curriculum.tracks || []).map((t) => t.id));
  const hrefs = [...html.matchAll(/href="curriculum\.html\?track=([^"]+)"/g)].map((m) => decodeURIComponent(m[1]));
  assert.ok(hrefs.length >= published.size, 'homepage should expose all published RLA tracks');
  for (const id of published) assert.ok(hrefs.includes(id), `homepage must link to published track ${id}`);
  for (const id of hrefs) assert.ok(published.has(id), `homepage track link ${id} must resolve to a published track`);
});

test('Practice search uses learner units for unit-based tracks and skills for Reading', () => {
  const model = loadModel();
  assert.equal(typeof model?.buildPracticeSearchItems, 'function');
  const items = model.buildPracticeSearchItems(curriculum.tracks || []);

  const er = items.filter((item) => item.trackId === 'extended-response');
  assert.ok(er.some((item) => item.label === 'Thesis & Evidence' && item.unitId === 'thesis-evidence'));
  assert.ok(er.every((item) => item.unitId && !item.skillId), 'ER search results should be learner units');

  const language = items.filter((item) => item.trackId === 'language');
  assert.equal(language.length, 7, 'Language should expose seven learner units in search');
  assert.ok(language.every((item) => item.unitId && !item.skillId));

  const reading = items.filter((item) => item.trackId === 'reading');
  assert.equal(reading.length, 22, 'Reading should expose its 22 learner-facing skills');
  assert.ok(reading.every((item) => item.skillId && !item.unitId));
});

test('Passage Practice groups every published passage exactly once into four learner groups', () => {
  const model = loadModel();
  assert.equal(typeof model?.groupPassageSets, 'function');
  const sets = curriculum.passagePractice || [];
  const groups = model.groupPassageSets(sets);
  assert.deepEqual(Array.from(groups.map((g) => g.id)), ['science', 'workplace', 'community-civics', 'literary']);
  const ids = groups.flatMap((g) => g.items.map((item) => item.id || item.file));
  assert.equal(ids.length, sets.length);
  assert.equal(new Set(ids).size, sets.length, 'each passage should appear exactly once');
  assert.ok(groups.every((g) => g.items.length > 0), 'all four learner groups should contain passages');
});

test('Resources group every unique curriculum resource exactly once by learner topic', () => {
  const model = loadModel();
  assert.equal(typeof model?.buildResourceLibrary, 'function');
  const library = model.buildResourceLibrary(curriculum.tracks || []);
  const rendered = [];
  for (const track of library) {
    for (const domain of track.domains) {
      rendered.push(...(domain.generalResources || []).map((r) => r.id));
      for (const topic of domain.topics || []) rendered.push(...topic.resources.map((r) => r.id));
    }
  }

  const expected = new Set();
  for (const track of curriculum.tracks || []) {
    for (const domain of track.domains || []) {
      for (const r of domain.topicResources || domain.resources || []) if (r?.id) expected.add(r.id);
      if (domain.units?.length) {
        for (const unit of domain.units) for (const r of unit.studyResources || unit.resources || []) if (r?.id) expected.add(r.id);
      } else {
        for (const skill of domain.skills || []) for (const r of skill.studyResources || skill.resources || []) if (r?.id) expected.add(r.id);
      }
    }
  }

  assert.equal(rendered.length, expected.size, 'library should render each unique resource once');
  assert.equal(new Set(rendered).size, expected.size, 'library must not duplicate resources');

  const erTrack = library.find((t) => t.id === 'extended-response');
  const erTopics = erTrack.domains.flatMap((d) => d.topics || []);
  assert.ok(erTopics.some((topic) => topic.label === 'Thesis & Evidence'));
  assert.ok(!erTopics.some((topic) => topic.label === 'Build a thesis'), 'internal ER skill labels should not replace learner units');
});

test('Passage and Resource library pages expose learner search/filter controls', () => {
  const passagesHtml = fs.readFileSync(path.join(root, 'passages.html'), 'utf8');
  assert.match(passagesHtml, /id="passage-search"/);
  assert.match(passagesHtml, /id="passage-results-summary"/);
  assert.match(passagesHtml, /js\/library-model\.js/);

  const resourcesHtml = fs.readFileSync(path.join(root, 'resources.html'), 'utf8');
  assert.match(resourcesHtml, /id="resource-search"/);
  assert.match(resourcesHtml, /id="resource-track-filter"/);
  assert.match(resourcesHtml, /js\/library-model\.js/);
});

test('explicit invalid track ids do not silently fall back to Reading', () => {
  const curriculumJs = fs.readFileSync(path.join(root, 'js/curriculum.js'), 'utf8');
  const domainJs = fs.readFileSync(path.join(root, 'js/domain.js'), 'utf8');
  assert.match(curriculumJs, /requestedTrackId/);
  assert.match(curriculumJs, /This curriculum area could not be found/);
  assert.doesNotMatch(curriculumJs, /find\(\(item\) => item\.id === trackId\) \|\| curriculum\.tracks\[0\]/);
  assert.match(domainJs, /requestedTrackId/);
  assert.doesNotMatch(domainJs, /find\(\(t\) => t\.id === trackId\) \|\| curriculum\.tracks\[0\]/);
});

test('resource rows preserve learner-facing file labels for stacked mobile layout', () => {
  const resourcesJs = fs.readFileSync(path.join(root, 'js/resources.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'css/site.css'), 'utf8');
  assert.match(resourcesJs, /data-label=/);
  assert.match(css, /content:\s*attr\(data-label\)/);
});

test('static internal HTML links resolve to existing project files', () => {
  const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
  const missing = [];
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (!href || href.startsWith('#') || /^https?:\/\//i.test(href) || href.startsWith('mailto:')) continue;
      const target = href.split(/[?#]/)[0];
      if (!target || target.includes('${')) continue;
      if (!fs.existsSync(path.join(root, target))) missing.push(`${file} -> ${target}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('search normalization treats underscore and hyphen topic labels as normal words', () => {
  const model = loadModel();
  const civic = (curriculum.passagePractice || []).find((set) => set.passageMeta?.context === 'social_studies');
  assert.ok(civic, 'expected a social_studies passage fixture');
  assert.ok(model.passageSearchText(civic).includes('social studies'));
  const practiceItems = model.buildPracticeSearchItems(curriculum.tracks || []);
  const er = practiceItems.find((item) => item.trackId === 'extended-response');
  assert.ok(er.searchText.includes('extended response'));
});

test('learner navigation consistently labels quiz.html as Mock', () => {
  const learnerPages = ['index.html','practice.html','passages.html','resources.html','progress.html','curriculum.html','domain.html','category.html','skill.html','about.html','methodology.html','privacy.html','404.html'];
  for (const file of learnerPages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /<a href="quiz\.html"[^>]*>Mock<\/a>/, `${file} should label the learner-facing mock route as Mock`);
    assert.doesNotMatch(html, /<a href="quiz\.html"[^>]*>Quiz<\/a>/, `${file} should not expose the old Quiz label`);
  }
});

test('Resource and Passage Practice heroes place search in a right-side discovery column on desktop', () => {
  const resourcesHtml = fs.readFileSync(path.join(root, 'resources.html'), 'utf8');
  const passagesHtml = fs.readFileSync(path.join(root, 'passages.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'css/site.css'), 'utf8');
  assert.match(resourcesHtml, /class="resource-library-hero"/);
  assert.match(resourcesHtml, /class="[^"]*resource-hero-search[^"]*"/);
  assert.match(passagesHtml, /class="passage-library-hero"/);
  assert.match(passagesHtml, /class="[^"]*passage-hero-search[^"]*"/);
  assert.match(css, /\.resource-library-hero\s*\{[^}]*grid-template-columns:/s);
  assert.match(css, /\.passage-library-hero\s*\{[^}]*grid-template-columns:/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.resource-library-hero[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.passage-library-hero[^}]*grid-template-columns:\s*1fr/s);
});

test('Passage Practice uses roomier desktop columns while preserving responsive 4-2-1 layout', () => {
  const css = fs.readFileSync(path.join(root, 'css/site.css'), 'utf8');
  assert.match(css, /\.passage-practice-groups\s*\{[^}]*grid-template-columns:\s*repeat\(4,[^}]*gap:\s*32px\s+64px/s);
  assert.match(css, /@media\s*\(max-width:\s*980px\)[\s\S]*\.passage-practice-groups\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.match(css, /@media\s*\(max-width:\s*680px\)[\s\S]*\.passage-practice-groups\s*\{[^}]*grid-template-columns:\s*1fr/s);
});

test('practice Tools menu keeps useful study actions and removes scratch drawing controls', () => {
  const html = fs.readFileSync(path.join(root, 'module.html'), 'utf8');
  const moduleJs = fs.readFileSync(path.join(root, 'js/module.js'), 'utf8');
  const toolsJs = fs.readFileSync(path.join(root, 'js/focus-tools.js'), 'utf8');
  assert.match(html, /id="notes-toggle"/);
  assert.match(html, /id="highlight-toggle"/);
  assert.match(html, />Highlight text</);
  assert.match(html, />Reset this practice</);
  assert.match(html, />Print module</);
  assert.match(html, />Copy passage \+ question</);
  assert.match(html, />Share link</);
  assert.match(html, /id="focus-tool-status"[^>]*aria-live="polite"/);
  assert.doesNotMatch(html, /data-annotate-mode=/);
  assert.doesNotMatch(html, /annotate-clear-btn/);
  assert.doesNotMatch(html, /Mark mastered/);
  assert.doesNotMatch(html, /js\/annotate\.js/);
  assert.equal(fs.existsSync(path.join(root, 'js/annotate.js')), false, 'retired scratch-drawing code should not ship in Alpha');
  assert.doesNotMatch(moduleJs, /setDeleted\(/);
  assert.match(moduleJs, /Highlight saved on this device/);
  assert.match(moduleJs, /Store\.setNote\(/);
  assert.match(moduleJs, /Store\.resetQuiz\(/);
  assert.match(moduleJs, /Store\.setPassageHighlights/);
  assert.match(moduleJs, /sanitizeHighlightMarkup/);
  assert.match(toolsJs, /sq:textScale/);
  assert.match(toolsJs, /window\.print\(/);
  assert.match(toolsJs, /keydown/);
  assert.match(toolsJs, /Escape/);
  assert.match(toolsJs, /navigator\.share/);
  assert.match(toolsJs, /navigator\.clipboard\.writeText/);
});


test('practice reset clears transient confidence UI and return links stay same-origin', () => {
  const moduleJs = fs.readFileSync(path.join(root, 'js/module.js'), 'utf8');
  assert.match(moduleJs, /Object\.keys\(confidenceSelections\)[\s\S]*delete confidenceSelections\[key\]/, 'Reset should clear unsaved confidence selections from the current practice UI');
  assert.match(moduleJs, /new URL\(requestedReturn,\s*window\.location\.href\)/, 'return navigation should be resolved through URL parsing');
  assert.match(moduleJs, /parsed\.origin !== window\.location\.origin/, 'return navigation should be constrained to the current origin');
  assert.doesNotMatch(moduleJs, /!\/\^\(\?:https\?:\)\?\\\/\\\//, 'the old scheme blacklist should not be used as the return-link safety boundary');
});

test('Mock landing keeps the same primary learner navigation as the rest of Studo', () => {
  const html = fs.readFileSync(path.join(root, 'quiz.html'), 'utf8');
  for (const [href, label] of [['index.html','Home'],['practice.html','Practice'],['train.html','Train'],['quiz.html','Mock'],['progress.html','Progress'],['resources.html','Resources']]) {
    assert.match(html, new RegExp(`<a href="${href.replace('.', '\\.') }"[^>]*>${label}<\\/a>`), `quiz.html should include ${label}`);
  }
});


test('Alpha polish gives search placement and Passage Practice spacing a clearly visible desktop change', () => {
  const css = fs.readFileSync(path.join(root, 'css/site.css'), 'utf8');
  assert.match(css, /\.passage-page-wrap\s*\{[^}]*max-width:\s*1320px/s);
  assert.match(css, /\.passage-library-hero\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(360px,\s*520px\)[^}]*gap:\s*80px/s);
  assert.match(css, /\.resource-library-hero\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(360px,\s*520px\)[^}]*gap:\s*80px/s);
  assert.match(css, /\.passage-hero-search\s*\{[^}]*max-width:\s*520px[^}]*justify-self:\s*end/s);
  assert.match(css, /\.resource-hero-search\s*\{[^}]*max-width:\s*520px[^}]*justify-self:\s*end/s);
  assert.match(css, /\.passage-practice-groups\s*\{[^}]*grid-template-columns:\s*repeat\(4,[^}]*gap:\s*32px\s+64px/s);
});


test('Resources separates major sections without drawing dividers between every topic row', () => {
  const css = fs.readFileSync(path.join(root, 'css/site.css'), 'utf8');
  assert.match(css, /\.resource-topic-row\s*\{[^}]*border-bottom:\s*0/s, 'individual resource topic rows should not have divider lines');
  assert.match(css, /\.resource-topic-header\s*\{[^}]*border-bottom:\s*1px solid var\(--color-line\)/s, 'the topic header may keep one structural divider');
  assert.match(css, /\.resource-track-heading\s*\{[^}]*border-bottom:\s*2px solid var\(--color-ink\)/s, 'major resource track headings should keep strong separation');
});


test('learner pages expose the same release metadata as release.json', () => {
  const release = JSON.parse(fs.readFileSync(path.join(root, 'release.json'), 'utf8')).release;
  const pages = ['index.html','practice.html','passages.html','resources.html','progress.html','curriculum.html','domain.html','category.html','skill.html','module.html','quiz.html','test.html','train.html','extended-response.html','about.html','methodology.html','privacy.html','404.html','offline.html'];
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, new RegExp(`<meta name="studo-release" content="${release.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), `${file} should expose current release metadata`);
  }
});

test('release metadata and service-worker cache stay synchronized', () => {
  const release = JSON.parse(fs.readFileSync(path.join(root, 'release.json'), 'utf8'));
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const escaped = release.release.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(sw, new RegExp(escaped));
  assert.match(sw, new RegExp(`CACHE_NAME="studo-shell-${escaped}"`));
});


test('Chee Skool branding is used across learner pages and shipped as a real logo asset', () => {
  const learnerPages = ['index.html','practice.html','passages.html','resources.html','progress.html','curriculum.html','domain.html','category.html','skill.html','about.html','methodology.html','privacy.html','404.html','quiz.html'];
  for (const file of learnerPages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /<title>Chee Skool — /, `${file} should use the Chee Skool page title`);
    assert.match(html, /class="brand-logo"[^>]*src="assets\/chee-skool-logo\.png"[^>]*alt="Chee Skool"/, `${file} should render the Chee Skool logo in the header`);
  }
  assert.ok(fs.existsSync(path.join(root, 'assets/chee-skool-logo.png')), 'Chee Skool logo asset should ship with the site');
  const logo = fs.readFileSync(path.join(root, 'assets/chee-skool-logo.png'));
  assert.equal(logo.readUInt32BE(16), 1200, 'navbar logo should be the optimized text-only 1200px asset');
  assert.equal(logo.readUInt32BE(20), 400, 'navbar logo should preserve the text-only 3:1 composition with floating pixels');
  const css = fs.readFileSync(path.join(root, 'css/site.css'), 'utf8');
  assert.match(css, /\.brand-logo\s*\{[^}]*width:\s*160px[^}]*height:\s*auto/s, 'text-only wordmark should use width-based sizing so it remains readable without making the header too tall');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.equal(manifest.name, 'Chee Skool');
  assert.equal(manifest.short_name, 'Chee Skool');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /assets\/chee-skool-logo\.png/, 'service-worker app shell should include the brand asset');
});

test('Progress shortcuts only target sections that exist and learner-facing data labels use Chee Skool branding', () => {
  const js = fs.readFileSync(path.join(root, 'js/progress.js'), 'utf8');
  assert.match(js, /sidebarHtml\(\{\s*showCore:\s*false\s*\}\)/, 'empty progress state should not render dead section shortcuts');
  assert.match(js, /sidebarHtml\(\{\s*showMock:\s*mockHistory\.length\s*>\s*0,\s*showEr:\s*erHistory\.length\s*>\s*0\s*\}\)/s, 'history shortcuts should be conditional on their sections existing');
  assert.match(js, /Skill signals reflect your Chee Skool practice history, not a GED score\./, 'Progress should explain that skill signals are practice indicators, not GED scores');
  assert.match(js, /chee-skool-backup-\$\{new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\}\.json/, 'downloaded backup filename should use learner-facing Chee Skool branding');
});
