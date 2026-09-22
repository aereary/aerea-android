create table if not exists public.aerea_drive_sync_signal (
  singleton boolean primary key default true check (singleton),
  active boolean not null default false,
  channel_id text,
  channel_token_hash text,
  resource_id text,
  channel_expires_at timestamptz,
  pending boolean not null default false,
  generation bigint not null default 0 check (generation >= 0),
  last_message_number text,
  last_resource_state text,
  last_notification_at timestamptz,
  last_claimed_at timestamptz,
  last_completed_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now(),
  constraint aerea_drive_sync_signal_channel_id_length
    check (channel_id is null or length(channel_id) between 1 and 64),
  constraint aerea_drive_sync_signal_token_hash_format
    check (
      channel_token_hash is null
      or channel_token_hash ~ '^[a-f0-9]{64}$'
    )
);

alter table public.aerea_drive_sync_signal enable row level security;

revoke all privileges on table public.aerea_drive_sync_signal from public;
revoke all privileges on table public.aerea_drive_sync_signal from anon;
revoke all privileges on table public.aerea_drive_sync_signal from authenticated;

grant select, insert, update on table public.aerea_drive_sync_signal to service_role;

comment on table public.aerea_drive_sync_signal is
  'Private singleton used by the Drive webhook and Apps Script sync worker.';

create or replace function public.aerea_mark_drive_sync_pending(
  p_channel_id text,
  p_token_hash text,
  p_resource_id text,
  p_message_number text,
  p_resource_state text
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_generation bigint;
begin
  update public.aerea_drive_sync_signal
  set
    pending = true,
    generation = generation + 1,
    resource_id = coalesce(resource_id, nullif(p_resource_id, '')),
    last_message_number = nullif(p_message_number, ''),
    last_resource_state = nullif(p_resource_state, ''),
    last_notification_at = now(),
    updated_at = now()
  where singleton = true
    and active = true
    and channel_id = p_channel_id
    and channel_token_hash = p_token_hash
    and (
      resource_id is null
      or resource_id = nullif(p_resource_id, '')
    )
    and (
      channel_expires_at is null
      or channel_expires_at > now() - interval '5 minutes'
    )
  returning generation into next_generation;

  return next_generation;
end;
$$;

revoke all on function public.aerea_mark_drive_sync_pending(
  text,
  text,
  text,
  text,
  text
) from public;
revoke all on function public.aerea_mark_drive_sync_pending(
  text,
  text,
  text,
  text,
  text
) from anon;
revoke all on function public.aerea_mark_drive_sync_pending(
  text,
  text,
  text,
  text,
  text
) from authenticated;
grant execute on function public.aerea_mark_drive_sync_pending(
  text,
  text,
  text,
  text,
  text
) to service_role;
