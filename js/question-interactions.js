(function (root) {
  'use strict';

  const SUPPORTED_TYPES = new Set([
    'multiple_choice', 'evidence_based', 'grammar_edit',
    'select_text', 'drag_sort', 'drag_order'
  ]);

  function grammarEditMode(question) {
    if (question?.type !== 'grammar_edit') return null;
    return String(question?.prompt || '').includes('{{blank}}') ? 'inline' : 'revision';
  }

  function splitGrammarPrompt(question) {
    const prompt = String(question?.prompt || '');
    if (grammarEditMode(question) !== 'inline') return { before: prompt, after: '' };
    const index = prompt.indexOf('{{blank}}');
    return { before: prompt.slice(0, index), after: prompt.slice(index + '{{blank}}'.length) };
  }

  function parseSort(answer) {
    const out = {};
    String(answer || '').split('|').filter(Boolean).forEach((part) => {
      const split = part.indexOf('=');
      if (split > 0) out[part.slice(0, split)] = part.slice(split + 1);
    });
    return out;
  }

  function serializeSort(assignments) {
    return Object.entries(assignments || {})
      .filter(([item, zone]) => item && zone)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([item, zone]) => `${item}=${zone}`)
      .join('|');
  }

  function parseOrder(answer) {
    if (Array.isArray(answer)) return answer.map(String).filter(Boolean);
    return String(answer || '').split('|').map((x) => x.trim()).filter(Boolean);
  }

  function serializeOrder(ids) { return parseOrder(ids).join('|'); }

  function canonicalizeAnswer(question, answer) {
    if (question?.type === 'drag_sort') return serializeSort(typeof answer === 'string' ? parseSort(answer) : answer);
    if (question?.type === 'drag_order') return serializeOrder(answer);
    return String(answer ?? '').trim();
  }

  function hasCompleteAnswer(question, answer) {
    const canonical = canonicalizeAnswer(question, answer);
    if (!canonical) return false;
    if (question?.type === 'drag_sort') {
      const assignments = parseSort(canonical);
      return (question.interaction?.items || []).every((item) => Boolean(assignments[item.id]));
    }
    if (question?.type === 'drag_order') {
      const expected = (question.interaction?.items || []).map((item) => item.id);
      const actual = parseOrder(canonical);
      return actual.length === expected.length && new Set(actual).size === expected.length && expected.every((id) => actual.includes(id));
    }
    return true;
  }

  function isCorrect(question, answer) {
    return canonicalizeAnswer(question, answer) === canonicalizeAnswer(question, question?.correct);
  }

  function optionText(question, id) {
    return (question?.options || []).find((option) => String(option.id) === String(id))?.text || String(id || '');
  }

  function formatAnswer(question, answer) {
    const value = canonicalizeAnswer(question, answer);
    if (!value) return 'No answer';
    if (['multiple_choice','evidence_based','grammar_edit'].includes(question?.type)) return optionText(question, value);
    if (question?.type === 'select_text') return (question.interaction?.targets || []).find((target) => target.id === value)?.text || value;
    if (question?.type === 'drag_sort') {
      const zones = new Map((question.interaction?.zones || []).map((zone) => [zone.id, zone.label]));
      const items = new Map((question.interaction?.items || []).map((item) => [item.id, item.text]));
      return Object.entries(parseSort(value)).map(([item, zone]) => `${items.get(item) || item} → ${zones.get(zone) || zone}`).join('; ');
    }
    if (question?.type === 'drag_order') {
      const items = new Map((question.interaction?.items || []).map((item) => [item.id, item.text]));
      return parseOrder(value).map((id, index) => `${index + 1}. ${items.get(id) || id}`).join(' · ');
    }
    return value;
  }

  function moveOrder(ids, itemId, delta) {
    const next = parseOrder(ids);
    const index = next.indexOf(itemId);
    const target = index + Number(delta || 0);
    if (index < 0 || target < 0 || target >= next.length) return next;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }

  function segmentTextTargets(text, targets) {
    const source = String(text || '');
    const located = (targets || [])
      .map((target) => ({ ...target, index: source.indexOf(target.text) }))
      .filter((target) => target.index >= 0)
      .sort((a, b) => a.index - b.index);
    const segments = [];
    let cursor = 0;
    for (const target of located) {
      if (target.index < cursor) continue;
      if (target.index > cursor) segments.push({ kind:'text', text:source.slice(cursor, target.index) });
      segments.push({ kind:'target', id:target.id, text:target.text });
      cursor = target.index + target.text.length;
    }
    if (cursor < source.length) segments.push({ kind:'text', text:source.slice(cursor) });
    return segments;
  }

  root.QuestionInteractions = {
    SUPPORTED_TYPES,
    grammarEditMode,
    splitGrammarPrompt,
    parseSort,
    serializeSort,
    parseOrder,
    serializeOrder,
    canonicalizeAnswer,
    hasCompleteAnswer,
    isCorrect,
    formatAnswer,
    moveOrder,
    segmentTextTargets,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
