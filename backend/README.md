# Backend

The backend is a [Supabase](https://supabase.com) project (Postgres database and auto-generated API).
The mobile app in `frontend/` reads from it using the Supabase JavaScript client.

The database is defined entirely in version-controlled files, so anyone can recreate it:

```
supabase/
├── config.toml   Supabase CLI configuration
├── migrations/   SQL files that create and change tables, applied in timestamp order
└── seed.sql      Emergency guidance and contacts data
```

## Data model

| Table             | Contents                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| `emergency_types` | Emergency categories shown on the home screen (Fire, Medical Emergencies, …)    |
| `guidance_steps`  | Ordered step-by-step instructions for each emergency type                       |
| `contacts`        | Emergency phone contacts for the Charles River (CRC) and Medical (MED) campuses |

All tables use Row Level Security with a public read-only policy: the app can read content without
signing in, but cannot modify it. Content changes are made through migrations/seed files or the Supabase
dashboard.

## Content source

Guidance and contacts come from the official BU EHS
[Emergency Instructions](https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf) sheet.
Every row stores its `source_url`. See the header of `seed.sql` for the small wording adaptations made for mobile.

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
