/*
  quick-review.js — selective recall lane inside Train
  ---------------------------------------------------
  Quick Review schedules only discrete recall cards. It never records
  Learning attempts, changes mistake state, or contributes mastery evidence.
*/
(function () {
  const STORAGE_KEY = 'sq:quick-review:v1';
  const SESSION_LIMIT = 10;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const GOT_IT_INTERVALS = [1, 3, 7, 14];

  async function init({ mount, setHeaderProgress } = {}) {
    if (!mount) return;
    document.body.classList.remove('mobile-nav-focus');
    const exit = document.getElementById('focus-exit');
    exit?.setAttribute('href', 'train.html');
    exit?.setAttribute('aria-label', 'Exit Quick Review');
    const footerCopy = document.querySelector('.site-footer .focus-wrap');
    if (footerCopy) footerCopy.textContent = 'Quick Review is recall practice for useful terms and rules. It does not change your skill signal.';
    const title = document.getElementById('focus-title');
    if (title) title.textContent = 'Quick Review';
    if (typeof setHeaderProgress === 'function') setHeaderProgress('');

    let payload;
    try {
      const response = await fetch('data/generated/quick-review.json');
      if (!response.ok) throw new Error(`Quick Review data returned ${response.status}`);
      payload = await response.json();
    } catch (error) {
      console.error(error);
      mount.innerHTML = `<div class="empty-state"><h1>Quick Review unavailable</h1><p>The review cards could not be loaded.</p><a class="btn" href="train.html">Back to Train</a></div>`;
      return;
    }

    const cards = Array.isArray(payload?.cards) ? payload.cards : [];
    if (!cards.length) {
      mount.innerHTML = `<div class="empty-state"><h1>No review cards yet</h1><p>Use adaptive Train or Practice for now.</p><a class="btn" href="train.html">Back to Train</a></div>`;
      return;
    }

    const state = readState();
    const queue = buildQueue(cards, state, Date.now());
    if (!queue.length) {
      renderNothingDue(mount, cards, state);
      return;
    }

    let index = 0;
    let revealed = false;
    const reviewed = new Set();

    const render = () => {
      const card = queue[index];
      if (!card) return renderComplete(mount, cards, state, reviewed.size);
      if (typeof setHeaderProgress === 'function') setHeaderProgress(`${index + 1} / ${queue.length}`);
      mount.innerHTML = `
        <section class="quick-review-shell" aria-labelledby="quick-review-heading">
          <div class="train-plan-eyebrow">Quick Review</div>
          <div class="quick-review-meta"><span>${escapeHtml(categoryLabel(card.category))}</span><span>${index + 1} of ${queue.length}</span></div>
          <article class="quick-review-card${revealed ? ' is-revealed' : ''}">
            <h1 id="quick-review-heading">${escapeHtml(card.front)}</h1>
            ${revealed ? `<div class="quick-review-answer"><p>${escapeHtml(card.back)}</p>${card.example ? `<div class="quick-review-example"><span>Example</span><p>${escapeHtml(card.example)}</p></div>` : ''}</div>` : '<p class="quick-review-prompt">Recall the rule or meaning before revealing it.</p>'}
          </article>
          <div class="quick-review-actions">
            ${revealed
              ? '<button class="btn secondary" type="button" id="quick-review-again">Again</button><button class="btn" type="button" id="quick-review-got-it">Got it</button>'
              : '<button class="btn" type="button" id="quick-review-reveal">Reveal</button>'}
          </div>
          <p class="train-plan-note">Quick Review is recall practice only. It does not change your skill signal.</p>
        </section>`;

      document.getElementById('quick-review-reveal')?.addEventListener('click', () => {
        revealed = true;
        render();
      });
      document.getElementById('quick-review-again')?.addEventListener('click', () => {
        updateCard(state, card.id, 'again');
        reviewed.add(card.id);
        revealed = false;
        index += 1;
        writeState(state);
        render();
      });
      document.getElementById('quick-review-got-it')?.addEventListener('click', () => {
        updateCard(state, card.id, 'got_it');
        reviewed.add(card.id);
        revealed = false;
        index += 1;
        writeState(state);
        render();
      });
    };

    render();
  }

  function buildQueue(cards, state, now) {
    const due = [];
    const unseen = [];
    for (const card of cards) {
      const record = state.cards[card.id];
      if (!record || !record.seen) unseen.push(card);
      else if (!Number.isFinite(record.dueAt) || record.dueAt <= now) due.push(card);
    }
    due.sort((a, b) => (state.cards[a.id]?.dueAt || 0) - (state.cards[b.id]?.dueAt || 0));
    return [...due, ...unseen].slice(0, SESSION_LIMIT);
  }

  function updateCard(state, id, action) {
    const now = Date.now();
    const current = state.cards[id] || { status: 'new', dueAt: 0, seen: 0, correctStreak: 0 };
    current.seen = (current.seen || 0) + 1;
    if (action === 'again') {
      current.status = 'again';
      current.correctStreak = 0;
      current.dueAt = now;
    } else {
      current.status = 'review';
      current.correctStreak = Math.min((current.correctStreak || 0) + 1, GOT_IT_INTERVALS.length);
      const days = GOT_IT_INTERVALS[Math.max(0, current.correctStreak - 1)];
      current.dueAt = now + days * DAY_MS;
    }
    state.cards[id] = current;
  }

  function renderComplete(mount, cards, state, reviewedCount) {
    document.body.classList.remove('mobile-nav-focus');
    const due = countDue(cards, state, Date.now());
    mount.innerHTML = `
      <section class="train-complete quick-review-complete">
        <div class="train-plan-eyebrow">Quick Review complete</div>
        <h1>${reviewedCount} card${reviewedCount === 1 ? '' : 's'} reviewed</h1>
        <p class="lede">${due ? `${due} card${due === 1 ? ' is' : 's are'} still due for another look.` : 'Nothing else is due right now.'}</p>
        <div class="train-plan-actions"><a class="btn" href="train.html">Back to Train</a><a class="btn secondary" href="practice.html">Practice</a></div>
        <p class="train-plan-note">Again and Got it only schedule these review cards. They do not change mastery or Skill Check evidence.</p>
      </section>`;
  }

  function renderNothingDue(mount, cards, state) {
    const seen = cards.filter((card) => state.cards[card.id]?.seen).length;
    mount.innerHTML = `
      <section class="train-plan quick-review-complete">
        <div class="train-plan-eyebrow">Quick Review</div>
        <h1>Nothing is due right now.</h1>
        <p class="lede">You have reviewed ${seen} of ${cards.length} cards. Come back later, or use adaptive Train for question practice.</p>
        <div class="train-plan-actions"><a class="btn" href="train.html">Back to Train</a><a class="btn secondary" href="practice.html">Practice</a></div>
      </section>`;
  }

  function countDue(cards, state, now) {
    return cards.filter((card) => {
      const record = state.cards[card.id];
      return record?.seen && (!Number.isFinite(record.dueAt) || record.dueAt <= now);
    }).length;
  }

  function readState() {
    try {
      const raw = window.StudoSafeStorage ? window.StudoSafeStorage.get(STORAGE_KEY, '') : localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.version === 1 && parsed.cards && typeof parsed.cards === 'object') return parsed;
    } catch (_) {}
    return { version: 1, cards: {} };
  }

  function writeState(state) {
    const value = JSON.stringify(state);
    if (window.StudoSafeStorage) return window.StudoSafeStorage.set(STORAGE_KEY, value);
    try { localStorage.setItem(STORAGE_KEY, value); return true; } catch (_) { return false; }
  }

  function categoryLabel(category) {
    return {
      argument_terms: 'Argument terms',
      transitions: 'Transitions',
      text_structure: 'Text structure',
      word_tone: 'Words & tone',
      language_rules: 'Language rules',
      punctuation: 'Punctuation',
      extended_response: 'Extended Response',
    }[category] || 'Review';
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  window.QuickReview = { init };
})();
