insert into storage.buckets (id, name, public, file_size_limit)
values ('aerea-library', 'aerea-library', false, 52428800)
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit;

create policy "owner reads private library files" on storage.objects
for select to authenticated
using (
  bucket_id = 'aerea-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);

create policy "owner uploads private library files" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'aerea-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);

create policy "owner updates private library files" on storage.objects
for update to authenticated
using (
  bucket_id = 'aerea-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
)
with check (
  bucket_id = 'aerea-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);

create policy "owner deletes private library files" on storage.objects
for delete to authenticated
using (
  bucket_id = 'aerea-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(auth.jwt() ->> 'email') = 'aereaary@gmail.com'
);
