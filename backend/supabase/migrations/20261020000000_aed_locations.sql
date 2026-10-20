-- AED (defibrillator) locations, grouped by BU building.
--
-- Data comes from the BU AED list spreadsheet (backend/supabase/data/aed-list.csv) and is loaded by
-- seeds/aeds.sql, which scripts/generate-aed-seed.mjs generates from that CSV.

-- BU buildings that contain at least one AED. More building data (e.g. coordinates) can be added later.
create table public.buildings (
  id          text primary key,          -- BU building code from the AED list, e.g. '501'
  name        text not null,             -- display name, e.g. 'Fitness and Recreation Center'
  address     text not null,             -- street address, e.g. '915 Commonwealth Avenue'
  campus      text not null check (campus in ('CRC', 'FEN', 'MED')),  -- Charles River, Fenway, Medical
  latitude    double precision,          -- filled in later for location-based building detection
  longitude   double precision,
  created_at  timestamptz not null default now()
);

-- Individual AEDs inside a building.
create table public.aeds (
  id             text primary key,       -- '<building>-<floor>-<room>', e.g. '501-01-111'
  building_id    text not null references public.buildings (id) on delete cascade,
  floor          text not null,          -- as written in the source list, e.g. '01', 'L1', 'B'
  room           text not null,          -- nearest room number, e.g. '111'
  location_note  text not null,          -- where to find it, e.g. 'Outside of gym near stairwell 2'
  sort_order     integer not null,
  created_at     timestamptz not null default now()
);

create index aeds_building_id_idx on public.aeds (building_id);

grant select on public.buildings, public.aeds to anon, authenticated;

alter table public.buildings enable row level security;
alter table public.aeds      enable row level security;

create policy "Buildings are publicly readable"
  on public.buildings for select
  to anon, authenticated
  using (true);

create policy "AEDs are publicly readable"
  on public.aeds for select
  to anon, authenticated
  using (true);
