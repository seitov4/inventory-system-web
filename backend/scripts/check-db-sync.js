#!/usr/bin/env node
/*
  Simple check to compare CREATE TABLE names across SQL schema files.
  Exits with non-zero status if differences detected.
  Usage: node scripts/check-db-sync.js
*/

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function extractTableNames(sql) {
  const names = new Set();
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?)([a-zA-Z0-9_]+)(?:"?)\s*\(/ig;
  let m;
  while ((m = re.exec(sql)) !== null) {
    names.add(m[1]);
  }
  return names;
}

function diff(a, b) {
  const onlyA = [...a].filter(x => !b.has(x));
  const onlyB = [...b].filter(x => !a.has(x));
  return { onlyA, onlyB };
}

const files = [
  join(process.cwd(), 'db', 'legacy', 'schema.sql'),
  join(process.cwd(), 'db', 'legacy', 'schema_v2.sql'),
  join(process.cwd(), 'backend', 'src', 'db', 'init.sql'),
  join(process.cwd(), 'backend', 'src', 'db', 'init.sqlite.sql')
];

const existing = files.filter(f => existsSync(f));
if (existing.length < 2) {
  console.log('Not enough schema files found to compare. Files present:', existing);
  process.exit(0);
}

const maps = existing.map(f => ({ path: f, names: extractTableNames(readFileSync(f, 'utf8')) }));

// Compare each file to canonical init.sql (Postgres) if present
const canonicalPath = join(process.cwd(), 'backend', 'src', 'db', 'init.sql');
const canonical = maps.find(m => m.path === canonicalPath) || maps[0];

let failed = false;
for (const m of maps) {
  if (m.path === canonical.path) continue;
  const d = diff(canonical.names, m.names);
  if (d.onlyA.length || d.onlyB.length) {
    failed = true;
    console.log(`\nMismatch between canonical (${canonical.path}) and ${m.path}:`);
    if (d.onlyA.length) console.log('  Only in canonical:', d.onlyA.join(', '));
    if (d.onlyB.length) console.log('  Only in other file:', d.onlyB.join(', '));
  }
}

if (failed) {
  console.error('\nSchema sync check failed — differences found.');
  process.exit(2);
} else {
  console.log('Schema sync check passed — CREATE TABLE sets match.');
  process.exit(0);
}
