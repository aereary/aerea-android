alter table public.library_items
  add column content_object_path text;

alter table public.library_item_versions
  add column content_object_path text;

comment on column public.library_items.content_object_path is
  'Private aerea-drive-library object path for the current readable copy; storage_path remains the Drive source path.';

comment on column public.library_item_versions.content_object_path is
  'Private aerea-drive-library object path for this protected content SHA; storage_path remains the Drive source path.';

alter table public.library_items
  add constraint library_items_content_object_path_shape
  check (
    content_object_path is null
    or content_object_path ~ (
      '^'
      || owner_user_id::text
      || '/current/'
      || id::text
      || '/'
      || sha256
      || '(\.[a-z0-9]{1,12})?$'
    )
  );

alter table public.library_item_versions
  add constraint library_item_versions_content_object_path_shape
  check (
    content_object_path is null
    or content_object_path ~ (
      '^'
      || owner_user_id::text
      || '/current/'
      || library_item_id::text
      || '/'
      || sha256
      || '(\.[a-z0-9]{1,12})?$'
    )
  );
