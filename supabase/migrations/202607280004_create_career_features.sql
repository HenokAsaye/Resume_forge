create table public.jobs (
    id uuid primary key,
    user_id uuid not null references public.profiles (id) on delete cascade,
    title text not null check (char_length(trim(title)) between 1 and 200),
    company text not null default '',
    raw_text text not null check (char_length(trim(raw_text)) > 0),
    url text,
    parsed_json jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index jobs_user_created_at_idx
on public.jobs (user_id, created_at desc);

alter table public.jobs enable row level security;

create policy "Users manage their own jobs"
on public.jobs for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute procedure public.set_updated_at();

alter table public.resume_versions
add constraint resume_versions_source_job_fk
foreign key (source_job_id) references public.jobs (id) on delete set null;

create type public.ats_analysis_stage as enum ('original', 'optimized');

create table public.ats_reports (
    id uuid primary key,
    user_id uuid not null references public.profiles (id) on delete cascade,
    resume_id uuid not null references public.resumes (id) on delete cascade,
    job_id uuid not null references public.jobs (id) on delete cascade,
    resume_version_id uuid references public.resume_versions (id) on delete set null,
    analysis_stage public.ats_analysis_stage not null default 'original',
    match_score numeric(5, 2) not null check (
        match_score >= 0 and match_score <= 100
    ),
    missing_keywords jsonb not null default '[]'::jsonb,
    suggestions jsonb not null default '[]'::jsonb,
    strengths jsonb not null default '[]'::jsonb,
    weaknesses jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index ats_reports_user_created_at_idx
on public.ats_reports (user_id, created_at desc);

alter table public.ats_reports enable row level security;

create policy "Users manage their own ATS reports"
on public.ats_reports for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table public.cover_letters (
    id uuid primary key,
    user_id uuid not null references public.profiles (id) on delete cascade,
    resume_id uuid not null references public.resumes (id) on delete cascade,
    job_id uuid not null references public.jobs (id) on delete cascade,
    resume_version_id uuid references public.resume_versions (id) on delete set null,
    content text not null check (char_length(trim(content)) > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index cover_letters_user_created_at_idx
on public.cover_letters (user_id, created_at desc);

alter table public.cover_letters enable row level security;

create policy "Users manage their own cover letters"
on public.cover_letters for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger cover_letters_set_updated_at
before update on public.cover_letters
for each row execute procedure public.set_updated_at();
