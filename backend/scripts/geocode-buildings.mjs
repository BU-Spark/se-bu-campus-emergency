// Looks up latitude/longitude for every building in the BU AED list and saves them to
// supabase/data/building-coordinates.json, which generate-aed-seed.mjs writes into the seed.
//
// Usage, from the backend/ directory:
//   node scripts/geocode-buildings.mjs            # only buildings that are new or whose address changed
//   node scripts/geocode-buildings.mjs --refresh  # look up every building again
//
// Uses the OpenStreetMap Nominatim geocoder (no API key). Its usage policy allows at most one request per
// second and asks for results to be cached, which is what the JSON file is for. Each search is limited to
// the building's own campus area, so an address like '10 Lenox Street' can't match a street elsewhere.
//
// To fix a wrong result by hand, edit its latitude/longitude in the JSON file and set "source": "manual";
// manual entries are never overwritten.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { readAedList, supabaseDir } from './aed-list.mjs';

const outPath = join(supabaseDir, 'data', 'building-coordinates.json');
const refresh = process.argv.includes('--refresh');

// Search areas as [west, south, east, north] longitude/latitude bounds.
const campusAreas = {
  CRC: [-71.135, 42.34, -71.085, 42.36],
  FEN: [-71.118, 42.334, -71.093, 42.352],
  MED: [-71.085, 42.326, -71.06, 42.345],
};

/** Addresses to try, most specific first: '264-270 Bay State Road' → '264 Bay State Road'. */
function candidates(address) {
  const firstNumber = address.replace(/^(\d+)-\d+\b/, '$1');
  const spelledOut = firstNumber.replace(/\bSt\. /g, 'Saint ');
  return [...new Set([firstNumber, spelledOut, address])];
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocode(address, campus) {
  const [west, south, east, north] = campusAreas[campus];
  for (const query of candidates(address)) {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({
      q: `${query}, Massachusetts`,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'us',
      viewbox: `${west},${north},${east},${south}`,
      bounded: '1',
    }).toString();
    const response = await fetch(url, {
      headers: { 'User-Agent': 'bu-campus-emergency-geocoder/1.0 (github.com/BU-Spark/se-bu-campus-emergency)' },
    });
    if (!response.ok) throw new Error(`Nominatim returned ${response.status} for "${query}"`);
    const [match] = await response.json();
    await sleep(1100);
    if (match) {
      return {
        latitude: Number(Number(match.lat).toFixed(6)),
        longitude: Number(Number(match.lon).toFixed(6)),
        // A road match means the house number wasn't found, so the point is somewhere on the street.
        precision: match.category === 'highway' ? 'street' : 'address',
        match: match.display_name,
      };
    }
  }
  return null;
}

const { buildings } = readAedList();
const saved = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {};
const result = {};
const notFound = [];
const streetOnly = [];
let lookedUp = 0;

for (const building of buildings.values()) {
  const previous = saved[building.id];
  const keep = previous && (previous.source === 'manual' || (!refresh && previous.address === building.address));
  if (keep) {
    result[building.id] = previous;
    continue;
  }
  lookedUp++;
  const found = await geocode(building.address, building.campus);
  if (!found) {
    notFound.push(`${building.id} ${building.address} (${building.campus})`);
    continue;
  }
  if (found.precision === 'street') streetOnly.push(`${building.id} ${building.address}`);
  result[building.id] = { address: building.address, ...found, source: 'nominatim' };
  console.log(`${building.id} ${building.address} → ${found.latitude}, ${found.longitude}`);
}

writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
console.log(`\nWrote ${outPath}: ${Object.keys(result).length}/${buildings.size} buildings (${lookedUp} looked up).`);
if (streetOnly.length)
  console.warn(`Matched the street but not the house number, check these:\n  ${streetOnly.join('\n  ')}`);
if (notFound.length) console.warn(`Not found, add these by hand with "source": "manual":\n  ${notFound.join('\n  ')}`);
