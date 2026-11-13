// Reads the BU AED list (supabase/data/aed-list.csv) into buildings and AEDs. Shared by
// generate-aed-seed.mjs and geocode-buildings.mjs so both see the same buildings.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const supabaseDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase');
const csvPath = join(supabaseDir, 'data', 'aed-list.csv');

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

/** Buildings (keyed by building code, in spreadsheet order), their AEDs, and the rows that were skipped. */
export function readAedList() {
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
  return { buildings, aeds, skipped };
}
