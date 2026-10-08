# Backend

The backend is a [Supabase](https://supabase.com) project (Postgres database and auto-generated API).
The mobile app in `frontend/` reads from it using the Supabase JavaScript client.

The database is defined entirely in version-controlled files, so anyone can recreate it:

```
supabase/
└── migrations/   SQL files that create and change tables, applied in order
```

## Planned data

| Table             | Contents                                                         |
| ----------------- | ---------------------------------------------------------------- |
| `emergency_types` | Emergency categories shown on the home screen (Fire, Medical, …) |
| `guidance_steps`  | Ordered step-by-step instructions for each emergency type        |
| `contacts`        | Emergency contacts (BUPD, Student Health Services, …)            |

Content is sourced from the official BU EHS emergency instructions, not written from scratch.

Setup instructions will be added once the Supabase project is created.
