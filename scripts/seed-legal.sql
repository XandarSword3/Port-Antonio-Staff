-- Run this in the Supabase SQL editor for your project
-- It upserts Privacy, Terms, Accessibility into public.legal_pages

-- PRIVACY
insert into public.legal_pages as lp (type, title, sections)
values (
  'privacy',
  'Privacy Policy',
  '[
    {"id":"intro","order":1,"title":"Introduction","content":"<PASTE REAL INTRO TEXT HERE>"},
    {"id":"data","order":2,"title":"Data We Collect","content":"<PASTE REAL DATA TEXT HERE>"}
  ]'::jsonb
)
on conflict (type) do update
set title = excluded.title,
    sections = excluded.sections;

-- TERMS
insert into public.legal_pages as lp (type, title, sections)
values (
  'terms',
  'Terms of Service',
  '[
    {"id":"accept","order":1,"title":"Acceptance","content":"<PASTE REAL ACCEPTANCE TEXT HERE>"},
    {"id":"use","order":2,"title":"Use of Service","content":"<PASTE REAL USE TEXT HERE>"}
  ]'::jsonb
)
on conflict (type) do update
set title = excluded.title,
    sections = excluded.sections;

-- ACCESSIBILITY
insert into public.legal_pages as lp (type, title, sections)
values (
  'accessibility',
  'Accessibility Statement',
  '[
    {"id":"commit","order":1,"title":"Our Commitment","content":"<PASTE REAL COMMITMENT TEXT HERE>"},
    {"id":"features","order":2,"title":"Accessibility Features","content":"<PASTE REAL FEATURES TEXT HERE>"}
  ]'::jsonb
)
on conflict (type) do update
set title = excluded.title,
    sections = excluded.sections;

-- Verify
select type, title, jsonb_array_length(sections) as section_count
from public.legal_pages
where type in ('privacy','terms','accessibility')
order by type;


