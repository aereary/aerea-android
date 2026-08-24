create extension if not exists pgcrypto;

create table if not exists public.sports (
  id text primary key,
  name text not null,
  card_label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id text primary key,
  sport_id text not null references public.sports(id),
  provider text not null,
  provider_external_id text not null,
  name text not null,
  short_name text not null,
  primary_color text not null,
  secondary_color text not null,
  icon text not null default '',
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (provider, provider_external_id)
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id),
  provider text not null,
  provider_external_id text not null,
  name text not null,
  country text,
  updated_at timestamptz not null default now(),
  unique (provider, provider_external_id)
);

create table if not exists public.sports_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_external_id text not null,
  sport_id text not null references public.sports(id),
  competition_id uuid references public.competitions(id),
  team_id text not null references public.teams(id),
  season text,
  opponent text not null,
  home_away text not null check (home_away in ('home', 'away', 'neutral')),
  starts_at timestamptz not null,
  venue text,
  status text not null check (status in ('scheduled', 'postponed', 'cancelled', 'live', 'finished')),
  home_score integer,
  away_score integer,
  provider_payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (provider, provider_external_id, team_id)
);

create index if not exists sports_events_team_starts_idx
  on public.sports_events (team_id, starts_at);

create table if not exists public.user_followed_teams (
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  notifications_enabled boolean not null default false,
  notification_lead_minutes integer not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, team_id)
);

insert into public.sports (id, name, card_label)
values ('football', 'Football', 'MATCH DAY')
on conflict (id) do update
set name = excluded.name, card_label = excluded.card_label;

insert into public.teams (
  id, sport_id, provider, provider_external_id, name, short_name,
  primary_color, secondary_color, icon
)
values (
  'boca-juniors', 'football', 'api-football', '451', 'Boca Juniors', 'Boca',
  '#0b2f78', '#f6cf2f', '💙💛'
)
on conflict (id) do update
set sport_id = excluded.sport_id,
    provider = excluded.provider,
    provider_external_id = excluded.provider_external_id,
    name = excluded.name,
    short_name = excluded.short_name,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    icon = excluded.icon,
    updated_at = now();

alter table public.sports enable row level security;
alter table public.teams enable row level security;
alter table public.competitions enable row level security;
alter table public.sports_events enable row level security;
alter table public.user_followed_teams enable row level security;

revoke all on public.sports, public.teams, public.competitions,
  public.sports_events, public.user_followed_teams from anon;
grant select on public.sports, public.teams, public.competitions,
  public.sports_events to authenticated;
grant select, insert, update, delete on public.user_followed_teams to authenticated;

create policy "private account reads sports" on public.sports
for select to authenticated
using (lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com');

create policy "private account reads teams" on public.teams
for select to authenticated
using (lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com');

create policy "private account reads competitions" on public.competitions
for select to authenticated
using (lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com');

create policy "private account reads fixtures" on public.sports_events
for select to authenticated
using (lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com');

create policy "owner reads followed teams" on public.user_followed_teams
for select to authenticated
using (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);

create policy "owner follows teams" on public.user_followed_teams
for insert to authenticated
with check (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);

create policy "owner updates followed teams" on public.user_followed_teams
for update to authenticated
using (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
)
with check (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);

create policy "owner unfollows teams" on public.user_followed_teams
for delete to authenticated
using (
  auth.uid() = user_id
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);
