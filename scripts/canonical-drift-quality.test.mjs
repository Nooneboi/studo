import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "content-src");
const GENERATED = path.join(ROOT, "data", "generated", "modules");

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function listJson(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, stable(v)])
    );
  }
  return value;
}

function normalizedSourceQuestion(q) {
  return stable({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    correct: q.correct,
    points: q.points || 1,
    familyId: q.familyId,
    primarySkillId: q.primarySkillId,
    secondarySkillIds: q.secondarySkillIds || [],
    dok: q.dok,
    difficulty: q.difficulty,
    difficultyProfile: q.difficultyProfile || null,
    reportingCategory: q.reportingCategory ?? null,
    estimatedSeconds: q.estimatedSeconds ?? null,
    learningStage: q.learningStage ?? null,
    hint: q.hint ?? null,
    interaction: q.interaction ?? null,
    options: (q.options || []).map((o) => ({
      id: o.id,
      text: o.text,
      distractorType: o.distractorType ?? null,
      whyWrong: o.whyWrong ?? null,
    })),
    explanation: q.explanation?.whyCorrect || "",
    rule: q.explanation?.quickTip || "",
  });
}

function normalizedGeneratedQuestion(q) {
  return stable({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    correct: q.correct,
    points: q.points || 1,
    familyId: q.familyId,
    primarySkillId: q.metadata?.skillId,
    secondarySkillIds: q.metadata?.secondarySkillIds || [],
    dok: q.metadata?.dok,
    difficulty: q.metadata?.difficulty,
    difficultyProfile: q.metadata?.difficultyProfile || null,
    reportingCategory: q.metadata?.reportingCategory ?? null,
    estimatedSeconds: q.time ?? null,
    learningStage: q.learningStage ?? null,
    hint: q.hint ?? null,
    interaction: q.interaction ?? null,
    options: (q.options || []).map((o) => ({
      id: o.id,
      text: o.text,
      distractorType: o.distractorType ?? null,
      whyWrong: o.whyWrong ?? null,
    })),
    explanation: typeof q.explanation === "string" ? q.explanation : "",
    rule: q.rule || "",
  });
}

test("legacy canonical modules match generated learner modules", async () => {
  const legacyIndex = await readJson(path.join(SRC, "config", "legacy-index.json"));

  const drifts = [];
  for (const entry of legacyIndex) {
    const sourcePath = path.join(SRC, entry.sourceFile);
    const outputName = path.basename(entry.file || entry.sourceFile);
    const generatedPath = path.join(GENERATED, outputName);

    const source = await readJson(sourcePath);
    const generated = await readJson(generatedPath);

    if (JSON.stringify(stable(source)) !== JSON.stringify(stable(generated))) {
      drifts.push({
        source: path.relative(ROOT, sourcePath),
        generated: path.relative(ROOT, generatedPath),
      });
    }
  }

  assert.deepEqual(
    drifts,
    [],
    `Generated legacy modules have drifted from canonical source:\n${drifts
      .map((d) => `- ${d.source} -> ${d.generated}`)
      .join("\n")}`
  );
});

test("published schema-v2 sets match generated learner semantics", async () => {
  const passageFiles = await listJson(path.join(SRC, "passages"));
  const passageMap = new Map();

  for (const file of passageFiles) {
    const passage = await readJson(file);
    passageMap.set(passage.id, passage);
  }

  const setFiles = await listJson(path.join(SRC, "sets"));
  const drifts = [];

  for (const file of setFiles) {
    const set = await readJson(file);
    if ((set.status || "published") !== "published") continue;

    const runtimeFile = path.basename(set.runtime?.file || `${set.id}.json`);
    const generatedPath = path.join(GENERATED, runtimeFile);

    try {
      await fs.access(generatedPath);
    } catch {
      drifts.push({
        source: path.relative(ROOT, file),
        generated: path.relative(ROOT, generatedPath),
        issue: "generated file missing",
      });
      continue;
    }

    const generated = await readJson(generatedPath);
    const passage = set.passageRefs?.[0] ? passageMap.get(set.passageRefs[0]) : null;

    if ((generated.id || null) !== (set.runtime?.id || set.id)) {
      drifts.push({
        source: path.relative(ROOT, file),
        generated: path.relative(ROOT, generatedPath),
        issue: `runtime id mismatch: ${generated.id} != ${set.runtime?.id || set.id}`,
      });
    }

    if ((passage?.text || null) !== (generated.passage || null)) {
      drifts.push({
        source: path.relative(ROOT, file),
        generated: path.relative(ROOT, generatedPath),
        issue: "passage text mismatch",
      });
    }

    const sourceQuestions = new Map((set.questions || []).map((q) => [q.id, q]));
    const generatedQuestions = new Map((generated.questions || []).map((q) => [q.id, q]));
    const questionIds = new Set([...sourceQuestions.keys(), ...generatedQuestions.keys()]);

    for (const id of questionIds) {
      const sourceQ = sourceQuestions.get(id);
      const generatedQ = generatedQuestions.get(id);

      if (!sourceQ || !generatedQ) {
        drifts.push({
          source: path.relative(ROOT, file),
          generated: path.relative(ROOT, generatedPath),
          issue: `question ${id} exists on only one side`,
        });
        continue;
      }

      const a = normalizedSourceQuestion(sourceQ);
      const b = normalizedGeneratedQuestion(generatedQ);
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        const changed = Object.keys(a).filter(
          (key) => JSON.stringify(a[key]) !== JSON.stringify(b[key])
        );
        drifts.push({
          source: path.relative(ROOT, file),
          generated: path.relative(ROOT, generatedPath),
          issue: `question ${id} differs in: ${changed.join(", ")}`,
        });
      }
    }
  }

  assert.deepEqual(
    drifts,
    [],
    `Generated schema-v2 modules have drifted from canonical source:\n${drifts
      .map((d) => `- ${d.source} -> ${d.generated}: ${d.issue}`)
      .join("\n")}`
  );
});

test("no backup artifacts remain in the learner repository", async () => {
  const forbidden = /\.(bak|bak4e|old)$/i;
  const found = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (forbidden.test(entry.name) || entry.name.endsWith("~")) {
        found.push(path.relative(ROOT, full));
      }
    }
  }

  await walk(ROOT);
  assert.deepEqual(
    found.sort(),
    [],
    `Backup artifacts should not ship in the canonical repository:\n${found
      .sort()
      .map((p) => `- ${p}`)
      .join("\n")}`
  );
});

test("published PDF registry matches physical learner PDFs exactly", async () => {
  const registry = await readJson(path.join(SRC, "resources", "rla.resources.json"));
  const registered = new Set(
    (registry.resources || [])
      .filter((r) => r.status === "published" && r.href?.endsWith(".pdf"))
      .map((r) => r.href)
  );

  const resourceDir = path.join(ROOT, "assets", "resources");
  const physical = new Set(
    (await fs.readdir(resourceDir))
      .filter((name) => name.endsWith(".pdf"))
      .map((name) => `assets/resources/${name}`)
  );

  const orphan = [...physical].filter((p) => !registered.has(p)).sort();
  const missing = [...registered].filter((p) => !physical.has(p)).sort();

  assert.deepEqual(
    { orphan, missing },
    { orphan: [], missing: [] },
    `PDF registry mismatch.\nOrphan PDFs:\n${orphan.map((p) => `- ${p}`).join("\n") || "(none)"}\nMissing PDFs:\n${missing.map((p) => `- ${p}`).join("\n") || "(none)"}`
  );
});
