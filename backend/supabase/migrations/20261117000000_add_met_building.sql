-- Source: https://www.bu.edu/met/contact/
-- Application ID, not a verified BU facilities code. No AED location or coordinate is inferred.
-- Also maintained in additional-buildings.json so seed regeneration preserves this building.
insert into public.buildings (id, name, address, campus)
values ('met-1010-commonwealth', 'Metropolitan College (MET)', '1010 Commonwealth Avenue', 'CRC')
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  campus = excluded.campus;
