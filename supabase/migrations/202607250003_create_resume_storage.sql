insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update
set public = false;

create policy "Users can upload files to their own resume folder"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can download files from their own resume folder"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete files from their own resume folder"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);
