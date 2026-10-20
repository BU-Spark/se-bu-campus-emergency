// Generates supabase/seeds/aeds.sql from the BU AED list (supabase/data/aed-list.csv).
//
// Usage, from the backend/ directory:
//   node scripts/generate-aed-seed.mjs
//
// Re-run this whenever the spreadsheet changes: download it from Google Sheets as CSV, save it over
// supabase/data/aed-list.csv, run this script, then `npx supabase db push --include-seed`.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase');
const csvPath = join(root, 'data', 'aed-list.csv');
const outPath = join(root, 'seeds', 'aeds.sql');

// Site codes in the spreadsheet → campus codes used by the app. Rows with other codes (e.g. 'Non BU')
// are skipped and reported, so they can be checked with the client before being shown.
const campusBySite = { CRC: 'CRC', FEN: 'FEN', BUMC: 'MED' };

/** Minimal RFC 4180 CSV parser (handles quoted fields, escaped quotes, and commas inside quotes). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

const smallWords = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to']);
const acronyms = new Set(['BU', 'CAS', 'II', 'III']);

/** 'FITNESS AND RECREATION CENTER' → 'Fitness and Recreation Center'; keeps codes like 'M-BLDG' readable. */
function titleCase(text) {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, index) => {
      const bare = word.replace(/[^A-Za-z]/g, '');
      if (/\d/.test(word) || acronyms.has(bare) || /^\(.*\)$/.test(word)) return word;
      if (index > 0 && smallWords.has(word.toLowerCase())) return word.toLowerCase();
      return word
        .toLowerCase()
        .replace(/(^|[-/(])([a-z])/g, (_, before, letter) => before + letter.toUpperCase())
        .replace(/(?<!')\b([a-z])\b/g, (letter) => letter.toUpperCase()) // single letters, e.g. 'M-Bldg', 'Rafik B.'
        .replace(/^Mc([a-z])/, (_, letter) => 'Mc' + letter.toUpperCase());
    })
    .join(' ');
}

const sql = (value) => (value === null ? 'null' : `'${String(value).replace(/'/g, "''")}'`);

const [header, ...records] = parseCsv(readFileSync(csvPath, 'utf8').replace(/^﻿/, ''));
const column = (name) => {
  const index = header.findIndex((title) => title.trim() === name);
  if (index === -1) throw new Error(`Column "${name}" not found in ${csvPath}`);
  return index;
};
const col = {
  site: column('Site Code'),
  building: column('Bldg Code'),
  floor: column('Floor'),
  room: column('Room #'),
  description: column('Bldg Desc'),
  name: column('Building Name'),
  note: column('AED Location Note'),
};

const buildings = new Map();
const aeds = [];
const skipped = [];

for (const record of records) {
  const value = (key) => (record[col[key]] ?? '').trim();
  const campus = campusBySite[value('site')];
  if (!campus) {
    skipped.push(`${value('site')}: ${value('description')} (building ${value('building')})`);
    continue;
  }
  const buildingId = value('building');
  // 'Bldg Desc' is '<address>' or '<address> - <wing>', e.g. '85 EAST NEWTON STREET - M-BLDG'.
  const address = titleCase(value('description').split(' - ')[0]);
  if (!buildings.has(buildingId)) {
    buildings.set(buildingId, { id: buildingId, name: titleCase(value('name')) || address, address, campus });
  }
  const sortOrder = aeds.filter((aed) => aed.buildingId === buildingId).length + 1;
  aeds.push({
    id: `${buildingId}-${value('floor')}-${value('room')}`,
    buildingId,
    floor: value('floor'),
    room: value('room'),
    note: value('note'),
    sortOrder,
  });
}

const duplicate = aeds.find((aed, index) => aeds.findIndex((other) => other.id === aed.id) !== index);
if (duplicate) throw new Error(`Two AEDs share building, floor and room: ${duplicate.id}`);

const output = `-- GENERATED FILE: do not edit by hand.
-- Source: supabase/data/aed-list.csv (BU AED list). Regenerate with: node scripts/generate-aed-seed.mjs
-- ${buildings.size} buildings, ${aeds.length} AEDs.${skipped.length ? `\n-- Skipped (site code not mapped to a BU campus): ${skipped.join('; ')}` : ''}
--
-- The script is idempotent: re-running it updates existing rows instead of failing.

insert into public.buildings (id, name, address, campus) values
${[...buildings.values()].map((b) => `  (${[b.id, b.name, b.address, b.campus].map(sql).join(', ')})`).join(',\n')}
on conflict (id) do update set
  name    = excluded.name,
  address = excluded.address,
  campus  = excluded.campus;

insert into public.aeds (id, building_id, floor, room, location_note, sort_order) values
${aeds.map((a) => `  (${[a.id, a.buildingId, a.floor, a.room, a.note].map(sql).join(', ')}, ${a.sortOrder})`).join(',\n')}
on conflict (id) do update set
  building_id   = excluded.building_id,
  floor         = excluded.floor,
  room          = excluded.room,
  location_note = excluded.location_note,
  sort_order    = excluded.sort_order;

-- Remove AEDs and buildings that are no longer in the spreadsheet.
delete from public.aeds where id not in (${aeds.map((a) => sql(a.id)).join(', ')});
delete from public.buildings where id not in (${[...buildings.keys()].map(sql).join(', ')});
`;

writeFileSync(outPath, output);
console.log(`Wrote ${outPath}: ${buildings.size} buildings, ${aeds.length} AEDs.`);
if (skipped.length) console.warn(`Skipped ${skipped.length} row(s) not on a BU campus:\n  ${skipped.join('\n  ')}`);
