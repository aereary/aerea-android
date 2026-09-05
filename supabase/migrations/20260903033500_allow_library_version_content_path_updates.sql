create or replace function public.block_library_item_version_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE'
    and (to_jsonb(new) - 'content_object_path')
      = (to_jsonb(old) - 'content_object_path')
  then
    return new;
  end if;

  raise exception 'LIBRARY_ITEM_VERSIONS_ARE_IMMUTABLE';
end;
$$;

comment on function public.block_library_item_version_mutation() is
  'Keeps library history immutable except for attaching the private content object path to an existing SHA version.';
