-- Links contacts to the emergencies and guidance steps they belong to, so the app can show only the
-- relevant numbers (e.g. "Call for Help" on the Fire screen) and put call buttons inside each step.

-- Street address for contacts people may need to visit, e.g. Student Health Services.
alter table public.contacts add column address text;

-- In-app screen a step can open, e.g. '/aeds' for the "Find an AED" screen.
alter table public.guidance_steps add column link text;

-- Contacts shown by "Call for Help" for each emergency type.
create table public.emergency_contacts (
  emergency_type_id  text not null references public.emergency_types (id) on delete cascade,
  contact_id         text not null references public.contacts (id) on delete cascade,
  primary key (emergency_type_id, contact_id)
);

-- Contacts a guidance step tells the user to call, shown as call buttons inside that step.
create table public.guidance_step_contacts (
  emergency_type_id  text not null,
  step_order         integer not null,
  contact_id         text not null references public.contacts (id) on delete cascade,
  sort_order         integer not null,
  primary key (emergency_type_id, step_order, contact_id),
  foreign key (emergency_type_id, step_order)
    references public.guidance_steps (emergency_type_id, step_order) on delete cascade on update cascade
);

grant select on public.emergency_contacts, public.guidance_step_contacts to anon, authenticated;

alter table public.emergency_contacts     enable row level security;
alter table public.guidance_step_contacts enable row level security;

create policy "Emergency contacts are publicly readable"
  on public.emergency_contacts for select
  to anon, authenticated
  using (true);

create policy "Guidance step contacts are publicly readable"
  on public.guidance_step_contacts for select
  to anon, authenticated
  using (true);
