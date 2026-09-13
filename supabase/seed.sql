-- Demo data for Foothold. Run after 001_foothold_schema.sql in the Supabase SQL editor.
-- Demo login passwords are all: DemoPass123!

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.user@foothold.test', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"user","full_name":"Maya Naidoo"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.company@foothold.test', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"company","full_name":"Ari Jacobs","org_name":"Northstar Works","org_description":"A small product studio building tools for modern hiring teams."}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.company2@foothold.test', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"company","full_name":"Leah Mokoena","org_name":"Brightline Energy","org_description":"Regional solar installer focused on training new technicians."}', now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, role, full_name) values
  ('11111111-1111-1111-1111-111111111111', 'user', 'Maya Naidoo'),
  ('22222222-2222-2222-2222-222222222222', 'company', 'Ari Jacobs'),
  ('33333333-3333-3333-3333-333333333333', 'company', 'Leah Mokoena')
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;

insert into public.companies (id, org_name, description, is_verified, website) values
  ('22222222-2222-2222-2222-222222222222', 'Northstar Works', 'A small product studio building tools for modern hiring teams.', true, 'https://example.com'),
  ('33333333-3333-3333-3333-333333333333', 'Brightline Energy', 'Regional solar installer focused on training new technicians.', false, null)
on conflict (id) do update set org_name = excluded.org_name, description = excluded.description, is_verified = excluded.is_verified, website = excluded.website;

insert into public.listings (id, company_id, title, description, category_id, location, employment_type, salary_range, status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', 'Frontend Engineer, Marketplace Tools', 'Build polished React interfaces for scheduling, application tracking, and company dashboards. You will work across design systems, Supabase data flows, and high-trust user journeys where clarity matters.', (select id from public.categories where slug = 'engineering'), 'Remote, South Africa', 'full-time', 'R720k - R980k', 'open'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 'Brand Designer for Opportunity Platform', 'Create visual systems, listing templates, and campaign assets for a growing services marketplace. Strong typography, restraint, and product thinking are more important than trend-chasing.', (select id from public.categories where slug = 'design'), 'Cape Town Hybrid', 'contract', 'R45k - R65k / month', 'open'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '33333333-3333-3333-3333-333333333333', 'Solar Installation Apprentice', 'Join a field team installing residential solar systems. Ideal for someone reliable, practical, and ready to learn electrical safety, site prep, and customer handover basics.', (select id from public.categories where slug = 'skilled-trade'), 'Durban', 'full-time', 'R12k - R18k / month', 'open')
on conflict (id) do update set title = excluded.title, description = excluded.description, location = excluded.location, employment_type = excluded.employment_type, salary_range = excluded.salary_range, status = excluded.status;

insert into public.applications (id, listing_id, user_id, cover_letter_text, status, feedback_message) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'I have shipped React dashboards with Supabase and care deeply about clear user feedback.', 'accepted', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', 'I am reliable, practical, and excited to learn field installation work.', 'pending', null)
on conflict (listing_id, user_id) do update set cover_letter_text = excluded.cover_letter_text, status = excluded.status, feedback_message = excluded.feedback_message;

insert into public.interviews (application_id, scheduled_at, location_or_link, notes) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', now() + interval '3 days', 'Google Meet link to be shared', 'Bring one project you are proud of walking through.')
on conflict (application_id) do update set scheduled_at = excluded.scheduled_at, location_or_link = excluded.location_or_link, notes = excluded.notes;