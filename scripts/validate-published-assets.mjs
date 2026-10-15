#!/usr/bin/env node
// Fail publication when a learner page references a missing local script/style.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
if (!fs.existsSync(root)) throw new Error('dist/ not built; run public:build first');
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const issues = [];
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  for (const m of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const tag = m[0], kind = m[1].toLowerCase();
    if (kind === 'link' && !/rel\s*=\s*["'](?:stylesheet|manifest|icon|apple-touch-icon)["']/i.test(tag)) continue;
    const attribute = kind === 'script' ? 'src' : 'href';
    const found = tag.match(new RegExp('\\b' + attribute + '\\s*=\\s*["\\']([^"\\']+)["\\']', 'i'));
    if (!found) continue;
    const href = found[1].split(/[?#]/)[0];
    if (!href || /^(?:https?:|data:|\/\/|#)/i.test(href)) continue;
    const relative = href.replace(/^\//, '');
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
      issues.push(`${page}: missing ${attribute} ${found[1]}`);
    }
  }
}
console.log(`Checked ${pages.length} published HTML pages for local script/style/manifest/icon references.`);
if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
}
