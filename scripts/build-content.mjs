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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
  if (q.options) out.options = q.options.map((o) => ({
    id: o.id,
    text: o.text,
    ...(o.distractorType ? { distractorType: o.distractorType } : {}),
    ...(o.whyWrong ? { whyWrong: o.whyWrong } : {}),
  }));
  if (q.correct !== undefined) out.correct = q.correct;
  const evidence = resolvedEvidence(passage, q.explanation?.evidenceRef);
  if (evidence) out.evidenceExcerpt = evidence;
  return out;
}

async function main() {
  const validation = await validateContent({ quiet: true });
  if (!validation.ok) {
    console.error(`Build blocked: ${validation.errors.length} validation error(s). Run npm run content:validate.`);
    process.exit(1);
  }

  let existingIndex = [];
  let existingCurriculum = null;
  try { existingIndex = JSON.parse(await fs.readFile(path.join(OUT, 'index.json'), 'utf8')); } catch (_) {}
  try { existingCurriculum = JSON.parse(await fs.readFile(path.join(OUT, 'curriculum.json'), 'utf8')); } catch (_) {}

  // The project is still migrating older generated modules into content-src.
  // Preserve the checked-in learner build as a compatibility baseline instead
  // of deleting content that has not been migrated yet.
  await fs.mkdir(MODULE_OUT, { recursive: true });

  const legacyIndex = JSON.parse(await fs.readFile(path.join(SRC, 'config', 'legacy-index.json'), 'utf8'));
  const curriculumConfig = JSON.parse(await fs.readFile(path.join(SRC, 'config', 'rla.curriculum.json'), 'utf8'));
  let resourceRegistry = { resources: [] };
  try {
    resourceRegistry = JSON.parse(await fs.readFile(path.join(SRC, 'resources', 'rla.resources.json'), 'utf8'));
  } catch (_) {}
  const publishedResources = (resourceRegistry.resources || []).filter((r) => r.status === 'published');
  const generatedByLegacyFile = new Map();
  const buildEntries = [];

  for (const { set } of validation.publishedSets) {
    const passageId = set.passageRefs?.[0] || null;
    const passage = passageId ? validation.passages.get(passageId) : null;
    const runtimeFile = set.runtime?.file || `${set.id}.json`;
    const runtimeId = set.runtime?.id || set.id;
    const outputName = runtimeFile.replace(/^.*\//, '');

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

    await fs.writeFile(path.join(MODULE_OUT, outputName), JSON.stringify(runtime, null, 2) + '\n', 'utf8');
    const entry = {
      file: `generated/modules/${outputName}`,
      title: runtime.title,
      description: runtime.description,
      ...(set.curriculum ? { curriculum: set.curriculum } : {}),
    };
    generatedByLegacyFile.set(runtimeFile, entry);
    generatedByLegacyFile.set(`generated/modules/${outputName}`, entry);
    buildEntries.push(entry);
  }

  const mergedIndex = [];
  const inserted = new Set();
  const indexBaseline = existingIndex.length ? existingIndex : legacyIndex;
  for (const entry of indexBaseline) {
    const replacement = generatedByLegacyFile.get(entry.file);
    if (replacement) {
      mergedIndex.push(replacement);
      inserted.add(replacement.file);
    } else {
      mergedIndex.push(entry);
    }
  }
  for (const entry of buildEntries) if (!inserted.has(entry.file)) mergedIndex.push(entry);

  await fs.writeFile(path.join(OUT, 'index.json'), JSON.stringify(mergedIndex, null, 2) + '\n', 'utf8');
  // Build the learner-facing curriculum map from the stable skill registry plus
  // published content. Authoring taxonomy stays rich; learner navigation stays calm.
  const publishedSetRecords = validation.publishedSets.map(({ set }) => {
    const runtimeFile = set.runtime?.file || `${set.id}.json`;
    const outputName = runtimeFile.replace(/^.*\//, '');
    return {
      id: set.id,
      title: set.title || set.topic,
      description: set.description || '',
      file: `generated/modules/${outputName}`,
      difficulty: set.difficulty || 'medium',
      category: set.category || 'reading',
      questionCount: (set.questions || []).length,
      curriculum: set.curriculum || null,
      questions: set.questions || [],
    };
  });

  let curriculum;
  if (existingCurriculum?.tracks?.length) {
    curriculum = clone(existingCurriculum);
    curriculum.schemaVersion = curriculum.schemaVersion || 1;
    curriculum.subject = curriculumConfig.subject || curriculum.subject || 'rla';
    curriculum.builtAt = new Date().toISOString();

    for (const track of curriculum.tracks || []) {
      for (const domain of track.domains || []) {
        const domainId = domain.id || domain.label?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const registryDomainResources = publishedResources.filter((r) => r.scope === 'domain' && r.domainId === domainId);
        const domainResourceMap = new Map((domain.resources || []).map((r) => [r.id, r]));
        for (const resource of registryDomainResources) domainResourceMap.set(resource.id, resource);
        domain.resources = [...domainResourceMap.values()];
        domain.topicResources = domain.resources;
        domain.topicResourceCount = domain.resources.length;

        for (const skill of domain.skills || []) {
          const relatedSourceRecords = publishedSetRecords.filter((record) => {
            const c = record.curriculum || {};
            const setMatch = c.primarySkillId === skill.id || (c.secondarySkillIds || []).includes(skill.id);
            const questionMatch = (record.questions || []).some((q) => q.primarySkillId === skill.id || (q.secondarySkillIds || []).includes(skill.id));
            return setMatch || questionMatch;
          });
          const existingSets = new Map((skill.sets || []).map((record) => [record.id || record.file, record]));
          const existingChecks = new Map((skill.checks || []).map((record) => [record.id || record.file, record]));
          for (const record of relatedSourceRecords) {
            const { questions, ...publicRecord } = record;
            publicRecord.measuredSkillIds = [...new Set((questions || []).flatMap((q) => [q.primarySkillId, ...(q.secondarySkillIds || [])]).filter(Boolean))];
            const key = publicRecord.id || publicRecord.file;
            const isNew = !existingSets.has(key);
            existingSets.set(key, publicRecord);
            existingChecks.set(key, publicRecord);
            if (isNew) {
              skill.questionCount = (skill.questionCount || 0) + (questions || []).filter((q) => q.primarySkillId === skill.id || (q.secondarySkillIds || []).includes(skill.id)).length;
            }
          }
          skill.sets = [...existingSets.values()];
          skill.checks = [...existingChecks.values()];

          const registrySkillResources = publishedResources.filter((resource) => {
            if (resource.scope === 'domain') return false;
            return (resource.skillIds || []).includes(skill.id) || resource.primarySkillId === skill.id;
          });
          const resourceMap = new Map((skill.resources || []).map((r) => [r.id, r]));
          for (const resource of registrySkillResources) resourceMap.set(resource.id, resource);
          skill.resources = [...resourceMap.values()];
          skill.studyResources = skill.resources;
          skill.resourceCount = skill.resources.length;
          skill.studyFileCount = skill.resources.length;
          skill.setCount = skill.sets.length;
          skill.checkCount = skill.checks.length;
          skill.available = skill.sets.length > 0 || skill.resources.length > 0;
        }

        domain.availableSkillCount = (domain.skills || []).filter((skill) => skill.available).length;
        domain.availableSetCount = new Set((domain.skills || []).flatMap((skill) => (skill.sets || []).map((set) => set.file))).size;
        domain.studyFileCount = (domain.resources || []).length + (domain.skills || []).reduce((sum, skill) => sum + (skill.studyFileCount || 0), 0);
        domain.checkCount = new Set((domain.skills || []).flatMap((skill) => (skill.checks || []).map((set) => set.file))).size;
      }
    }

    const passageMap = new Map((curriculum.passagePractice || []).map((record) => [record.id || record.file, record]));
    for (const record of publishedSetRecords) {
      const kind = record.curriculum?.contentKind;
      if (!['passage_practice', 'quiz'].includes(kind)) continue;
      const set = validation.publishedSets.find(({ set }) => set.id === record.id)?.set;
      const passageId = set?.passageRefs?.[0] || null;
      const passage = passageId ? validation.passages.get(passageId) : null;
      if (!passage) continue;
      const measuredSkillIds = [...new Set((record.questions || []).flatMap((q) => [q.primarySkillId, ...(q.secondarySkillIds || [])]).filter(Boolean))];
      const item = {
        id: record.id,
        title: passage.title || record.title,
        description: record.description || '',
        file: record.file,
        difficulty: record.difficulty,
        category: record.category,
        questionCount: record.questionCount,
        curriculum: record.curriculum,
        measuredSkillIds,
        passageMeta: passageMeta(passage),
      };
      passageMap.set(item.id || item.file, item);
    }
    curriculum.passagePractice = [...passageMap.values()];
  } else {
    curriculum = {
      schemaVersion: 1,
      subject: curriculumConfig.subject || 'rla',
      builtAt: new Date().toISOString(),
      tracks: (curriculumConfig.tracks || []).map((track) => ({
        id: track.id,
        label: track.label,
        shortLabel: track.shortLabel || track.label,
        summary: track.summary || '',
        accent: track.accent || 'blue',
        domains: (track.domains || []).map((domainConfig) => {
          const domainId = domainConfig.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const domainSkills = [...validation.skills.values()].filter((s) => s.domain === domainConfig.name);
          const domainResources = publishedResources.filter((resource) => resource.scope === 'domain' && resource.domainId === domainId);
          const skills = domainSkills.map((skill) => {
            const related = publishedSetRecords.filter((record) => {
              const c = record.curriculum || {};
              const setMatch = c.primarySkillId === skill.id || (c.secondarySkillIds || []).includes(skill.id);
              const questionMatch = (record.questions || []).some((q) => q.primarySkillId === skill.id || (q.secondarySkillIds || []).includes(skill.id));
              return setMatch || questionMatch;
            });
            const questionCount = related.reduce((sum, record) => sum + (record.questions || []).filter((q) => q.primarySkillId === skill.id || (q.secondarySkillIds || []).includes(skill.id)).length, 0);
            const resources = publishedResources.filter((resource) => resource.scope !== 'domain' && ((resource.skillIds || []).includes(skill.id) || resource.primarySkillId === skill.id));
            return {
              id: skill.id,
              runtimeId: skill.runtimeId || skill.id,
              label: skill.label,
              priority: skill.priority || null,
              practiceMode: skill.practiceMode || null,
              available: related.length > 0 || resources.length > 0,
              setCount: related.length,
              questionCount,
              resourceCount: resources.length,
              studyFileCount: resources.length,
              checkCount: related.length,
              sets: related.map(({ questions, ...record }) => record),
              checks: related.map(({ questions, ...record }) => record),
              resources,
              studyResources: resources,
            };
          });
          return {
            id: domainId,
            label: domainConfig.name,
            summary: domainConfig.summary || '',
            groups: domainConfig.groups || [],
            availableSkillCount: skills.filter((s) => s.available).length,
            availableSetCount: new Set(skills.flatMap((s) => s.sets.map((set) => set.file))).size,
            topicResourceCount: domainResources.length,
            topicResources: domainResources,
            resources: domainResources,
            studyFileCount: domainResources.length + skills.reduce((sum, s) => sum + (s.studyFileCount || 0), 0),
            checkCount: new Set(skills.flatMap((s) => (s.checks || []).map((set) => set.file))).size,
            skills,
          };
        }),
      })),
      passagePractice: [],
    };
  }

  curriculum.tracks.forEach((track) => {
    track.availableSkillCount = track.domains.reduce((sum, d) => sum + d.availableSkillCount, 0);
    track.totalSkillCount = track.domains.reduce((sum, d) => sum + d.skills.length, 0);
    track.availableSetCount = new Set(track.domains.flatMap((d) => d.skills.flatMap((s) => (s.sets || []).map((set) => set.file)))).size;
    track.questionCount = track.domains.reduce((sum, d) => sum + d.skills.reduce((inner, s) => inner + (s.questionCount || 0), 0), 0);
    track.resourceCount = track.domains.reduce((sum, d) => sum + (d.resources || []).length + d.skills.reduce((inner, s) => inner + (s.resources || []).length, 0), 0);
    track.studyFileCount = track.domains.reduce((sum, d) => sum + (d.studyFileCount || 0), 0);
    track.checkCount = new Set(track.domains.flatMap((d) => d.skills.flatMap((s) => (s.checks || []).map((set) => set.file)))).size;
  });

  await fs.writeFile(path.join(OUT, 'curriculum.json'), JSON.stringify(curriculum, null, 2) + '\n', 'utf8');

  await fs.writeFile(path.join(OUT, 'build-report.json'), JSON.stringify({
    schemaVersion: 1,
    builtAt: new Date().toISOString(),
    publishedSourceSets: validation.publishedSets.map(({ set }) => set.id),
    generatedModules: buildEntries.map((e) => e.file),
    curriculumFile: 'data/generated/curriculum.json',
    warnings: validation.warnings,
  }, null, 2) + '\n', 'utf8');

  console.log(`Built ${buildEntries.length} generated module(s).`);
  console.log(`Generated index contains ${mergedIndex.length} module entries.`);
  if (validation.warnings.length) console.log(`Build completed with ${validation.warnings.length} quality warning(s).`);
}

await main();
