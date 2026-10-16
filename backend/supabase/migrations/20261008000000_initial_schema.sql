-- Initial schema: emergency categories, step-by-step guidance, and emergency contacts.
--
-- All content is public, read-only reference information. The app's roles (anon, authenticated)
-- are granted SELECT only, and Row Level Security allows them to read every row. Writes are only
-- possible with the service role key, which is never shipped in the mobile app.

-- Emergency categories shown on the home screen (e.g. Fire, Medical Emergencies).
create table public.emergency_types (
  id          text primary key,          -- URL-safe slug used in app routes, e.g. 'fire'
  name        text not null,
  sort_order  integer not null,
  source_url  text not null,             -- official BU document the guidance is taken from
  created_at  timestamptz not null default now()
);

-- Ordered instructions for each emergency category.
create table public.guidance_steps (
  id                 bigint generated always as identity primary key,
  emergency_type_id  text not null references public.emergency_types (id) on delete cascade,
  section            text,               -- optional sub-heading, e.g. 'Active Shooter: Run, Hide, Fight'
  step_order         integer not null,
  title              text not null,      -- short action shown when the step is collapsed
  body               text not null,      -- full instruction shown when the step is expanded
  created_at         timestamptz not null default now(),
  unique (emergency_type_id, step_order)
);

create index guidance_steps_emergency_type_id_idx on public.guidance_steps (emergency_type_id);

-- Phone contacts for the contacts screen and "Call for Help".
create table public.contacts (
  id           text primary key,         -- slug, e.g. 'bupd-crc'
  name         text not null,
  description  text not null,
  phone        text not null,            -- dialable number, e.g. '+16173532121' or '911'
  campus       text not null check (campus in ('CRC', 'MED', 'ALL')),
  sort_order   integer not null,
  source_url   text not null,
  created_at   timestamptz not null default now()
);

-- Expose the tables to the Data API as read-only. Explicit grants are needed because the project
-- does not automatically grant privileges on new tables.
grant select on public.emergency_types, public.guidance_steps, public.contacts to anon, authenticated;

-- Row Level Security: public read access only.
alter table public.emergency_types enable row level security;
alter table public.guidance_steps  enable row level security;
alter table public.contacts        enable row level security;

create policy "Emergency types are publicly readable"
  on public.emergency_types for select
  to anon, authenticated
  using (true);

create policy "Guidance steps are publicly readable"
  on public.guidance_steps for select
  to anon, authenticated
  using (true);

create policy "Contacts are publicly readable"
  on public.contacts for select
  to anon, authenticated
  using (true);
