create table if not exists public.aerea_academic_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{"customProfessors":[]}'::jsonb,
  client_updated_at bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.aerea_academic_profile enable row level security;

drop policy if exists "aerea_academic_profile_select_own" on public.aerea_academic_profile;
drop policy if exists "aerea_academic_profile_insert_own" on public.aerea_academic_profile;
drop policy if exists "aerea_academic_profile_update_own" on public.aerea_academic_profile;
drop policy if exists "aerea_academic_profile_delete_own" on public.aerea_academic_profile;

create policy "aerea_academic_profile_select_own"
on public.aerea_academic_profile
for select
to authenticated
using (auth.uid() = user_id);

create policy "aerea_academic_profile_insert_own"
on public.aerea_academic_profile
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "aerea_academic_profile_update_own"
on public.aerea_academic_profile
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "aerea_academic_profile_delete_own"
on public.aerea_academic_profile
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.aerea_academic_profile to authenticated;
revoke all on public.aerea_academic_profile from anon;
