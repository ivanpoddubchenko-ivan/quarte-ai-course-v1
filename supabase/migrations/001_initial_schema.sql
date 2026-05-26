-- ══════════════════════════════════════════════
-- AI Course Platform — Initial Schema
-- ══════════════════════════════════════════════

-- Users table (mirrors auth.users, enriched with role)
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  avatar_url  text,
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now()
);

-- Lecture progress
create table if not exists public.progress (
  id          bigserial primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  lecture_id  int  not null,              -- matches lecture.id in course.json (1–59)
  done_at     timestamptz not null default now(),
  unique (user_id, lecture_id)
);

-- Quiz attempts (one row per attempt; keep best or latest — frontend decides)
create table if not exists public.quiz_attempts (
  id          bigserial primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  module_id   int  not null,              -- 0–9
  score       int  not null,
  total       int  not null,
  attempted_at timestamptz not null default now()
);

-- File submissions for flagged practical tasks
create table if not exists public.submissions (
  id              bigserial primary key,
  user_id         uuid not null references public.users(id) on delete cascade,
  lecture_id      int  not null,
  step_index      int,                    -- null = whole task, 0-based otherwise
  file_url        text,                   -- Supabase Storage path
  file_name       text,
  figma_url       text,                   -- alternative: Figma share link
  comment         text,
  reviewed        boolean not null default false,
  submitted_at    timestamptz not null default now(),
  reviewed_at     timestamptz
);

-- ── Helper: admin check (SECURITY DEFINER bypasses RLS to avoid infinite recursion) ──
-- Must be defined BEFORE RLS policies that reference it.
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.users where id = auth.uid() and role = 'admin')
$$;

-- ── Row Level Security ───────────────────────────────────

alter table public.users         enable row level security;
alter table public.progress      enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.submissions   enable row level security;

-- users: students read/update their own row; admins read all
create policy "users_self_read"   on public.users for select using (auth.uid() = id);
create policy "users_self_insert" on public.users for insert with check (auth.uid() = id);
create policy "users_self_update" on public.users for update using (auth.uid() = id);
create policy "users_admin_read"  on public.users for select using (public.is_admin());

-- progress: own rows + admins
create policy "progress_self"  on public.progress for all using (auth.uid() = user_id);
create policy "progress_admin" on public.progress for select using (public.is_admin());

-- quiz_attempts: own rows + admins
create policy "quiz_self"  on public.quiz_attempts for all using (auth.uid() = user_id);
create policy "quiz_admin" on public.quiz_attempts for select using (public.is_admin());

-- submissions: own rows + admins
create policy "submissions_self"  on public.submissions for all using (auth.uid() = user_id);
create policy "submissions_admin" on public.submissions for all using (public.is_admin());

-- ── Storage bucket ───────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket: "submissions"
-- Settings: private, max file size 20MB
-- Allowed MIME types: image/*, application/pdf, text/html, application/zip

-- ── Trigger: auto-create user row on signup ──────────────
-- Auto-promotes the known admin email; everyone else gets 'student'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    case when new.email = 'ivan.poddubchenko@inveritasoft.com' then 'admin' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
