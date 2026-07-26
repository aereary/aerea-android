create table if not exists public.aerea_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  client_updated_at bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.aerea_sync enable row level security;

revoke all on table public.aerea_sync from anon;
grant select, insert, update, delete on table public.aerea_sync to authenticated;

create policy "aerea owner can read" on public.aerea_sync
for select to authenticated
using (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);

create policy "aerea owner can insert" on public.aerea_sync
for insert to authenticated
with check (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);

create policy "aerea owner can update" on public.aerea_sync
for update to authenticated
using (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
)
with check (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);

create policy "aerea owner can delete" on public.aerea_sync
for delete to authenticated
using (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);
