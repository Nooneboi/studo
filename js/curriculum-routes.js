/*
  curriculum-routes.js
  --------------------
  Small shared learner-routing helper derived from the generated curriculum.
  It keeps Progress and module sequencing on the canonical curriculum path.
*/
(function () {
  function build(curriculum) {
    const skillRoutes = new Map();
    const skillLocations = new Map();
    const setLocations = new Map();

    for (const track of curriculum?.tracks || []) {
      for (const domain of track.domains || []) {
        const units = Array.isArray(domain.units) ? domain.units : [];
        const skills = Array.isArray(domain.skills) ? domain.skills : [];

        if (units.length) {
          for (const unit of units) {
            const returnHref = `skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&unit=${encodeURIComponent(unit.id)}`;
            for (const skillId of unit.skillIds || []) {
              skillRoutes.set(skillId, returnHref);
              skillLocations.set(skillId, { trackId: track.id, domainId: domain.id, unitId: unit.id, returnHref, skill: null });
            }
            indexSets(unit.sets, returnHref, setLocations);
          }
        } else {
          for (const skill of skills) {
            const returnHref = `skill.html?track=${encodeURIComponent(track.id)}&domain=${encodeURIComponent(domain.id)}&skill=${encodeURIComponent(skill.id)}`;
            skillRoutes.set(skill.id, returnHref);
            skillLocations.set(skill.id, { trackId: track.id, domainId: domain.id, unitId: null, returnHref, skill });
            indexSets(skill.sets, returnHref, setLocations);
          }
        }
      }
    }

    return {
      hrefForSkill(skillId) {
        return skillRoutes.get(skillId) || "practice.html";
      },
      skillLocation(skillId) {
        return skillLocations.get(skillId) || null;
      },
      nextSet(file) {
        const location = setLocations.get(String(file || ""));
        if (!location) return null;
        const next = location.sets[location.index + 1];
        if (!next?.file) return null;
        return {
          title: next.title || "Next practice",
          file: next.file,
          returnHref: location.returnHref,
        };
      },
    };
  }

  function indexSets(sets, returnHref, setLocations) {
    const list = Array.isArray(sets) ? sets : [];
    list.forEach((set, index) => {
      if (!set?.file) return;
      setLocations.set(String(set.file), { sets: list, index, returnHref });
    });
  }

  window.CurriculumRoutes = { build };
})();
