import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'content-src');

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const VALID_STATUS = new Set(['draft', 'review', 'approved', 'published', 'retired']);
const VALID_RIGHTS = new Set(['original', 'public_domain', 'licensed', 'permission']);
const VALID_CONTENT_KINDS = new Set(['passage_practice','skill_drill','quiz','mixed_review','editing_practice','extended_response','extended_response_practice','argument_practice']);
const VALID_RESOURCE_TYPES = new Set(['pdf','worksheet','study_guide','notes','reference','link','docx']);
const SELECTED_TYPES = new Set(['multiple_choice','evidence_based','grammar_edit']);
const GENERIC_STARTS = [
  'the passage illustrates',
  'this answer is correct because',
  'the author effectively demonstrates',
  'it can be inferred that',
];
const GENERIC_WHY_WRONG = [
  'this option is not best supported by the passage',
  'this option is not the strongest text-based support for the inference',
  'this choice does not best match the relationship and evidence in this text',
  'this option does not compare the two subjects accurately on the requested basis',
];

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function jsonFiles(dir) {
  try {
    return (await fs.readdir(dir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => path.join(dir, entry.name));
  } catch {
    return [];
  }
}

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean);
}

function slug(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function add(list, type, code, message, file, location = '') {
  list.push({ type, code, message, file: path.relative(ROOT, file), location });
}

function normalizeText(text) {
  return String(text || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeCorrect(correct) {
  return Array.isArray(correct) ? correct.filter(Boolean) : [correct].filter(Boolean);
}

function correctLetter(options, correct) {
  const ids = normalizeCorrect(correct);
  if (ids.length !== 1) return null;
  const index = (options || []).findIndex((option) => option.id === ids[0]);
  if (index < 0 || index > 25) return null;
  return String.fromCharCode(65 + index);
}

function explicitAnswerLetter(text) {
  const value = String(text || '').trim();
  const direct = value.match(/^([A-D])\s*$/i);
  if (direct) return direct[1].toUpperCase();
  const explained = value.match(/^([A-D])(?:[.) :]\s*|\s+)(?=(?:is|was|would|best|correct|accurately|directly|properly|most|better|stronger|the\s+(?:best|correct))\b)/i);
  return explained ? explained[1].toUpperCase() : null;
}

function sequencePattern(letters) {
  if (letters.length < 7) return null;
  const cycle = letters.slice(0, 4);
  if (new Set(cycle).size !== 4) return null;
  if (letters.every((letter, index) => letter === cycle[index % 4])) return cycle.join('');
  return null;
}

function longestRun(values) {
  let longest = 0;
  let current = 0;
  let previous = null;
  for (const value of values) {
    if (value === previous) current += 1;
    else current = 1;
    previous = value;
    longest = Math.max(longest, current);
  }
  return longest;
}

function qaSummary(issues) {
  const byCode = {};
  for (const issue of issues) {
    const bucket = byCode[issue.code] || { errors: 0, warnings: 0, total: 0, files: [] };
    bucket.total += 1;
    if (issue.type === 'error') bucket.errors += 1;
    if (issue.type === 'warning') bucket.warnings += 1;
    if (issue.file && !bucket.files.includes(issue.file)) bucket.files.push(issue.file);
    byCode[issue.code] = bucket;
  }
  return {
    errors: issues.filter((issue) => issue.type === 'error').length,
    warnings: issues.filter((issue) => issue.type === 'warning').length,
    byCode,
  };
}

function trackMaps(curriculumConfig) {
  const skillToTrack = new Map();
  const trackStates = new Map();
  for (const track of curriculumConfig.tracks || []) {
    trackStates.set(track.id, track.publicationState || 'published');
    for (const domain of track.domains || []) {
      for (const group of domain.groups || []) {
        for (const skillId of group.skills || []) skillToTrack.set(skillId, track.id);
      }
    }
  }
  return { skillToTrack, trackStates };
}

function validateSelectedQuestion({ issues, file, location, question, status = 'published', answerText = '', correctPositions, wrongReasonUsage }) {
  if (!Array.isArray(question.options) || question.options.length < 2) {
    add(issues, 'error', 'OPTIONS_MISSING', `${location} needs answer options.`, file, location);
    return;
  }

  const optionIds = new Set();
  const optionTexts = new Set();
  for (const option of question.options) {
    if (!option.id) add(issues, 'error', 'OPTION_ID_MISSING', `${location} has an option without an id.`, file, location);
    else if (optionIds.has(option.id)) add(issues, 'error', 'OPTION_ID_DUPLICATE', `${location} repeats option id ${option.id}.`, file, location);
    optionIds.add(option.id);

    const normalized = String(option.text || '').trim().replace(/\s+/g, ' ');
    if (normalized && optionTexts.has(normalized)) add(issues, 'error', 'OPTION_TEXT_DUPLICATE', `${location} repeats answer-option text.`, file, location);
    if (normalized) optionTexts.add(normalized);
  }

  const correct = normalizeCorrect(question.correct);
  if (!correct.length) add(issues, 'error', 'CORRECT_MISSING', `${location} has no correct answer.`, file, location);
  for (const id of correct) {
    if (!optionIds.has(id)) add(issues, 'error', 'CORRECT_NOT_IN_OPTIONS', `${location} correct option ${id} is not present.`, file, location);
  }

  const letter = correctLetter(question.options, question.correct);
  if (letter) correctPositions.push(letter);
  const namedLetter = explicitAnswerLetter(answerText);
  if (letter && namedLetter && namedLetter !== letter) {
    add(issues, 'error', 'ANSWER_LETTER_MISMATCH', `${location} explanation names answer ${namedLetter}, but the correct displayed option is ${letter}.`, file, location);
  }

  for (const option of question.options) {
    if (!correct.includes(option.id) && status === 'published') {
      if ('distractorType' in option && !option.distractorType) add(issues, 'error', 'DISTRACTOR_TYPE_MISSING', `${location} wrong option ${option.id} needs distractorType.`, file, location);
      if ('whyWrong' in option && !option.whyWrong) add(issues, 'error', 'DISTRACTOR_REASON_MISSING', `${location} wrong option ${option.id} needs whyWrong.`, file, location);
      if (option.whyWrong) {
        const key = normalizeText(option.whyWrong).replace(/[.!?]+$/, '');
        const record = wrongReasonUsage.get(key) || { count: 0, file, location, sample: option.whyWrong };
        record.count += 1;
        wrongReasonUsage.set(key, record);
      }
    }
  }
}

export async function validateContent({ quiet = false } = {}) {
  const issues = [];
  const skillFiles = await jsonFiles(path.join(SRC, 'skills'));
  const passageFiles = await jsonFiles(path.join(SRC, 'passages'));
  const setFiles = await jsonFiles(path.join(SRC, 'sets'));
  const resourceFiles = await jsonFiles(path.join(SRC, 'resources'));
  const erPromptFiles = await jsonFiles(path.join(SRC, 'er-prompts'));
  const legacyIndexFile = path.join(SRC, 'config', 'legacy-index.json');
  const curriculumConfigFile = path.join(SRC, 'config', 'rla.curriculum.json');
  const curriculumConfig = await readJson(curriculumConfigFile);
  const { skillToTrack, trackStates } = trackMaps(curriculumConfig);

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

  const validDomainIds = new Set([...skills.values()].map((skill) => slug(skill.domain)).filter(Boolean));
  const passages = new Map();
  for (const file of passageFiles) {
    const passage = await readJson(file);
    if (!passage.id) add(issues, 'error', 'PASSAGE_ID_MISSING', 'Passage is missing an id.', file);
    else if (passages.has(passage.id)) add(issues, 'error', 'PASSAGE_ID_DUPLICATE', `Duplicate passage id: ${passage.id}`, file, passage.id);
    else passages.set(passage.id, passage);
    if (!passage.text || words(passage.text).length < 20) add(issues, 'error', 'PASSAGE_TEXT_MISSING', `Passage ${passage.id || '(unknown)'} has too little text.`, file);
    if (!passage.source?.type || !passage.source?.attribution) add(issues, 'error', 'PASSAGE_SOURCE_MISSING', `Passage ${passage.id || '(unknown)'} needs source type and attribution.`, file);
    if (!passage.rights?.status || !VALID_RIGHTS.has(passage.rights.status)) add(issues, 'error', 'PASSAGE_RIGHTS_INVALID', `Passage ${passage.id || '(unknown)'} needs an allowed rights status.`, file);
    if (passage.status === 'published' && !passage.reviewer) add(issues, 'error', 'PUBLISHED_WITHOUT_REVIEWER', `Published passage ${passage.id} needs a reviewer.`, file);
  }


  const erPrompts = [];
  const erPromptIds = new Set();
  for (const file of erPromptFiles) {
    const prompt = await readJson(file);
    const loc = prompt.id || '(no-id)';
    if (!prompt.id) add(issues, 'error', 'ER_PROMPT_ID_MISSING', 'ER prompt is missing an id.', file);
    else if (erPromptIds.has(prompt.id)) add(issues, 'error', 'ER_PROMPT_ID_DUPLICATE', `Duplicate ER prompt id: ${prompt.id}`, file, loc);
    else erPromptIds.add(prompt.id);
    if (!VALID_STATUS.has(prompt.status)) add(issues, 'error', 'ER_PROMPT_STATUS_INVALID', `ER prompt ${loc} has invalid status.`, file, loc);
    if (prompt.status === 'published' && !prompt.reviewer) add(issues, 'error', 'PUBLISHED_WITHOUT_REVIEWER', `Published ER prompt ${loc} needs a reviewer.`, file, loc);
    for (const key of ['sourceA','sourceB']) {
      const source = prompt[key] || {};
      const count = words(source.text).length;
      if (!source.title || count < 220) add(issues, 'error', 'ER_SOURCE_TOO_SHORT', `${loc} ${key} needs a title and at least 220 words.`, file, loc);
    }
    if (normalizeText(prompt.sourceA?.text) === normalizeText(prompt.sourceB?.text)) add(issues, 'error', 'ER_SOURCES_IDENTICAL', `${loc} source texts must differ.`, file, loc);
    if (!['A','B'].includes(prompt.strongerSource)) add(issues, 'error', 'ER_STRONGER_SOURCE_INVALID', `${loc} needs strongerSource A or B.`, file, loc);
    if (!Array.isArray(prompt.authoringKey?.reasons) || prompt.authoringKey.reasons.length < 2) add(issues, 'error', 'ER_AUTHORING_KEY_INCOMPLETE', `${loc} needs at least two authoring-key reasons.`, file, loc);
    if (words(prompt.modelResponse).length < 250) add(issues, 'error', 'ER_MODEL_TOO_SHORT', `${loc} model response needs at least 250 words.`, file, loc);
    if (!Array.isArray(prompt.annotations) || prompt.annotations.length < 4) add(issues, 'error', 'ER_ANNOTATIONS_INCOMPLETE', `${loc} needs at least four annotations.`, file, loc);
    if (!Array.isArray(prompt.revisionPrompts) || prompt.revisionPrompts.length < 3) add(issues, 'error', 'ER_REVISION_PROMPTS_INCOMPLETE', `${loc} needs at least three revision prompts.`, file, loc);
    if (prompt.status === 'published') erPrompts.push(prompt);
  }

  for (const file of resourceFiles) {
    const registry = await readJson(file);
    const ids = new Set();
    for (const resource of registry.resources || []) {
      const loc = resource.id || '(no-id)';
      if (!resource.id) add(issues, 'error', 'RESOURCE_ID_MISSING', 'Resource is missing an id.', file);
      else if (ids.has(resource.id)) add(issues, 'error', 'RESOURCE_ID_DUPLICATE', `Duplicate resource id: ${resource.id}`, file, loc);
      else ids.add(resource.id);
      if (!resource.title) add(issues, 'error', 'RESOURCE_TITLE_MISSING', `Resource ${loc} needs a title.`, file, loc);
      if (!VALID_RESOURCE_TYPES.has(resource.type)) add(issues, 'error', 'RESOURCE_TYPE_INVALID', `Resource ${loc} has invalid type ${resource.type || '(missing)'}.`, file, loc);
      if (!VALID_STATUS.has(resource.status)) add(issues, 'error', 'RESOURCE_STATUS_INVALID', `Resource ${loc} has invalid status.`, file, loc);
      const scope = resource.scope || 'skill';
      if (!['domain','skill'].includes(scope)) add(issues, 'error', 'RESOURCE_SCOPE_INVALID', `Resource ${loc} has invalid scope ${scope}.`, file, loc);
      if (scope === 'domain') {
        if (!resource.domainId) add(issues, 'error', 'RESOURCE_DOMAIN_MISSING', `Topic resource ${loc} must attach to a domain.`, file, loc);
        else if (!validDomainIds.has(resource.domainId)) add(issues, 'error', 'RESOURCE_DOMAIN_UNKNOWN', `Resource ${loc} uses unknown domain ${resource.domainId}.`, file, loc);
      } else {
        const skillIds = [...(resource.skillIds || []), ...(resource.primarySkillId ? [resource.primarySkillId] : [])];
        if (!skillIds.length) add(issues, 'error', 'RESOURCE_SKILL_MISSING', `Skill resource ${loc} must attach to at least one skill.`, file, loc);
        for (const skillId of skillIds) {
          if (!skills.has(skillId)) add(issues, 'error', 'RESOURCE_SKILL_UNKNOWN', `Resource ${loc} uses unknown skill ${skillId}.`, file, loc);
          else if (resource.domainId && slug(skills.get(skillId).domain) !== resource.domainId) add(issues, 'error', 'RESOURCE_DOMAIN_SKILL_MISMATCH', `Resource ${loc} attaches ${skillId} to the wrong domain ${resource.domainId}.`, file, loc);
        }
      }
      const href = resource.href || resource.path;
      if (!href) add(issues, 'error', 'RESOURCE_HREF_MISSING', `Resource ${loc} needs href or path.`, file, loc);
      if (resource.status === 'published' && resource.rightsStatus && !VALID_RIGHTS.has(resource.rightsStatus)) add(issues, 'error', 'RESOURCE_RIGHTS_INVALID', `Resource ${loc} has an invalid rights status.`, file, loc);
      if (resource.status === 'published' && !resource.reviewer) add(issues, 'warning', 'RESOURCE_REVIEWER_MISSING', `Published resource ${loc} has no reviewer.`, file, loc);
      if (href && !/^https?:\/\//i.test(href)) {
        const local = path.join(ROOT, href.replace(/^\/+/, ''));
        try { await fs.access(local); }
        catch { if (resource.status === 'published') add(issues, 'error', 'RESOURCE_FILE_MISSING', `Published resource ${loc} points to missing file ${href}.`, file, loc); }
      }
    }
  }

  const families = new Map();
  const publishedSets = [];
  const selectedBanks = [];
  const wrongReasonUsage = new Map();
  const skillCoverage = new Map();
  const canonicalQuestionIds = new Set();
  const setIds = new Set();
  const runtimeFiles = new Set();

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
    for (const skillId of curriculum.secondarySkillIds || []) {
      if (!skills.has(skillId)) add(issues, 'error', 'CURRICULUM_SECONDARY_SKILL_INVALID', `Set ${set.id} uses unknown curriculum secondary skill ${skillId}.`, file, set.id);
      if (skillId === curriculum.primarySkillId) add(issues, 'warning', 'CURRICULUM_SECONDARY_DUPLICATES_PRIMARY', `Set ${set.id} repeats its primary skill as a secondary skill.`, file, set.id);
    }
    for (const ref of set.passageRefs || []) if (!passages.has(ref)) add(issues, 'error', 'PASSAGE_REF_UNKNOWN', `Set ${set.id} references unknown passage ${ref}.`, file, ref);
    if (set.runtime?.file) {
      if (runtimeFiles.has(set.runtime.file)) add(issues, 'error', 'RUNTIME_FILE_DUPLICATE', `Duplicate runtime file: ${set.runtime.file}`, file);
      runtimeFiles.add(set.runtime.file);
    }

    const correctPositions = [];
    const questionIds = new Set();
    for (const question of set.questions || []) {
      const qloc = `${set.id}:${question.id || '(no-id)'}`;
      if (!question.id) add(issues, 'error', 'QUESTION_ID_MISSING', `Question in ${set.id} is missing an id.`, file);
      else if (questionIds.has(question.id)) add(issues, 'error', 'QUESTION_ID_DUPLICATE', `Duplicate question id ${question.id} inside ${set.id}.`, file, qloc);
      else questionIds.add(question.id);
      const canonicalId = `${set.id}:${question.id}`;
      if (canonicalQuestionIds.has(canonicalId)) add(issues, 'error', 'QUESTION_ID_CANONICAL_DUPLICATE', `Duplicate canonical question identity ${canonicalId}.`, file, qloc);
      canonicalQuestionIds.add(canonicalId);

      if (!question.primarySkillId || !skills.has(question.primarySkillId)) add(issues, 'error', 'SKILL_UNKNOWN', `${qloc} uses unknown skill ${question.primarySkillId || '(missing)'}.`, file, qloc);
      for (const skillId of question.secondarySkillIds || []) if (!skills.has(skillId)) add(issues, 'error', 'SECONDARY_SKILL_UNKNOWN', `${qloc} uses unknown secondary skill ${skillId}.`, file, qloc);
      if (!question.familyId) add(issues, 'error', 'FAMILY_MISSING', `${qloc} needs a familyId.`, file, qloc);
      else {
        const list = families.get(question.familyId) || [];
        list.push({ setId: set.id, questionId: question.id, skillId: question.primarySkillId, status: set.status, file });
        families.set(question.familyId, list);
      }
      if (!VALID_DIFFICULTIES.has(question.difficulty)) add(issues, 'error', 'QUESTION_DIFFICULTY_INVALID', `${qloc} has invalid difficulty.`, file, qloc);
      if (![1,2,3].includes(question.dok)) add(issues, 'error', 'DOK_INVALID', `${qloc} must have DOK 1–3.`, file, qloc);
      if (!question.prompt) add(issues, 'error', 'PROMPT_MISSING', `${qloc} has no prompt.`, file, qloc);
      if (words(question.prompt).length > 35) add(issues, 'warning', 'PROMPT_WORDY', `${qloc} stem is over 35 words; check whether wording can be simplified.`, file, qloc);

      if (SELECTED_TYPES.has(question.type)) {
        validateSelectedQuestion({ issues, file, location: qloc, question, status: set.status, answerText: question.explanation?.answer || question.explanation?.whyCorrect || '', correctPositions, wrongReasonUsage });
      }

      if (!question.explanation?.answer || !question.explanation?.whyCorrect) add(issues, 'error', 'EXPLANATION_INCOMPLETE', `${qloc} needs explanation.answer and explanation.whyCorrect.`, file, qloc);
      const exp = question.explanation?.whyCorrect || '';
      if (words(exp).length > 80) add(issues, 'warning', 'EXPLANATION_LONG', `${qloc} explanation is over 80 words.`, file, qloc);
      if (GENERIC_STARTS.some((text) => normalizeText(exp).startsWith(text))) add(issues, 'warning', 'EXPLANATION_GENERIC', `${qloc} explanation starts with generic/AI-like wording.`, file, qloc);
      if (question.difficulty === 'hard' && (question.difficultyProfile?.reasoningDepth || 1) < 2) add(issues, 'warning', 'HARD_LOW_REASONING', `${qloc} is hard but reasoningDepth is below 2.`, file, qloc);
      if (set.status === 'published' && question.primarySkillId) skillCoverage.set(question.primarySkillId, (skillCoverage.get(question.primarySkillId) || 0) + 1);
    }

    if (curriculum.primarySkillId && curriculum.contentKind !== 'mixed_review') {
      const hasPrimaryQuestion = (set.questions || []).some((question) => question.primarySkillId === curriculum.primarySkillId);
      if (!hasPrimaryQuestion) add(issues, 'warning', 'CURRICULUM_PRIMARY_NOT_TESTED', `Set ${set.id} is attached to ${curriculum.primarySkillId}, but none of its questions directly test that skill.`, file, set.id);
    }
    if (correctPositions.length >= 4) {
      const counts = Object.fromEntries([...new Set(correctPositions)].map((letter) => [letter, correctPositions.filter((value) => value === letter).length]));
      const max = Math.max(...Object.values(counts));
      if (max / correctPositions.length > 0.6) add(issues, 'warning', 'ANSWER_POSITION_BIAS', `More than 60% of selected-response answers in ${set.id} use the same option position.`, file, set.id);
      const pattern = sequencePattern(correctPositions);
      if (pattern) add(issues, 'warning', 'ANSWER_POSITION_PATTERN', `${set.id} follows a repeated ${pattern} answer-position cycle.`, file, set.id);
      if (longestRun(correctPositions) >= 3) add(issues, 'warning', 'ANSWER_POSITION_RUN', `${set.id} contains a run of at least three identical correct-answer positions.`, file, set.id);
    }
    selectedBanks.push({ file, id: set.id, letters: correctPositions });

    if (set.status === 'published' && ['passage_practice','quiz'].includes(curriculum.contentKind)) {
      const passage = passages.get(set.passageRefs?.[0]);
      const wordCount = words(passage?.text).length;
      if (wordCount && wordCount < 400) add(issues, 'warning', 'PASSAGE_PRACTICE_SHORT', `${set.id} is classified as Passage Practice but is only ${wordCount} words.`, file, set.id);
      if (wordCount > 900) add(issues, 'warning', 'PASSAGE_PRACTICE_LONG', `${set.id} is classified as Passage Practice and is ${wordCount} words, above the 900-word training target.`, file, set.id);
    }
    if (set.status === 'published') publishedSets.push({ file, set });
  }

  const publishedLegacyModules = [];
  const legacyIds = new Set();
  let legacyIndex = [];
  try { legacyIndex = await readJson(legacyIndexFile); }
  catch { add(issues, 'error', 'LEGACY_INDEX_MISSING', 'Canonical legacy index is missing or invalid.', legacyIndexFile); }

  for (const entry of legacyIndex) {
    const sourceFile = path.join(SRC, entry.sourceFile || '');
    if (!entry.sourceFile || !entry.sourceFile.startsWith('legacy-modules/')) {
      add(issues, 'error', 'LEGACY_SOURCE_INVALID', `Legacy entry ${entry.title || entry.file || '(unknown)'} needs a sourceFile under legacy-modules/.`, legacyIndexFile, entry.file || '');
      continue;
    }
    let module;
    try { module = await readJson(sourceFile); }
    catch {
      add(issues, 'error', 'LEGACY_SOURCE_MISSING', `Legacy source ${entry.sourceFile} cannot be read.`, legacyIndexFile, entry.file || '');
      continue;
    }
    const moduleId = module.id || '(no-id)';
    if (!module.id || !module.title || !module.subject || !Array.isArray(module.questions) || !module.questions.length) {
      add(issues, 'error', 'LEGACY_CORE_METADATA_MISSING', `Legacy module ${moduleId} needs id, title, subject, and at least one question.`, sourceFile, moduleId);
    }
    if (module.id) {
      if (legacyIds.has(module.id)) add(issues, 'error', 'LEGACY_MODULE_ID_DUPLICATE', `Duplicate legacy module id ${module.id}.`, sourceFile, module.id);
      legacyIds.add(module.id);
    }

    const curriculum = entry.curriculum || module.contentMeta?.curriculum || null;
    if (curriculum?.primarySkillId && !skills.has(curriculum.primarySkillId)) add(issues, 'error', 'LEGACY_SKILL_UNKNOWN', `Legacy module ${moduleId} uses unknown curriculum skill ${curriculum.primarySkillId}.`, sourceFile, moduleId);
    for (const skillId of curriculum?.secondarySkillIds || []) if (!skills.has(skillId)) add(issues, 'error', 'LEGACY_SKILL_UNKNOWN', `Legacy module ${moduleId} uses unknown secondary skill ${skillId}.`, sourceFile, moduleId);
    if (curriculum?.contentKind && !VALID_CONTENT_KINDS.has(curriculum.contentKind)) add(issues, 'error', 'LEGACY_CONTENT_KIND_INVALID', `Legacy module ${moduleId} has invalid contentKind ${curriculum.contentKind}.`, sourceFile, moduleId);

    const correctPositions = [];
    const questionIds = new Set();
    for (const question of module.questions || []) {
      const qloc = `${moduleId}:${question.id || '(no-id)'}`;
      if (!question.id) add(issues, 'error', 'QUESTION_ID_MISSING', `Question in ${moduleId} is missing an id.`, sourceFile, qloc);
      else if (questionIds.has(question.id)) add(issues, 'error', 'QUESTION_ID_DUPLICATE', `Duplicate question id ${question.id} inside ${moduleId}.`, sourceFile, qloc);
      else questionIds.add(question.id);
      const canonicalId = `${moduleId}:${question.id}`;
      if (canonicalQuestionIds.has(canonicalId)) add(issues, 'error', 'QUESTION_ID_CANONICAL_DUPLICATE', `Duplicate canonical question identity ${canonicalId}.`, sourceFile, qloc);
      canonicalQuestionIds.add(canonicalId);

      const metadata = question.metadata || {};
      if (metadata.skillId && !skills.has(metadata.skillId)) add(issues, 'error', 'LEGACY_SKILL_UNKNOWN', `${qloc} uses unknown skill ${metadata.skillId}.`, sourceFile, qloc);
      for (const skillId of metadata.secondarySkillIds || []) if (!skills.has(skillId)) add(issues, 'error', 'LEGACY_SKILL_UNKNOWN', `${qloc} uses unknown secondary skill ${skillId}.`, sourceFile, qloc);
      if (SELECTED_TYPES.has(question.type)) {
        validateSelectedQuestion({ issues, file: sourceFile, location: qloc, question, status: 'published', answerText: question.explanation || '', correctPositions, wrongReasonUsage });
      }
      if (metadata.difficulty === 'hard') {
        const profile = metadata.difficultyProfile || {};
        if ((profile.reasoningDepth || 1) < 2 || (profile.distractorSimilarity || 1) < 2) add(issues, 'warning', 'HARD_LOW_REASONING', `${qloc} is labeled hard but has a weak reasoning/distractor profile.`, sourceFile, qloc);
      }
      if (metadata.skillId) skillCoverage.set(metadata.skillId, (skillCoverage.get(metadata.skillId) || 0) + 1);
    }

    if (correctPositions.length >= 4) {
      const counts = Object.fromEntries([...new Set(correctPositions)].map((letter) => [letter, correctPositions.filter((value) => value === letter).length]));
      const max = Math.max(...Object.values(counts));
      if (max / correctPositions.length > 0.6) add(issues, 'warning', 'ANSWER_POSITION_BIAS', `More than 60% of selected-response answers in ${moduleId} use the same option position.`, sourceFile, moduleId);
      const pattern = sequencePattern(correctPositions);
      if (pattern) add(issues, 'warning', 'ANSWER_POSITION_PATTERN', `${moduleId} follows a repeated ${pattern} answer-position cycle.`, sourceFile, moduleId);
      if (longestRun(correctPositions) >= 3) add(issues, 'warning', 'ANSWER_POSITION_RUN', `${moduleId} contains a run of at least three identical correct-answer positions.`, sourceFile, moduleId);
    }
    selectedBanks.push({ file: sourceFile, id: moduleId, letters: correctPositions });

    if (curriculum && ['passage_practice','quiz'].includes(curriculum.contentKind)) {
      const wordCount = words(module.passage).length;
      if (wordCount && wordCount < 400) add(issues, 'warning', 'PASSAGE_PRACTICE_SHORT', `${moduleId} is classified as Passage Practice but is only ${wordCount} words.`, sourceFile, moduleId);
      if (wordCount > 900) add(issues, 'warning', 'PASSAGE_PRACTICE_LONG', `${moduleId} is classified as Passage Practice and is ${wordCount} words, above the 900-word training target.`, sourceFile, moduleId);
    }
    publishedLegacyModules.push({ file: sourceFile, entry, module, curriculum });
  }

  for (const [familyId, items] of families) {
    const published = items.filter((item) => item.status === 'published');
    if (published.length === 1) {
      const only = published[0];
      add(issues, 'warning', 'TRANSFER_FAMILY_SINGLETON', `Family ${familyId} has only one published question; transfer cannot be tested yet.`, only.file || path.join(SRC, 'sets'), `${only.setId}:${only.questionId}`);
    }
  }

  for (const [reason, record] of wrongReasonUsage) {
    const generic = GENERIC_WHY_WRONG.some((prefix) => reason.startsWith(prefix));
    if (record.count >= 8 || (generic && record.count >= 4)) {
      add(issues, 'warning', 'WHY_WRONG_REUSED', `The same generic whyWrong explanation is reused ${record.count} times: "${record.sample}"`, record.file, record.location);
    }
  }

  const bankLetters = selectedBanks.flatMap((bank) => bank.letters);
  if (bankLetters.length >= 20) {
    const counts = Object.fromEntries(['A','B','C','D'].map((letter) => [letter, bankLetters.filter((value) => value === letter).length]));
    const max = Math.max(...Object.values(counts));
    if (max / bankLetters.length > 0.4) add(issues, 'warning', 'ANSWER_POSITION_BANK_BIAS', `Across the canonical selected-response bank, one answer position exceeds 40% (${JSON.stringify(counts)}).`, legacyIndexFile);
  }

  for (const [skillId, skill] of skills) {
    const trackId = skillToTrack.get(skillId);
    if (trackStates.get(trackId) !== 'published') continue;
    const count = skillCoverage.get(skillId) || 0;
    if (count < 4) add(issues, 'warning', 'PUBLISHED_SKILL_LOW_COVERAGE', `Published skill ${skillId} (${skill.label}) has only ${count} canonical questions.`, curriculumConfigFile, skillId);
  }

  const errors = issues.filter((issue) => issue.type === 'error');
  const warnings = issues.filter((issue) => issue.type === 'warning');
  const summary = qaSummary(issues);
  if (!quiet) {
    console.log(`Content validation: ${errors.length} error(s), ${warnings.length} warning(s)`);
    for (const issue of issues) console.log(`${issue.type.toUpperCase()} ${issue.code} ${issue.file}${issue.location ? ` [${issue.location}]` : ''}: ${issue.message}`);
  }
  return { ok: errors.length === 0, errors, warnings, issues, qaSummary: summary, skills, passages, publishedSets, publishedLegacyModules, erPrompts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await validateContent();
  process.exit(result.ok ? 0 : 1);
}
