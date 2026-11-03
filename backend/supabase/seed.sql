-- Seed data for emergency guidance and contacts.
--
-- Source: BU Environmental Health & Safety "Emergency Instructions"
-- https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf
--
-- Wording follows the source document. Two adaptations were made for mobile:
--   * The sheet's numbered contact references ("call ①", "call ②", "call ③") are written out
--     as the contact's name (Facilities, BU Public Safety (BUPD), ROHP).
--   * Spelling errors in the source ("unkown", "utilites") are corrected.
--
-- The script is idempotent: re-running it updates existing rows instead of failing.

-- ---------------------------------------------------------------------------
-- Emergency types (order matches the Figma dashboard)
-- ---------------------------------------------------------------------------
insert into public.emergency_types (id, name, sort_order, source_url) values
  ('fire',               'Fire',                           1, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('medical',            'Medical Emergencies',            2, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('hazardous-spill',    'Hazardous Materials / Spill',    3, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('violence',           'Violence',                       4, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('suspicious-package', 'Suspicious Package / Bomb Threat', 5, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('utilities',          'Utilities Failure',              6, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('weather',            'Extreme Weather',                7, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf')
on conflict (id) do update set
  name       = excluded.name,
  sort_order = excluded.sort_order,
  source_url = excluded.source_url;

-- ---------------------------------------------------------------------------
-- Guidance steps
-- ---------------------------------------------------------------------------
insert into public.guidance_steps (emergency_type_id, section, step_order, title, body) values
  -- Fire
  ('fire', null, 1, 'Remember R.A.C.E.',  'R.A.C.E. if you detect smoke or fire: Rescue, Alert, Confine, Extinguish.'),
  ('fire', null, 2, 'Rescue',             'Rescue people from scene of fire.'),
  ('fire', null, 3, 'Alert',              'Alert other staff, call 911, then call BU Public Safety (BUPD) to report location and details.'),
  ('fire', null, 4, 'Confine',            'Confine by closing doors and windows.'),
  ('fire', null, 5, 'Extinguish',         'Extinguish only if safe or to escape a large fire. Evacuate building.'),
  ('fire', null, 6, 'Go to rally point',  'Report to department rally point.'),
  ('fire', null, 7, 'Avoid elevators',    'Do NOT use elevators.'),
  ('fire', null, 8, 'Special assistance', 'For special assistance, evacuate to nearest stairwell and notify emergency responders.'),

  -- Medical Emergencies
  ('medical', null, 1, 'Call for help',               'Call BU Public Safety (BUPD) for medical assistance.'),
  ('medical', null, 2, 'Find a defibrillator (AED)',  'Find defibrillators at maps.bu.edu » Campus » Safety » AEDs.'),
  ('medical', null, 3, 'Minor injuries: students',    'Student Health Services: (617) 353-3575, 881 Commonwealth Ave.'),
  ('medical', null, 4, 'Minor injuries: employees',   'Occupational Health Center: (617) 353-6630, 930 Commonwealth Ave., #1200. Employee injury reporting: Conduent (833) 951-2415.'),
  ('medical', null, 5, 'Lab injuries and exposures',  'Report lab-related injuries/exposures by calling ROHP.'),

  -- Hazardous Materials / Spill
  ('hazardous-spill', null, 1, 'Notify and isolate', 'Notify personnel and isolate the area.'),
  ('hazardous-spill', null, 2, 'Contain',            'Contain the spill if safe to do so.'),
  ('hazardous-spill', null, 3, 'Protect drains',     'Protect nearby drains.'),
  ('hazardous-spill', null, 4, 'Report the spill',   'Call Facilities to report the spill.'),
  ('hazardous-spill', null, 5, 'Do not clean up',    'Do not attempt to clean unknown chemicals, large spills, highly hazardous spills, or any spill that could result in adverse exposure.'),

  -- Violence
  ('violence', 'Workplace Violence',                1, 'Secure',              'Secure your area.'),
  ('violence', 'Workplace Violence',                2, 'Alert',               'Alert by calling BU Public Safety (BUPD).'),
  ('violence', 'Workplace Violence',                3, 'Follow',              'Follow directions of emergency responders.'),
  ('violence', 'Workplace Violence',                4, 'Exit',                'Exit when directed.'),
  ('violence', 'Active Shooter: Run, Hide, Fight',  5, 'Run',                 'Escape if possible.'),
  ('violence', 'Active Shooter: Run, Hide, Fight',  6, 'Hide',                'Find place out of sight, lock door, barricade entrance, silence phones.'),
  ('violence', 'Active Shooter: Run, Hide, Fight',  7, 'Fight (last resort)', 'Act aggressively, do not hesitate.'),

  -- Suspicious Package / Bomb Threat
  ('suspicious-package', 'Suspicious Package',     1,  'Do not touch',             'Do not touch or disturb object.'),
  ('suspicious-package', 'Suspicious Package',     2,  'Call BUPD',                'Call BU Public Safety (BUPD). Provide as much information as possible.'),
  ('suspicious-package', 'Suspicious Package',     3,  'Prepare to evacuate',      'Prepare to evacuate.'),
  ('suspicious-package', 'Emailed Bomb Threat',    4,  'Keep the message open',    'Leave the message open on your device and call BU Public Safety (BUPD).'),
  ('suspicious-package', 'Emailed Bomb Threat',    5,  'Save the message',         'Print, screenshot, or copy the message and subject line. Note the date and time.'),
  ('suspicious-package', 'Telephoned Bomb Threat', 6,  'Do not hang up',           'Remain calm and DO NOT HANG UP.'),
  ('suspicious-package', 'Telephoned Bomb Threat', 7,  'Record the conversation',  'Record the conversation.'),
  ('suspicious-package', 'Telephoned Bomb Threat', 8,  'Signal other staff',       'Signal other staff to listen and have them call BU Public Safety (BUPD).'),
  ('suspicious-package', 'Telephoned Bomb Threat', 9,  'Write down details',       'Write down the phone number. Record exact wording of the threat.'),
  ('suspicious-package', 'Telephoned Bomb Threat', 10, 'Gather information',       'Keep caller on the line and gather as much information as possible.'),
  ('suspicious-package', 'Telephoned Bomb Threat', 11, 'Complete the checklist',   'Fill out Bomb Threat Checklist ASAP.'),
  ('suspicious-package', 'Telephoned Bomb Threat', 12, 'Be available',             'Be available for interviews with the building''s emergency response team and law enforcement.'),

  -- Utilities Failure
  ('utilities', null, 1, 'Report the failure', 'Call Facilities to alert of utilities failure.'),
  ('utilities', null, 2, 'Elevator',           'If trapped, call Facilities from telephone.'),
  ('utilities', null, 3, 'Electric',           'Plug essential equipment into red power outlets; unplug all non-essential equipment.'),
  ('utilities', null, 4, 'Water',              'Call Facilities. Alternative water sources will be provided as necessary.'),

  -- Extreme Weather
  ('weather', null, 1, 'Emergency Response Plan',  'Any weather-related event that may affect normal university operations may activate the BU Emergency Response Plan.'),
  ('weather', null, 2, 'Stay informed',            'Check bu.edu, BU Today, BU Alert for information.'),
  ('weather', null, 3, 'Talk to your supervisor',  'Speak to your supervisor about departmental coverage.')
on conflict (emergency_type_id, step_order) do update set
  section = excluded.section,
  title   = excluded.title,
  body    = excluded.body;

-- ---------------------------------------------------------------------------
-- Contacts (CRC = Charles River Campus, MED = Medical Campus)
-- ---------------------------------------------------------------------------
insert into public.contacts (id, name, description, phone, campus, sort_order, source_url) values
  ('911',                 'Emergency (911)',                      'Fire. After calling 911, also call BU Public Safety (BUPD).', '911',          'ALL', 1, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('bupd-crc',            'BU Public Safety (BUPD)',              'Public safety and medical incidents',                       '+16173532121', 'CRC', 2, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('bupd-med',            'BU Public Safety (BUPD)',              'Public safety and medical incidents',                       '+16173584444', 'MED', 3, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('facilities-crc',      'Facilities',                           'Facilities events and hazardous material spills',           '+16173532105', 'CRC', 4, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('facilities-med',      'Facilities',                           'Facilities events and hazardous material spills',           '+16173584144', 'MED', 5, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('rohp',                'ROHP',                                 'Exposures and lab-related incidents',                       '+16173587647', 'ALL', 6, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('student-health',      'Student Health Services',              'Minor injuries (students). 881 Commonwealth Ave.',          '+16173533575', 'CRC', 7, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('occupational-health', 'Occupational Health Center',           'Minor injuries (employees). 930 Commonwealth Ave., #1200',  '+16173536630', 'CRC', 8, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf'),
  ('employee-injury',     'Employee Injury Reporting (Conduent)', 'Report employee injuries',                                  '+18339512415', 'ALL', 9, 'https://www.bu.edu/ehs/files/2020/04/EHS-emergency-instructions-final.pdf')
on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  phone       = excluded.phone,
  campus      = excluded.campus,
  sort_order  = excluded.sort_order,
  source_url  = excluded.source_url;
