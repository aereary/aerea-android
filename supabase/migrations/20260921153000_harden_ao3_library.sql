begin;

-- The mobile/web client is read-only. All synchronization writes happen inside
-- authenticated Edge Functions with the service role.
revoke all privileges on table public.ao3_works
  from anon, authenticated;
revoke all privileges on table public.ao3_epub_versions
  from anon, authenticated;
revoke all privileges on table public.ao3_epub_snapshots
  from anon, authenticated;
revoke all privileges on table public.ao3_work_sync_state
  from anon, authenticated;

grant select on table public.ao3_works
  to authenticated;
grant select on table public.ao3_epub_versions
  to authenticated;

drop policy if exists ao3_works_private_insert
  on public.ao3_works;
drop policy if exists ao3_works_private_update
  on public.ao3_works;
drop policy if exists ao3_works_private_delete
  on public.ao3_works;
drop policy if exists ao3_epubs_private_insert
  on public.ao3_epub_versions;
drop policy if exists ao3_epubs_private_update
  on public.ao3_epub_versions;
drop policy if exists ao3_epubs_private_delete
  on public.ao3_epub_versions;

-- Foreign-key checks and maintenance need an index beginning with work_id.
create index if not exists ao3_epub_snapshots_work_id_idx
  on public.ao3_epub_snapshots (work_id);
create index if not exists ao3_work_sync_state_work_id_idx
  on public.ao3_work_sync_state (work_id);

-- The AO3 screen already subscribes to these two tables. Add them only when
-- absent so the migration is safe across environments with schema drift.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and pr.prrelid = 'public.ao3_works'::regclass
  ) then
    alter publication supabase_realtime add table public.ao3_works;
  end if;

  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and pr.prrelid = 'public.ao3_epub_versions'::regclass
  ) then
    alter publication supabase_realtime add table public.ao3_epub_versions;
  end if;
end
$$;

commit;
