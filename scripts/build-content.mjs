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
  return passage?.evidenceAnchors?.[ref] || null;
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

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(MODULE_OUT, { recursive: true });

  const legacyIndex = JSON.parse(await fs.readFile(path.join(SRC, 'config', 'legacy-index.json'), 'utf8'));
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
        compiledAt: new Date().toISOString(),
      },
    };

    await fs.writeFile(path.join(MODULE_OUT, outputName), JSON.stringify(runtime, null, 2) + '\n', 'utf8');
    const entry = { file: `generated/modules/${outputName}`, title: runtime.title, description: runtime.description };
    generatedByLegacyFile.set(runtimeFile, entry);
    buildEntries.push(entry);
  }

  const mergedIndex = [];
  const inserted = new Set();
  for (const entry of legacyIndex) {
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
  await fs.writeFile(path.join(OUT, 'build-report.json'), JSON.stringify({
    schemaVersion: 1,
    builtAt: new Date().toISOString(),
    publishedSourceSets: validation.publishedSets.map(({ set }) => set.id),
    generatedModules: buildEntries.map((e) => e.file),
    warnings: validation.warnings,
  }, null, 2) + '\n', 'utf8');

  console.log(`Built ${buildEntries.length} generated module(s).`);
  console.log(`Generated index contains ${mergedIndex.length} module entries.`);
  if (validation.warnings.length) console.log(`Build completed with ${validation.warnings.length} quality warning(s).`);
}

await main();
