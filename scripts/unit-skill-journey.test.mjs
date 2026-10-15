import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const curriculum = JSON.parse(fs.readFileSync('data/generated/curriculum.json', 'utf8'));
const routesSource = fs.readFileSync('js/curriculum-routes.js', 'utf8');
const sandbox = {window:{}};
vm.runInNewContext(routesSource, sandbox);
const routes = sandbox.window.CurriculumRoutes.build(curriculum);

test('grouped skill links route to their unit with available sets and checks', () => {
  let checked = 0;
  for (const track of curriculum.tracks || []) for (const domain of track.domains || []) {
    for (const unit of domain.units || []) {
      const loc = routes.unitLocation(unit.id);
      assert.ok(loc, 'Missing unit '+unit.id);
      assert.equal(loc.unit.id, unit.id);
      assert.equal(loc.skill.id, unit.id);
      assert.ok(loc.returnHref.includes('unit='+encodeURIComponent(unit.id)));
      for (const skillId of unit.skillIds || []) {
        const skillLoc = routes.skillLocation(skillId);
        assert.equal(skillLoc?.unitId, unit.id, 'Incorrect unit for '+skillId);
        assert.equal(skillLoc?.skill?.id, unit.id, 'Missing shared unit sets for '+skillId);
        assert.equal(routes.hrefForSkill(skillId), loc.returnHref);
        checked++;
      }
      for (const set of unit.sets || []) {
        assert.ok(fs.existsSync('data/'+set.file), 'Missing unit practice file '+set.file);
      }
      for (const check of unit.checks || []) {
        assert.ok(fs.existsSync('data/'+check.file), 'Missing unit check file '+check.file);
      }
    }
  }
  assert.ok(checked > 0, 'No grouped skills found in curriculum');
});

test('skill entry can accept both direct skill IDs and unit IDs', () => {
  const entry = fs.readFileSync('js/skill.js', 'utf8');
  assert.match(entry, /p\.get\("unit"\)/);
  assert.match(entry, /domain\?\.units\?\.find/);
  assert.match(entry, /domain\?\.skills\?\.find/);
  assert.match(entry, /Skill Check/);
});
