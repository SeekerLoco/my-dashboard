#!/usr/bin/env node
// Publishes one Daily Telegraph issue: validates Thaddeus's JSON, copies it to data/telegraph/<date>.json,
// prunes issue files older than 7 days, and regenerates data/telegraph/index.ts.
//
// Usage: node scripts/telegraph-publish.mjs [YYYY-MM-DD] [--src /path/to/file.json]
//   date defaults to today in America/Denver; --src defaults to /home/box/shared/telegraph/<date>.json
//   node scripts/telegraph-publish.mjs --index-only   (just prune + rebuild the index)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data', 'telegraph');
const WINDOW_DAYS = 7;
const SECTION_KEYS = [
  'front_page',
  'local',
  'us_world',
  'markets',
  'sports',
  'irreverent',
  'weather',
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function fail(msg) {
  console.error(`telegraph-publish: ERROR: ${msg}`);
  process.exit(1);
}

function denverToday() {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
  }).format(new Date());
}

function dayDiff(from, to) {
  const ms = (d) => {
    const [y, m, day] = d.split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((ms(to) - ms(from)) / 86400000);
}

// ---- args ----
const args = process.argv.slice(2);
let date = null;
let src = null;
let indexOnly = false;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--src') src = args[++i];
  else if (a === '--index-only') indexOnly = true;
  else if (DATE_RE.test(a)) date = a;
  else fail(`unrecognized argument "${a}"`);
}
date ??= denverToday();
src ??= `/home/box/shared/telegraph/${date}.json`;

// ---- validate ----
function isStr(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function validate(issue) {
  const errors = [];
  const warnings = [];
  if (!issue || typeof issue !== 'object')
    return { errors: ['file is not a JSON object'], warnings };
  if (issue.edition_date !== date)
    errors.push(`edition_date is "${issue.edition_date}", expected "${date}"`);
  if (!issue.sections || typeof issue.sections !== 'object') {
    warnings.push(
      'no "sections" object; every section will show as unavailable',
    );
    issue.sections = {};
  }
  for (const key of SECTION_KEYS) {
    const s = issue.sections[key];
    if (!s) {
      warnings.push(`section "${key}" missing -> marked unavailable`);
      issue.sections[key] = { status: 'missing' };
      continue;
    }
    if (!isStr(s.status)) s.status = 'complete';
    for (const listKey of ['stories', 'headlines']) {
      if (s[listKey] === undefined) continue;
      if (!Array.isArray(s[listKey])) {
        errors.push(`${key}.${listKey} must be an array`);
        continue;
      }
      s[listKey].forEach((st, i) => {
        if (!st || !isStr(st.headline))
          errors.push(`${key}.${listKey}[${i}] has no headline`);
        if (st?.source_url && !/^https?:\/\//.test(st.source_url))
          errors.push(
            `${key}.${listKey}[${i}].source_url is not an http(s) URL`,
          );
      });
    }
  }
  const m = issue.sections.markets;
  if (m?.table !== undefined) {
    if (!Array.isArray(m.table)) errors.push('markets.table must be an array');
    else
      m.table.forEach((r, i) => {
        if (!isStr(r?.symbol)) errors.push(`markets.table[${i}] has no symbol`);
        for (const k of ['rsi_series', 'macd_series'])
          if (r?.[k] !== undefined && !Array.isArray(r[k]))
            errors.push(`markets.table[${i}].${k} must be an array`);
      });
  }
  const w = issue.sections.weather;
  if (Array.isArray(w?.maps))
    w.maps.forEach((mp, i) => {
      if (!/^https:\/\//.test(mp?.image_url ?? ''))
        errors.push(`weather.maps[${i}].image_url must be an https URL`);
    });
  return { errors, warnings };
}

if (!indexOnly) {
  if (!fs.existsSync(src)) fail(`input not found: ${src}`);
  let issue;
  try {
    issue = JSON.parse(fs.readFileSync(src, 'utf8'));
  } catch (e) {
    fail(`could not parse ${src}: ${e.message}`);
  }
  const { errors, warnings } = validate(issue);
  warnings.forEach((w) => console.warn(`telegraph-publish: warning: ${w}`));
  if (errors.length) fail(`${src} is invalid:\n  - ${errors.join('\n  - ')}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DATA_DIR, `${date}.json`),
    JSON.stringify(issue, null, 2) + '\n',
  );
  console.log(`telegraph-publish: wrote data/telegraph/${date}.json`);
}

// ---- prune (relative to today in Denver, same window as the site) ----
const today = denverToday();
const files = fs
  .readdirSync(DATA_DIR)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
const kept = [];
for (const f of files) {
  const d = f.slice(0, 10);
  if (dayDiff(d, today) >= WINDOW_DAYS) {
    fs.unlinkSync(path.join(DATA_DIR, f));
    console.log(`telegraph-publish: pruned ${f}`);
  } else kept.push(f);
}
kept.sort();

// ---- index ----
const lines = [
  '// Generated by scripts/telegraph-publish.mjs. Do not edit by hand.',
  ...kept.map((f, i) => `import i${i} from './${f}';`),
  '',
  `export const RAW_ISSUES: unknown[] = [${kept.map((_, i) => `i${i}`).join(', ')}];`,
  '',
];
fs.writeFileSync(path.join(DATA_DIR, 'index.ts'), lines.join('\n'));
console.log(
  `telegraph-publish: index has ${kept.length} issue(s): ${kept.map((f) => f.slice(0, 10)).join(', ') || 'none'}`,
);
