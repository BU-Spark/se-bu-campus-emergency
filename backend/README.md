# Backend

The backend is a [Supabase](https://supabase.com) project (Postgres database and auto-generated API).
The mobile app in `frontend/` reads from it using the Supabase JavaScript client.

The database is defined entirely in version-controlled files, so anyone can recreate it:

```
supabase/
├── config.toml   Supabase CLI configuration
├── migrations/   SQL files that create and change tables, applied in timestamp order
├── seed.sql      Emergency guidance and contacts data
├── seeds/        Generated seed files (aeds.sql: buildings and AEDs)
└── data/         Source data: the BU AED list (CSV) and building coordinates (JSON)
scripts/          Node.js scripts that turn the source data into seed files
```

## Data model

| Table             | Contents                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| `emergency_types` | Emergency categories shown on the home screen (Fire, Medical Emergencies, …)    |
| `guidance_steps`  | Ordered step-by-step instructions for each emergency type                       |
| `contacts`        | Emergency phone contacts for the Charles River (CRC) and Medical (MED) campuses |
| `buildings`       | BU buildings with AEDs: name, address, campus and latitude/longitude            |
| `aeds`            | AED locations (floor, room, note) in each building                              |

All tables use Row Level Security with a public read-only policy: the app can read content without
signing in, but cannot modify it. Content changes are made through migrations/seed files or the Supabase
dashboard.

## Content source

Guidance and contacts come from the official BU EHS
[Emergency Instructions](https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf) sheet.
Every row stores its `source_url`. See the header of `seed.sql` for the small wording adaptations made for mobile.

## Updating AED data

Building 649 (677 Beacon Street) is included with its original `Non BU` classification.
Its AED is on floor `01`, room `180`, with the location note `Main lobby`.
Apply `20261118000000_add_non_bu_aed.sql` to extend the building campus constraint
and upsert this building and AED without replacing other records. The frontend
lists it under the `Non BU` tab. Coordinates remain unverified, so no map pin or
distance is shown yet. The source CSV and seed generator also retain this record.
For this update, use `npx supabase db push` from the linked `backend/` directory
after reviewing pending migrations; a full seed reload is not required.

Supplemental buildings absent from the AED spreadsheet are maintained in
`supabase/data/additional-buildings.json`, with a source URL and verification notes.
Both the geocoder and seed generator include them. Do not add placeholder AED rows.
If the AED inventory later includes the same address, reconcile the supplemental ID
with its official building code before regenerating the seed.

MET (Metropolitan College), 1010 Commonwealth Avenue, is included in this list.
Its coordinates and AED locations are not yet verified; it is searchable in the
building directory after applying migration `20261117000000_add_met_building.sql`,
but has no map pin or distance until coordinates are supplied.
For an existing linked Supabase project, run `npx supabase db push` from `backend/`
after reviewing pending migrations. This is a local code change until the migration
is applied to the shared database; restarting Expo alone does not apply it.

AED locations come from the BU AED list (Google Sheet). Building coordinates come from geocoding each
building's address with [OpenStreetMap Nominatim](https://nominatim.org) and are saved in
`supabase/data/building-coordinates.json`. From the `backend/` directory:

1. Download the sheet as CSV and save it over `supabase/data/aed-list.csv`.
2. Look up coordinates for new buildings (or buildings whose address changed):

   ```bash
   node scripts/geocode-buildings.mjs
   ```

   It prints any address it couldn't find. To fix a result by hand, edit its latitude/longitude in the JSON
   file and set `"source": "manual"`; manual entries are never overwritten. `--refresh` looks up every
   building again.

3. Regenerate the seed file and apply it:

   ```bash
   node scripts/generate-aed-seed.mjs
   npx supabase db push --include-seed
   ```

## Setup

Run from the `backend/` directory. The Supabase CLI runs through `npx`, so nothing needs to be installed globally.

1. Create a project at [supabase.com](https://supabase.com) and save the database password.
2. Log in and link this folder to the project (the project ref is in the dashboard URL,
   `https://supabase.com/dashboard/project/<project-ref>`):

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```

3. Apply the schema and seed data:

   ```bash
   npx supabase db push --include-seed
   ```

To change the schema later, create a new migration with `npx supabase migration new <name>`, write the SQL,
and run `npx supabase db push`. Never edit a migration that has already been applied.
