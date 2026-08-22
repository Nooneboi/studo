/* library-model.js — pure learner-facing discovery helpers */
(function (root) {
  const PASSAGE_GROUPS = [
    { id: 'science', label: 'Science' },
    { id: 'workplace', label: 'Workplace' },
    { id: 'community-civics', label: 'Community & Civics' },
    { id: 'literary', label: 'Literary' },
  ];

  function buildPracticeSearchItems(tracks) {
    const items = [];
    for (const track of tracks || []) {
      for (const domain of track.domains || []) {
        const units = Array.isArray(domain.units) ? domain.units.filter((u) => u?.available !== false) : [];
        if (units.length) {
          for (const unit of units) {
            items.push({
              trackId: track.id,
              trackLabel: track.shortLabel || track.label,
              domainId: domain.id,
              domainLabel: domain.label,
              unitId: unit.id,
              label: unit.label,
              summary: unit.summary || '',
              searchText: normalize(`${unit.label} ${unit.summary || ''} ${domain.label} ${track.label}`),
            });
          }
          continue;
        }
        for (const skill of domain.skills || []) {
          if (skill?.available === false) continue;
          items.push({
            trackId: track.id,
            trackLabel: track.shortLabel || track.label,
            domainId: domain.id,
            domainLabel: domain.label,
            skillId: skill.id,
            label: skill.label,
            summary: skill.summary || skill.description || '',
            searchText: normalize(`${skill.label} ${skill.summary || skill.description || ''} ${domain.label} ${track.label}`),
          });
        }
      }
    }
    return items;
  }

  function passageGroupId(set) {
    const meta = set?.passageMeta || {};
    const textType = normalize(meta.textType);
    const context = normalize(meta.context);
    if (textType === 'literary') return 'literary';
    if (['science', 'environment', 'environmental', 'technology', 'health'].includes(context)) return 'science';
    if (['workplace', 'business', 'career'].includes(context)) return 'workplace';
    return 'community-civics';
  }

  function groupPassageSets(sets) {
    const buckets = new Map(PASSAGE_GROUPS.map((g) => [g.id, []]));
    for (const set of sets || []) {
      const id = passageGroupId(set);
      buckets.get(id).push(set);
    }
    return PASSAGE_GROUPS.map((group) => ({
      ...group,
      items: buckets.get(group.id).slice().sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))),
    }));
  }

  function passageSearchText(set) {
    const p = set?.passageMeta || {};
    return normalize([
      set?.title,
      set?.description,
      set?.difficulty,
      p.context,
      p.textType,
      p.author,
      p.workTitle,
    ].filter(Boolean).join(' '));
  }

  function buildResourceLibrary(tracks) {
    const seen = new Set();
    const result = [];
    for (const track of tracks || []) {
      const trackEntry = { id: track.id, label: track.label, shortLabel: track.shortLabel || track.label, domains: [] };
      for (const domain of track.domains || []) {
        const domainEntry = { id: domain.id, label: domain.label, generalResources: [], topics: [] };
        addUnique(domainEntry.generalResources, domain.topicResources || domain.resources || [], seen);

        const units = Array.isArray(domain.units) ? domain.units.filter((u) => u?.available !== false) : [];
        const topics = units.length ? units : (domain.skills || []).filter((s) => s?.available !== false);
        for (const topic of topics) {
          const resources = [];
          addUnique(resources, topic.studyResources || topic.resources || [], seen);
          if (!resources.length) continue;
          domainEntry.topics.push({
            id: topic.id,
            label: topic.label,
            summary: topic.summary || topic.description || '',
            unitId: units.length ? topic.id : null,
            skillId: units.length ? null : topic.id,
            resources,
          });
        }
        if (domainEntry.generalResources.length || domainEntry.topics.length) trackEntry.domains.push(domainEntry);
      }
      if (trackEntry.domains.length) result.push(trackEntry);
    }
    return result;
  }

  function addUnique(target, resources, seen) {
    for (const resource of resources || []) {
      if (!resource?.id || seen.has(resource.id)) continue;
      seen.add(resource.id);
      target.push(resource);
    }
  }

  function resourceRole(resource) {
    if (resource?.type === 'study_guide') return { id: 'guide', label: 'Study Guide', order: 0 };
    if (resource?.type === 'worksheet') {
      const match = String(resource.title || '').match(/Workbook\s*(\d+)/i);
      const number = match ? Number(match[1]) : 1;
      return { id: `workbook-${number}`, label: `Workbook ${number}`, order: number };
    }
    return { id: resource?.type || 'file', label: label(resource?.type || 'File'), order: 20 };
  }

  function normalize(value) { return String(value || '').trim().toLowerCase().replace(/_/g, '-'); }
  function label(value) { return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }

  root.StudoLibraryModel = {
    buildPracticeSearchItems,
    passageGroupId,
    groupPassageSets,
    passageSearchText,
    buildResourceLibrary,
    resourceRole,
  };
})(typeof window !== 'undefined' ? window : globalThis);
