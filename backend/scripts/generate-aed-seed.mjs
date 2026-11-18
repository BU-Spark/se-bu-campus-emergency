// Generates supabase/seeds/aeds.sql from the BU AED list (supabase/data/aed-list.csv) and the building
// coordinates in supabase/data/building-coordinates.json.
//
// Usage, from the backend/ directory:
//   node scripts/generate-aed-seed.mjs
//
// Re-run this whenever the spreadsheet changes: download it from Google Sheets as CSV, save it over
// supabase/data/aed-list.csv, run `node scripts/geocode-buildings.mjs` for any new buildings, run this
// script, then `npx supabase db push --include-seed`.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { readAedList, supabaseDir } from './aed-list.mjs';

const outPath = join(supabaseDir, 'seeds', 'aeds.sql');
const coordinatesPath = join(supabaseDir, 'data', 'building-coordinates.json');

const sql = (value) => (value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`);

const { buildings, aeds, skipped } = readAedList();
const coordinates = existsSync(coordinatesPath) ? JSON.parse(readFileSync(coordinatesPath, 'utf8')) : {};
const missing = [...buildings.keys()].filter((id) => !coordinates[id]);

const duplicate = aeds.find((aed, index) => aeds.findIndex((other) => other.id === aed.id) !== index);
if (duplicate) throw new Error(`Two AEDs share building, floor and room: ${duplicate.id}`);

const buildingRow = (b) => {
  const point = coordinates[b.id];
  const latLng = point ? `${point.latitude}, ${point.longitude}` : 'null, null';
  return `  (${[b.id, b.name, b.address, b.campus].map(sql).join(', ')}, ${latLng})`;
};

const output = `-- GENERATED FILE: do not edit by hand.
-- Source: supabase/data/aed-list.csv, supabase/data/additional-buildings.json and supabase/data/building-coordinates.json.
-- Regenerate with: node scripts/generate-aed-seed.mjs
-- ${buildings.size} buildings, ${aeds.length} AEDs.${skipped.length ? `\n-- Skipped (site code not mapped to a BU campus): ${skipped.join('; ')}` : ''}${missing.length ? `\n-- Buildings without coordinates: ${missing.join(', ')}` : ''}
--
-- The script is idempotent: re-running it updates existing rows instead of failing.

insert into public.buildings (id, name, address, campus, latitude, longitude) values
${[...buildings.values()].map(buildingRow).join(',\n')}
on conflict (id) do update set
  name      = excluded.name,
  address   = excluded.address,
  campus    = excluded.campus,
  latitude  = excluded.latitude,
  longitude = excluded.longitude;

insert into public.aeds (id, building_id, floor, room, location_note, sort_order) values
${aeds.map((a) => `  (${[a.id, a.buildingId, a.floor, a.room, a.note].map(sql).join(', ')}, ${a.sortOrder})`).join(',\n')}
on conflict (id) do update set
  building_id   = excluded.building_id,
  floor         = excluded.floor,
  room          = excluded.room,
  location_note = excluded.location_note,
  sort_order    = excluded.sort_order;

-- Remove AEDs and buildings that are no longer in either maintained source list.
delete from public.aeds where id not in (${aeds.map((a) => sql(a.id)).join(', ')});
delete from public.buildings where id not in (${[...buildings.keys()].map(sql).join(', ')});
`;

writeFileSync(outPath, output);
console.log(`Wrote ${outPath}: ${buildings.size} buildings, ${aeds.length} AEDs.`);
if (skipped.length) console.warn(`Skipped ${skipped.length} row(s) not on a BU campus:\n  ${skipped.join('\n  ')}`);
if (missing.length) {
  console.warn(
    `${missing.length} building(s) have no coordinates; run scripts/geocode-buildings.mjs: ${missing.join(', ')}`
  );
}
