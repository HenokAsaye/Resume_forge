create type public.resume_status as enum (
    'uploaded',
    'processing',
    'parsed',
    'failed'
);

create table public.resumes (
    id uuid primary key,
    user_id uuid not null references public.profiles (id) on delete cascade,
    name text not null check (char_length(name) between 1 and 100),
    storage_bucket text not null default 'resumes',
    storage_path text not null unique,
    original_filename text not null
        check (char_length(original_filename) between 1 and 255),
    mime_type text not null check (
        mime_type in (
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    ),
    size_bytes bigint not null check (size_bytes > 0),
    sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
    status public.resume_status not null default 'uploaded',
    parsed_json jsonb,
    parse_error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint resumes_parse_state_is_consistent check (
        (
            status in ('uploaded', 'processing')
            and parsed_json is null
            and parse_error is null
        )
        or (
            status = 'parsed'
            and parsed_json is not null
            and parse_error is null
        )
        or (
            status = 'failed'
            and parsed_json is null
            and nullif(trim(parse_error), '') is not null
        )
    )
);

create index resumes_user_created_at_idx
on public.resumes (user_id, created_at desc);

create index resumes_user_status_idx
on public.resumes (user_id, status);

alter table public.resumes enable row level security;

create policy "Users can create their own resumes"
on public.resumes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their own resumes"
on public.resumes
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their own resumes"
on public.resumes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own resumes"
on public.resumes
for delete
to authenticated
using ((select auth.uid()) = user_id);

create trigger resumes_set_updated_at
before update on public.resumes
for each row execute procedure public.set_updated_at();

create table public.resume_versions (
    id uuid primary key,
    resume_id uuid not null references public.resumes (id) on delete cascade,
    version_number integer not null check (version_number > 0),
    optimized_json jsonb not null,
    source_job_id uuid,
    diff_json jsonb,
    created_at timestamptz not null default now(),
    unique (resume_id, version_number)
);

create index resume_versions_resume_version_idx
on public.resume_versions (resume_id, version_number desc);

alter table public.resume_versions enable row level security;

create policy "Users can create versions for their own resumes"
on public.resume_versions
for insert
to authenticated
with check (
    exists (
        select 1
        from public.resumes
        where resumes.id = resume_versions.resume_id
          and resumes.user_id = (select auth.uid())
    )
);

create policy "Users can read versions for their own resumes"
on public.resume_versions
for select
to authenticated
using (
    exists (
        select 1
        from public.resumes
        where resumes.id = resume_versions.resume_id
          and resumes.user_id = (select auth.uid())
    )
);
