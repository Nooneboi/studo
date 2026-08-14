import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'content-src');

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const VALID_STATUS = new Set(['draft', 'review', 'approved', 'published', 'retired']);
const VALID_RIGHTS = new Set(['original', 'public_domain', 'licensed', 'permission']);
const VALID_CONTENT_KINDS = new Set(['passage_practice','skill_drill','quiz','mixed_review','editing_practice','extended_response']);
const GENERIC_STARTS = [
  'the passage illustrates',
  'this answer is correct because',
  'the author effectively demonstrates',
  'it can be inferred that',
];

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function jsonFiles(dir) {
  try {
    return (await fs.readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => path.join(dir, e.name));
  } catch {
    return [];
  }
}

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean);
}

function add(list, type, code, message, file, location = '') {
  list.push({ type, code, message, file: path.relative(ROOT, file), location });
}

export async function validateContent({ quiet = false } = {}) {
  const issues = [];
  const skillFiles = await jsonFiles(path.join(SRC, 'skills'));
  const passageFiles = await jsonFiles(path.join(SRC, 'passages'));
  const setFiles = await jsonFiles(path.join(SRC, 'sets'));

  const skills = new Map();
  const runtimeSkillIds = new Map();
  for (const file of skillFiles) {
    const registry = await readJson(file);
    for (const skill of registry.skills || []) {
      if (!skill.id) {
        add(issues, 'error', 'SKILL_ID_MISSING', 'Skill is missing an id.', file);
        continue;
      }
      if (skills.has(skill.id)) add(issues, 'error', 'SKILL_ID_DUPLICATE', `Duplicate skill id: ${skill.id}`, file, skill.id);
      skills.set(skill.id, skill);
      if (skill.runtimeId) {
        if (runtimeSkillIds.has(skill.runtimeId)) add(issues, 'error', 'RUNTIME_SKILL_DUPLICATE', `Duplicate runtime skill id: ${skill.runtimeId}`, file, skill.id);
        runtimeSkillIds.set(skill.runtimeId, skill.id);
      }
      if (!skill.label || !skill.domain) add(issues, 'error', 'SKILL_FIELDS_MISSING', `Skill ${skill.id} needs label and domain.`, file, skill.id);
    }
  }

  const passages = new Map();
  for (const file of passageFiles) {
    const p = await readJson(file);
    if (!p.id) add(issues, 'error', 'PASSAGE_ID_MISSING', 'Passage is missing an id.', file);
    else if (passages.has(p.id)) add(issues, 'error', 'PASSAGE_ID_DUPLICATE', `Duplicate passage id: ${p.id}`, file, p.id);
    else passages.set(p.id, p);

    if (!p.text || words(p.text).length < 20) add(issues, 'error', 'PASSAGE_TEXT_MISSING', `Passage ${p.id || '(unknown)'} has too little text.`, file);
    if (!p.source?.type || !p.source?.attribution) add(issues, 'error', 'PASSAGE_SOURCE_MISSING', `Passage ${p.id || '(unknown)'} needs source type and attribution.`, file);
    if (!p.rights?.status || !VALID_RIGHTS.has(p.rights.status)) add(issues, 'error', 'PASSAGE_RIGHTS_INVALID', `Passage ${p.id || '(unknown)'} needs an allowed rights status.`, file);
    if (p.status === 'published' && !p.reviewer) add(issues, 'error', 'PUBLISHED_WITHOUT_REVIEWER', `Published passage ${p.id} needs a reviewer.`, file);
  }

  const setIds = new Set();
  const runtimeFiles = new Set();
  const families = new Map();
  const publishedSets = [];

  for (const file of setFiles) {
    const set = await readJson(file);
    if (!set.id) add(issues, 'error', 'SET_ID_MISSING', 'Question set is missing an id.', file);
    else if (setIds.has(set.id)) add(issues, 'error', 'SET_ID_DUPLICATE', `Duplicate set id: ${set.id}`, file, set.id);
    else setIds.add(set.id);

    if (!VALID_DIFFICULTIES.has(set.difficulty)) add(issues, 'error', 'SET_DIFFICULTY_INVALID', `Set ${set.id} has invalid difficulty.`, file);
    if (!VALID_STATUS.has(set.status)) add(issues, 'error', 'SET_STATUS_INVALID', `Set ${set.id} has invalid status.`, file);
    if (set.status === 'published' && !set.reviewer) add(issues, 'error', 'PUBLISHED_WITHOUT_REVIEWER', `Published set ${set.id} needs a reviewer.`, file);
    if (!Array.isArray(set.questions) || !set.questions.length) add(issues, 'error', 'SET_QUESTIONS_MISSING', `Set ${set.id} has no questions.`, file);

    const curriculum = set.curriculum || {};
    const curriculumSkill = curriculum.primarySkillId ? skills.get(curriculum.primarySkillId) : null;
    if (!curriculum.domain) add(issues, 'error', 'CURRICULUM_DOMAIN_MISSING', `Set ${set.id} needs a curriculum domain.`, file, set.id);
    if (!curriculum.primarySkillId || !curriculumSkill) add(issues, 'error', 'CURRICULUM_SKILL_INVALID', `Set ${set.id} needs a valid curriculum primarySkillId.`, file, set.id);
    if (curriculumSkill && curriculum.domain && curriculumSkill.domain !== curriculum.domain) add(issues, 'error', 'CURRICULUM_DOMAIN_MISMATCH', `Set ${set.id} says ${curriculum.domain}, but ${curriculum.primarySkillId} belongs to ${curriculumSkill.domain}.`, file, set.id);
    if (!VALID_CONTENT_KINDS.has(curriculum.contentKind)) add(issues, 'error', 'CURRICULUM_KIND_INVALID', `Set ${set.id} needs a valid curriculum contentKind.`, file, set.id);
    if (!curriculum.learningObjective) add(issues, 'warning', 'LEARNING_OBJECTIVE_MISSING', `Set ${set.id} has no learner-facing learning objective.`, file, set.id);
    for (const sid of curriculum.secondarySkillIds || []) {
      if (!skills.has(sid)) add(issues, 'error', 'CURRICULUM_SECONDARY_SKILL_INVALID', `Set ${set.id} uses unknown curriculum secondary skill ${sid}.`, file, set.id);
      if (sid === curriculum.primarySkillId) add(issues, 'warning', 'CURRICULUM_SECONDARY_DUPLICATES_PRIMARY', `Set ${set.id} repeats its primary skill as a secondary skill.`, file, set.id);
    }

    for (const ref of set.passageRefs || []) {
      if (!passages.has(ref)) add(issues, 'error', 'PASSAGE_REF_UNKNOWN', `Set ${set.id} references unknown passage ${ref}.`, file, ref);
    }

    if (set.runtime?.file) {
      if (runtimeFiles.has(set.runtime.file)) add(issues, 'error', 'RUNTIME_FILE_DUPLICATE', `Duplicate runtime file: ${set.runtime.file}`, file);
      runtimeFiles.add(set.runtime.file);
    }

    const correctPositions = [];
    const questionIds = new Set();
    for (const q of set.questions || []) {
      const qloc = `${set.id}:${q.id || '(no-id)'}`;
      if (!q.id) add(issues, 'error', 'QUESTION_ID_MISSING', `Question in ${set.id} is missing an id.`, file);
      else if (questionIds.has(q.id)) add(issues, 'error', 'QUESTION_ID_DUPLICATE', `Duplicate question id ${q.id} inside ${set.id}.`, file, qloc);
      else questionIds.add(q.id);

      if (!q.primarySkillId || !skills.has(q.primarySkillId)) add(issues, 'error', 'SKILL_UNKNOWN', `${qloc} uses unknown skill ${q.primarySkillId || '(missing)'}.`, file, qloc);
      for (const sid of q.secondarySkillIds || []) {
        if (!skills.has(sid)) add(issues, 'error', 'SECONDARY_SKILL_UNKNOWN', `${qloc} uses unknown secondary skill ${sid}.`, file, qloc);
      }
      if (!q.familyId) add(issues, 'error', 'FAMILY_MISSING', `${qloc} needs a familyId.`, file, qloc);
      else {
        const list = families.get(q.familyId) || [];
        list.push({ setId: set.id, questionId: q.id, skillId: q.primarySkillId, status: set.status, file });
        families.set(q.familyId, list);
      }
      if (!VALID_DIFFICULTIES.has(q.difficulty)) add(issues, 'error', 'QUESTION_DIFFICULTY_INVALID', `${qloc} has invalid difficulty.`, file, qloc);
      if (![1,2,3].includes(q.dok)) add(issues, 'error', 'DOK_INVALID', `${qloc} must have DOK 1–3.`, file, qloc);
      if (!q.prompt) add(issues, 'error', 'PROMPT_MISSING', `${qloc} has no prompt.`, file, qloc);
      if (words(q.prompt).length > 35) add(issues, 'warning', 'PROMPT_WORDY', `${qloc} stem is over 35 words; check whether wording can be simplified.`, file, qloc);

      const selected = ['multiple_choice','evidence_based','grammar_edit'].includes(q.type);
      if (selected) {
        if (!Array.isArray(q.options) || q.options.length < 2) add(issues, 'error', 'OPTIONS_MISSING', `${qloc} needs answer options.`, file, qloc);
        const optionIds = new Set((q.options || []).map((o) => o.id));
        const correct = Array.isArray(q.correct) ? q.correct : [q.correct].filter(Boolean);
        if (!correct.length) add(issues, 'error', 'CORRECT_MISSING', `${qloc} has no correct answer.`, file, qloc);
        for (const id of correct) if (!optionIds.has(id)) add(issues, 'error', 'CORRECT_NOT_IN_OPTIONS', `${qloc} correct option ${id} is not present.`, file, qloc);
        if (correct.length === 1) correctPositions.push(correct[0]);
        for (const opt of q.options || []) {
          if (!correct.includes(opt.id) && set.status === 'published') {
            if (!opt.distractorType) add(issues, 'error', 'DISTRACTOR_TYPE_MISSING', `${qloc} wrong option ${opt.id} needs distractorType.`, file, qloc);
            if (!opt.whyWrong) add(issues, 'error', 'DISTRACTOR_REASON_MISSING', `${qloc} wrong option ${opt.id} needs whyWrong.`, file, qloc);
          }
        }
      }

      if (!q.explanation?.answer || !q.explanation?.whyCorrect) add(issues, 'error', 'EXPLANATION_INCOMPLETE', `${qloc} needs explanation.answer and explanation.whyCorrect.`, file, qloc);
      const exp = q.explanation?.whyCorrect || '';
      if (words(exp).length > 80) add(issues, 'warning', 'EXPLANATION_LONG', `${qloc} explanation is over 80 words.`, file, qloc);
      const expLower = exp.trim().toLowerCase();
      if (GENERIC_STARTS.some((x) => expLower.startsWith(x))) add(issues, 'warning', 'EXPLANATION_GENERIC', `${qloc} explanation starts with generic/AI-like wording.`, file, qloc);
      if (q.difficulty === 'hard' && (q.difficultyProfile?.reasoningDepth || 1) < 2) add(issues, 'warning', 'HARD_LOW_REASONING', `${qloc} is hard but reasoningDepth is below 2.`, file, qloc);
    }

    if (curriculum.primarySkillId && curriculum.contentKind !== 'mixed_review') {
      const hasPrimaryQuestion = (set.questions || []).some((q) => q.primarySkillId === curriculum.primarySkillId);
      if (!hasPrimaryQuestion) add(issues, 'warning', 'CURRICULUM_PRIMARY_NOT_TESTED', `Set ${set.id} is attached to ${curriculum.primarySkillId}, but none of its questions directly test that skill.`, file, set.id);
    }

    if (correctPositions.length >= 4) {
      const counts = Object.fromEntries([...new Set(correctPositions)].map((x) => [x, correctPositions.filter((y) => y === x).length]));
      const max = Math.max(...Object.values(counts));
      if (max / correctPositions.length > 0.6) add(issues, 'warning', 'ANSWER_POSITION_BIAS', `More than 60% of selected-response answers in ${set.id} use the same option position.`, file, set.id);
    }
    if (set.status === 'published') publishedSets.push({ file, set });
  }

  for (const [familyId, items] of families) {
    const published = items.filter((x) => x.status === 'published');
    if (published.length === 1) {
      const only = published[0];
      add(issues, 'warning', 'TRANSFER_FAMILY_SINGLETON', `Family ${familyId} has only one published question; transfer cannot be tested yet.`, only.file || path.join(SRC, 'sets'), `${only.setId}:${only.questionId}`);
    }
  }

  const errors = issues.filter((x) => x.type === 'error');
  const warnings = issues.filter((x) => x.type === 'warning');

  if (!quiet) {
    console.log(`Content validation: ${errors.length} error(s), ${warnings.length} warning(s)`);
    for (const issue of issues) console.log(`${issue.type.toUpperCase()} ${issue.code} ${issue.file}${issue.location ? ` [${issue.location}]` : ''}: ${issue.message}`);
  }

  return { ok: errors.length === 0, errors, warnings, issues, skills, passages, publishedSets };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await validateContent();
  process.exit(result.ok ? 0 : 1);
}
