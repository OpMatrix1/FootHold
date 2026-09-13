create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'company');
create type public.listing_status as enum ('open', 'closed');
create type public.application_status as enum ('pending', 'accepted', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key references public.profiles(id) on delete cascade,
  org_name text not null,
  description text,
  logo_url text,
  is_verified boolean not null default false,
  website text
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text not null
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text not null,
  category_id uuid references public.categories(id),
  location text not null,
  employment_type text not null check (employment_type in ('full-time', 'part-time', 'contract', 'freelance')),
  salary_range text,
  status public.listing_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  cv_url text,
  cover_letter_url text,
  cover_letter_text text,
  status public.application_status not null default 'pending',
  feedback_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  scheduled_at timestamptz not null,
  location_or_link text not null,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_touch_updated_at
before update on public.applications
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'user')::public.user_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  if coalesce(new.raw_user_meta_data->>'role', 'user') = 'company' then
    insert into public.companies (id, org_name, description, is_verified)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'org_name', 'New organization'),
      new.raw_user_meta_data->>'org_description',
      false
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.categories (name, slug, icon) values
  ('Design', 'design', 'palette'),
  ('Engineering', 'engineering', 'code-2'),
  ('Marketing', 'marketing', 'megaphone'),
  ('Customer Support', 'customer-support', 'headphones'),
  ('Skilled Trade', 'skilled-trade', 'hammer'),
  ('Operations', 'operations', 'workflow')
on conflict (slug) do nothing;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.applications enable row level security;
alter table public.interviews enable row level security;

create policy "profiles read authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "companies read authenticated" on public.companies for select to authenticated using (true);
create policy "companies update own" on public.companies for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "categories read authenticated" on public.categories for select to authenticated using (true);

create policy "listings read authenticated" on public.listings for select to authenticated using (true);
create policy "listings insert owning company" on public.listings for insert to authenticated
with check (company_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'company'));
create policy "listings update owning company" on public.listings for update to authenticated
using (company_id = auth.uid()) with check (company_id = auth.uid());
create policy "listings delete owning company" on public.listings for delete to authenticated using (company_id = auth.uid());

create policy "applications insert own user" on public.applications for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'user'));
create policy "applications read own or owning company" on public.applications for select to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.listings where listings.id = applications.listing_id and listings.company_id = auth.uid())
);
create policy "applications update owning company" on public.applications for update to authenticated
using (exists (select 1 from public.listings where listings.id = applications.listing_id and listings.company_id = auth.uid()))
with check (exists (select 1 from public.listings where listings.id = applications.listing_id and listings.company_id = auth.uid()));

create policy "interviews read participant" on public.interviews for select to authenticated
using (
  exists (
    select 1 from public.applications
    join public.listings on listings.id = applications.listing_id
    where applications.id = interviews.application_id
    and (applications.user_id = auth.uid() or listings.company_id = auth.uid())
  )
);
create policy "interviews insert owning company accepted" on public.interviews for insert to authenticated
with check (
  exists (
    select 1 from public.applications
    join public.listings on listings.id = applications.listing_id
    where applications.id = interviews.application_id
    and applications.status = 'accepted'
    and listings.company_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public) values ('application-documents', 'application-documents', false)
on conflict (id) do nothing;

create policy "users upload own application documents" on storage.objects for insert to authenticated
with check (bucket_id = 'application-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users read own application documents" on storage.objects for select to authenticated
using (bucket_id = 'application-documents' and (storage.foldername(name))[1] = auth.uid()::text);
