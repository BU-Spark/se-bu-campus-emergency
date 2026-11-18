-- Preserve the source classification for building 649 in data/aed-list.csv.
-- Coordinates are not verified. Preserve any existing coordinates on update.
alter table public.buildings drop constraint buildings_campus_check;
alter table public.buildings add constraint buildings_campus_check
  check (campus in ('CRC', 'FEN', 'MED', 'Non BU'));

insert into public.buildings (id, name, address, campus)
values ('649', '677 Beacon Street', '677 Beacon Street', 'Non BU')
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  campus = excluded.campus;

insert into public.aeds (id, building_id, floor, room, location_note, sort_order)
values ('649-01-180', '649', '01', '180', 'Main lobby', 1)
on conflict (id) do update set
  building_id = excluded.building_id,
  floor = excluded.floor,
  room = excluded.room,
  location_note = excluded.location_note,
  sort_order = excluded.sort_order;
