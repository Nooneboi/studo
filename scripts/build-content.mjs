import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from './validate-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'content-src');
const OUT = path.join(ROOT, 'data', 'generated');
const MODULE_OUT = path.join(OUT, 'modules');

function runtimeSkill(skill) {
  return { id: skill.runtimeId || skill.id, label: skill.label };
}

function resolvedEvidence(passage, ref) {
  if (!ref) return null;
  if (passage?.evidenceAnchors?.[ref]) return passage.evidenceAnchors[ref];
  if (passage?.text?.includes(ref)) return ref;
  return typeof ref === 'string' && /\s/.test(ref) ? ref : null;
}

function passageMeta(passage) {
  if (!passage) return null;
  return {
    id: passage.id || null,
    title: passage.title || null,
    textType: passage.textType || null,
    context: passage.context || null,
    sourceType: passage.source?.type || null,
    attribution: passage.source?.attribution || null,
    author: passage.source?.author || passage.author || null,
    workTitle: passage.source?.workTitle || null,
    publisher: passage.source?.publisher || null,
    year: passage.source?.year || null,
    url: passage.source?.url || null,
  };
}

function slug(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function questionFamilyRuntime(config) {
  const canonicalIds = (config.skills || [])
    .flatMap((skill) => (skill.families || []).map((family) => family.familyId))
    .filter(Boolean)
    .sort();
  const aliases = Object.fromEntries(Object.entries(config.aliases || {}).sort(([a], [b]) => a.localeCompare(b)));
  return `window.CheeQuestionFamilies = Object.freeze({\n  canonicalIds: Object.freeze(${JSON.stringify(canonicalIds)}),\n  aliases: Object.freeze(${JSON.stringify(aliases)}),\n  canonicalize(id) { const key = String(id || ''); return this.aliases[key] || key; }\n});\n`;
}

function compileQuestion(q, skill, passage) {
  const out = {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    points: q.points || 1,
    explanation: q.explanation?.whyCorrect || '',
    skill: runtimeSkill(skill),
    rule: q.explanation?.quickTip || '',
    familyId: q.familyId,
    metadata: {
      skillId: q.primarySkillId,
      secondarySkillIds: q.secondarySkillIds || [],
      dok: q.dok,
      difficulty: q.difficulty,
      difficultyProfile: q.difficultyProfile || null,
      sourceSchemaVersion: 2,
    },
  };
  if (q.estimatedSeconds != null) out.time = q.estimatedSeconds;
  if (q.learningStage) out.learningStage = q.learningStage;
  if (q.hint) out.hint = q.hint;
  if (q.options) out.options = q.options.map((o) => ({
    id: o.id,
    text: o.text,
    ...(o.distractorType ? { distractorType: o.distractorType } : {}),
    ...(o.whyWrong ? { whyWrong: o.whyWrong } : {}),
  }));
  if (q.correct !== undefined) out.correct = q.correct;
  if (q.interaction) out.interaction = JSON.parse(JSON.stringify(q.interaction));
  const evidence = resolvedEvidence(passage, q.explanation?.evidenceRef);
  if (evidence) out.evidenceExcerpt = evidence;
  return out;
}

function hasDeliveryRole(record, role) {
  return Array.isArray(record?.curriculum?.deliveryRoles) && record.curriculum.deliveryRoles.includes(role);
}

function measuredSkillIds(record) {
  const ids = new Set();
  const curriculum = record.curriculum || {};
  if (curriculum.primarySkillId) ids.add(curriculum.primarySkillId);
  for (const id of curriculum.secondarySkillIds || []) ids.add(id);
  for (const q of record.questions || []) {
    const metadata = q.metadata || {};
    if (metadata.skillId) ids.add(metadata.skillId);
    for (const id of metadata.secondarySkillIds || []) ids.add(id);
  }
  return [...ids];
}

function publicRecordFromModule(module, entry) {
  const curriculum = entry.curriculum || module.contentMeta?.curriculum || null;
  const sourceSetId = module.contentMeta?.sourceSetId || module.id;
  return {
    id: sourceSetId,
    title: entry.title || module.title,
    description: entry.description || module.description || '',
    file: entry.file,
    difficulty: module.difficulty || 'medium',
    category: module.category || 'reading',
    questionCount: (module.questions || []).length,
    curriculum,
    questions: module.questions || [],
    passageMeta: module.contentMeta?.passage || null,
  };
}

function trackMap(curriculumConfig, skills) {
  const domainToTrack = new Map();
  const skillToTrack = new Map();
  for (const track of curriculumConfig.tracks || []) {
    for (const domain of track.domains || []) {
      domainToTrack.set(domain.name, track.id);
      for (const group of domain.groups || []) {
        for (const skillId of group.skills || []) skillToTrack.set(skillId, track.id);
      }
    }
  }
  for (const skill of skills.values()) {
    if (!skillToTrack.has(skill.id) && domainToTrack.has(skill.domain)) {
      skillToTrack.set(skill.id, domainToTrack.get(skill.domain));
    }
  }
  return { domainToTrack, skillToTrack };
}

function activeLearningFirst(a, b) {
  const aActive = (a?.curriculum?.practiceTags || []).includes('active-learning') ? 0 : 1;
  const bActive = (b?.curriculum?.practiceTags || []).includes('active-learning') ? 0 : 1;
  return aActive - bActive;
}

function buildCurriculum({ curriculumConfig, skills, publishedResources, records }) {
  const passagePractice = [];
  const argumentPractice = [];
  const languagePractice = [];
  const extendedResponsePractice = [];
  const tracks = (curriculumConfig.tracks || []).filter((track) => (track.publicationState || 'published') === 'published').map((track) => ({
    id: track.id,
    label: track.label,
    shortLabel: track.shortLabel || track.label,
    summary: track.summary || '',
    accent: track.accent || 'blue',
    ...(track.publicationState ? { publicationState: track.publicationState } : {}),
    domains: (track.domains || []).map((domainConfig) => {
      const domainId = slug(domainConfig.name);
      const domainSkills = [...skills.values()].filter((skill) => skill.domain === domainConfig.name);
      const domainResources = publishedResources.filter((resource) => resource.scope === 'domain' && resource.domainId === domainId);
      const builtSkills = domainSkills.map((skill) => {
        const related = records.filter((record) => {
          const c = record.curriculum || {};
          if (['passage_practice', 'quiz', 'argument_practice', 'editing_practice', 'extended_response_practice'].includes(c.contentKind)) return false;
          const ids = measuredSkillIds(record);
          return c.primarySkillId === skill.id || (c.secondarySkillIds || []).includes(skill.id) || ids.includes(skill.id);
        });
        const practiceRecords = related.filter((record) => hasDeliveryRole(record, 'practice')).sort(activeLearningFirst);
        const checkRecords = related.filter((record) => hasDeliveryRole(record, 'skill_check'));
        const resources = publishedResources.filter((resource) => resource.scope !== 'domain' && ((resource.skillIds || []).includes(skill.id) || resource.primarySkillId === skill.id));
        const questionCount = practiceRecords.reduce((sum, record) => sum + (record.questions || []).filter((q) => {
          const metadata = q.metadata || {};
          return metadata.skillId === skill.id || (metadata.secondarySkillIds || []).includes(skill.id);
        }).length, 0);
        const cleanRecords = practiceRecords.map((record) => {
          const { questions, ...publicRecord } = record;
          return { ...publicRecord, measuredSkillIds: measuredSkillIds(record) };
        });
        const cleanChecks = checkRecords.map((record) => {
          const { questions, ...publicRecord } = record;
          return { ...publicRecord, measuredSkillIds: measuredSkillIds(record) };
        });
        return {
          id: skill.id,
          runtimeId: skill.runtimeId || skill.id,
          label: skill.label,
          priority: skill.priority || null,
          practiceMode: skill.practiceMode || null,
          available: cleanRecords.length > 0 || cleanChecks.length > 0 || resources.length > 0,
          setCount: cleanRecords.length,
          questionCount,
          resourceCount: resources.length,
          studyFileCount: resources.length,
          checkCount: cleanChecks.length,
          sets: cleanRecords,
          checks: cleanChecks,
          resources,
          studyResources: resources,
        };
      });
      const builtUnits = (domainConfig.units || []).map((unitConfig) => {
        const unitSkillIds = new Set(unitConfig.skillIds || []);
        const related = records.filter((record) => {
          const c = record.curriculum || {};
          if (['passage_practice', 'quiz', 'argument_practice', 'editing_practice', 'extended_response_practice'].includes(c.contentKind)) return false;
          if (c.unitId) return c.unitId === unitConfig.id;
          return measuredSkillIds(record).some((id) => unitSkillIds.has(id));
        });
        const practiceRecords = related.filter((record) => hasDeliveryRole(record, 'practice')).sort(activeLearningFirst);
        const checkRecords = related.filter((record) => hasDeliveryRole(record, 'skill_check'));
        const resources = publishedResources.filter((resource) => {
          if (resource.scope === 'domain') return false;
          if (resource.unitId) return resource.unitId === unitConfig.id;
          const ids = new Set([...(resource.skillIds || []), ...(resource.primarySkillId ? [resource.primarySkillId] : [])]);
          return [...unitSkillIds].some((id) => ids.has(id));
        });
        const cleanRecords = practiceRecords.map((record) => {
          const { questions, ...publicRecord } = record;
          return { ...publicRecord, measuredSkillIds: measuredSkillIds(record) };
        });
        const cleanChecks = checkRecords.map((record) => {
          const { questions, ...publicRecord } = record;
          return { ...publicRecord, measuredSkillIds: measuredSkillIds(record) };
        });
        const questionCount = practiceRecords.reduce((sum, record) => sum + (record.questions || []).length, 0);
        return {
          id: unitConfig.id,
          label: unitConfig.label,
          summary: unitConfig.summary || '',
          skillIds: unitConfig.skillIds || [],
          available: cleanRecords.length > 0 || cleanChecks.length > 0 || resources.length > 0,
          setCount: cleanRecords.length,
          questionCount,
          resourceCount: resources.length,
          checkCount: cleanChecks.length,
          sets: cleanRecords,
          checks: cleanChecks,
          resources,
          studyResources: resources,
        };
      });
      return {
        id: domainId,
        label: domainConfig.name,
        summary: domainConfig.summary || '',
        groups: domainConfig.groups || [],
        units: builtUnits,
        availableSkillCount: builtSkills.filter((skill) => skill.available).length,
        availableUnitCount: builtUnits.filter((unit) => unit.available).length,
        availableSetCount: new Set(builtSkills.flatMap((skill) => skill.sets.map((set) => set.file))).size,
        topicResourceCount: domainResources.length,
        topicResources: domainResources,
        resources: domainResources,
        studyFileCount: domainResources.length + builtSkills.reduce((sum, skill) => sum + skill.studyFileCount, 0),
        checkCount: new Set(builtSkills.flatMap((skill) => skill.checks.map((set) => set.file))).size,
        skills: builtSkills,
      };
    }),
  }));

  for (const record of records) {
    if (!hasDeliveryRole(record, 'practice')) continue;
    if (!['passage_practice', 'quiz', 'argument_practice', 'editing_practice', 'extended_response_practice'].includes(record.curriculum?.contentKind)) continue;
    const item = {
      id: record.id,
      title: record.passageMeta?.title || record.title,
      description: record.description || '',
      file: record.file,
      difficulty: record.difficulty,
      category: record.category,
      questionCount: record.questionCount,
      curriculum: record.curriculum,
      measuredSkillIds: measuredSkillIds(record),
      passageMeta: record.passageMeta || null,
    };
    if (record.curriculum?.contentKind === 'argument_practice') argumentPractice.push(item);
    else if (record.curriculum?.contentKind === 'editing_practice') languagePractice.push(item);
    else if (record.curriculum?.contentKind === 'extended_response_practice') extendedResponsePractice.push(item);
    else passagePractice.push(item);
  }

  for (const track of tracks) {
    track.availableSkillCount = track.domains.reduce((sum, domain) => sum + domain.availableSkillCount, 0);
    track.totalSkillCount = track.domains.reduce((sum, domain) => sum + domain.skills.length, 0);
    track.availableSetCount = new Set(track.domains.flatMap((domain) => domain.skills.flatMap((skill) => skill.sets.map((set) => set.file)))).size;
    track.questionCount = track.domains.reduce((sum, domain) => sum + domain.skills.reduce((inner, skill) => inner + skill.questionCount, 0), 0);
    track.resourceCount = track.domains.reduce((sum, domain) => sum + domain.resources.length + domain.skills.reduce((inner, skill) => inner + skill.resources.length, 0), 0);
    track.studyFileCount = track.domains.reduce((sum, domain) => sum + domain.studyFileCount, 0);
    track.checkCount = new Set(track.domains.flatMap((domain) => domain.skills.flatMap((skill) => skill.checks.map((set) => set.file)))).size;
  }

  return {
    schemaVersion: 1,
    subject: curriculumConfig.subject || 'rla',
    builtAt: new Date().toISOString(),
    tracks,
    passagePractice,
    argumentPractice,
    languagePractice,
    extendedResponsePractice,
    mixedPractice: passagePractice,
  };
}

async function main() {
  const validation = await validateContent({ quiet: true });
  if (!validation.ok) {
    console.error(`Build blocked: ${validation.errors.length} validation error(s). Run npm run content:validate.`);
    process.exit(1);
  }

  const legacyIndex = JSON.parse(await fs.readFile(path.join(SRC, 'config', 'legacy-index.json'), 'utf8'));
  const curriculumConfig = JSON.parse(await fs.readFile(path.join(SRC, 'config', 'rla.curriculum.json'), 'utf8'));
  const mockBlueprint = JSON.parse(await fs.readFile(path.join(SRC, 'config', 'rla-mock-v1.json'), 'utf8'));
  const questionFamilyRegistry = JSON.parse(await fs.readFile(path.join(SRC, 'config', 'rla.question-families.v1.json'), 'utf8'));
  const resourceRegistry = JSON.parse(await fs.readFile(path.join(SRC, 'resources', 'rla.resources.json'), 'utf8'));
  const publishedResources = (resourceRegistry.resources || []).filter((resource) => resource.status === 'published');

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(MODULE_OUT, { recursive: true });

  const moduleRecords = new Map();
  const indexEntries = new Map();

  for (const entry of legacyIndex) {
    const sourceFile = path.join(SRC, entry.sourceFile || '');
    const module = JSON.parse(await fs.readFile(sourceFile, 'utf8'));
    const outputName = path.basename(entry.file || entry.sourceFile);
    const learnerFile = `generated/modules/${outputName}`;
    const normalizedEntry = {
      file: learnerFile,
      title: entry.title || module.title,
      description: entry.description || module.description || '',
      ...(entry.curriculum || module.contentMeta?.curriculum ? { curriculum: entry.curriculum || module.contentMeta.curriculum } : {}),
    };
    await fs.writeFile(path.join(MODULE_OUT, outputName), JSON.stringify(module, null, 2) + '\n', 'utf8');
    indexEntries.set(learnerFile, normalizedEntry);
    moduleRecords.set(learnerFile, publicRecordFromModule(module, normalizedEntry));
  }

  const compiledSourceFiles = [];
  for (const { set } of validation.publishedSets) {
    const passageId = set.passageRefs?.[0] || null;
    const passage = passageId ? validation.passages.get(passageId) : null;
    const runtimeFile = set.runtime?.file || `${set.id}.json`;
    const runtimeId = set.runtime?.id || set.id;
    const outputName = path.basename(runtimeFile);
    const learnerFile = `generated/modules/${outputName}`;
    const runtime = {
      id: runtimeId,
      title: set.title || set.topic,
      description: set.description || '',
      subject: set.subject,
      category: set.category,
      topic: set.topic,
      difficulty: set.difficulty,
      source: passage?.source?.attribution || 'Studo content',
      ...(passage ? { passage: passage.text } : {}),
      questions: (set.questions || []).map((q) => compileQuestion(q, validation.skills.get(q.primarySkillId), passage)),
      contentMeta: {
        sourceSetId: set.id,
        sourceVersion: set.version,
        curriculum: set.curriculum || null,
        passage: passageMeta(passage),
        compiledAt: new Date().toISOString(),
      },
    };
    const entry = {
      file: learnerFile,
      title: runtime.title,
      description: runtime.description,
      ...(set.curriculum ? { curriculum: set.curriculum } : {}),
    };
    await fs.writeFile(path.join(MODULE_OUT, outputName), JSON.stringify(runtime, null, 2) + '\n', 'utf8');
    indexEntries.set(learnerFile, entry);
    moduleRecords.set(learnerFile, publicRecordFromModule(runtime, entry));
    compiledSourceFiles.push(learnerFile);
  }

  const { skillToTrack } = trackMap(curriculumConfig, validation.skills);
  const trackStates = new Map((curriculumConfig.tracks || []).map((track) => [track.id, track.publicationState || 'published']));
  const learnerPublished = (record) => {
    const primarySkillId = record.curriculum?.primarySkillId;
    if (!primarySkillId) return true;
    const trackId = skillToTrack.get(primarySkillId);
    return !trackId || trackStates.get(trackId) === 'published';
  };
  const records = [...moduleRecords.values()];
  const learnerRecords = records.filter(learnerPublished);
  const learnerFiles = new Set(learnerRecords.map((record) => record.file));
  const mergedIndex = [...indexEntries.values()].filter((entry) => learnerFiles.has(entry.file));
  const curriculum = buildCurriculum({
    curriculumConfig,
    skills: validation.skills,
    publishedResources,
    records: learnerRecords,
  });
  // Full Extended Response prompts use a dedicated workspace rather than normal quiz modules.
  // Keep only learner-safe card metadata in curriculum; authoring keys stay canonical-only.
  curriculum.extendedResponsePractice = (validation.erPrompts || []).map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    topic: prompt.topic,
    prompt: prompt.prompt,
    sourceATitle: prompt.sourceA?.title || 'Source A',
    sourceBTitle: prompt.sourceB?.title || 'Source B',
    difficulty: 'GED practice',
    modeOptions: ['untimed', 'timed'],
  }));

  await fs.writeFile(path.join(OUT, 'index.json'), JSON.stringify(mergedIndex, null, 2) + '\n', 'utf8');
  await fs.writeFile(path.join(OUT, 'curriculum.json'), JSON.stringify(curriculum, null, 2) + '\n', 'utf8');
  const learnerErPrompts = (validation.erPrompts || []).map((prompt) => {
    const { authoringKey, strongerSource, ...publicPrompt } = prompt;
    return publicPrompt;
  });
  await fs.writeFile(path.join(OUT, 'er-prompts.json'), JSON.stringify({ schemaVersion: 1, builtAt: new Date().toISOString(), prompts: learnerErPrompts }, null, 2) + '\n', 'utf8');
  await fs.writeFile(path.join(OUT, 'mock-blueprint.json'), JSON.stringify(mockBlueprint, null, 2) + '\n', 'utf8');
  await fs.writeFile(path.join(OUT, 'question-families.js'), questionFamilyRuntime(questionFamilyRegistry), 'utf8');
  await fs.writeFile(path.join(OUT, 'qa-report.json'), JSON.stringify({
    schemaVersion: 1,
    builtAt: new Date().toISOString(),
    summary: validation.qaSummary || { errors: 0, warnings: 0, byCode: {} },
    issues: validation.issues || [],
  }, null, 2) + '\n', 'utf8');

  await fs.writeFile(path.join(OUT, 'build-report.json'), JSON.stringify({
    schemaVersion: 2,
    builtAt: new Date().toISOString(),
    canonicalLegacyModules: legacyIndex.map((entry) => entry.sourceFile),
    publishedSourceSets: validation.publishedSets.map(({ set }) => set.id),
    generatedSourceModules: compiledSourceFiles,
    generatedIndexCount: mergedIndex.length,
    trackPublicationStates: Object.fromEntries(trackStates),
    curriculumFile: 'data/generated/curriculum.json',
    warnings: validation.warnings,
    qaSummary: validation.qaSummary || null,
  }, null, 2) + '\n', 'utf8');

  console.log(`Built ${legacyIndex.length} canonical legacy module(s) and ${compiledSourceFiles.length} schema-v2 module(s).`);
  console.log(`Generated index contains ${mergedIndex.length} module entries.`);
  if (validation.warnings.length) console.log(`Build completed with ${validation.warnings.length} quality warning(s).`);
}

await main();
