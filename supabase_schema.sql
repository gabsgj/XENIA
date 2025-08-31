-- XENIA Supabase schema
create extension if not exists vector;

-- Users are managed by Supabase Auth, we maintain profile/gamification
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  xp integer default 0 not null,
  level integer default 1 not null,
  streak_days integer default 0 not null,
  last_active_date date,
  created_at timestamp with time zone default now()
);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  artifact_type text check (artifact_type in ('syllabus','assessment')) not null,
  filename text not null,
  storage_path text not null,
  mime_type text,
  extracted_text text,
  embedding vector(768),
  created_at timestamp with time zone default now()
);

create table if not exists plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan jsonb not null,
  updated_at timestamp with time zone default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  topic text,
  duration_min integer,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  topic text,
  status text default 'todo' check (status in ('todo','doing','done')),
  due_date date,
  created_at timestamp with time zone default now()
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,
  earned_at timestamp with time zone default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists manual_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete set null,
  topic text not null,
  tag text not null,
  created_at timestamp with time zone default now()
);

create table if not exists parents_children (
  parent_user_id uuid references auth.users(id) on delete cascade,
  child_user_id uuid references auth.users(id) on delete cascade,
  primary key (parent_user_id, child_user_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  payload jsonb not null,
  created_at timestamp with time zone default now()
);

-- XP function and trigger for level/streak
create or replace function add_xp(p_user_id uuid, p_xp int)
returns void language plpgsql as $$
begin
  update profiles set xp = xp + p_xp where user_id = p_user_id;
  perform recompute_profile(p_user_id);
end;
$$;

create or replace function recompute_profile(p_user_id uuid)
returns void language plpgsql as $$
declare
  v_xp int;
  v_level int := 1;
  v_needed int;
  v_remaining int;
  v_today date := now()::date;
  v_last date;
begin
  select xp, last_active_date into v_xp, v_last from profiles where user_id = p_user_id;
  if v_xp is null then
    return;
  end if;

  -- streak logic
  if v_last is null or v_last < v_today then
    if v_last = v_today - 1 then
      update profiles set streak_days = streak_days + 1, last_active_date = v_today where user_id = p_user_id;
    else
      update profiles set streak_days = 1, last_active_date = v_today where user_id = p_user_id;
    end if;
  end if;

  v_remaining := v_xp;
  loop
    v_needed := (100 * power(v_level::numeric, 1.25))::int;
    exit when v_remaining < v_needed;
    v_remaining := v_remaining - v_needed;
    v_level := v_level + 1;
  end loop;
  update profiles set level = v_level where user_id = p_user_id;
end;
$$;

-- RLS
alter table profiles enable row level security;
alter table artifacts enable row level security;
alter table plans enable row level security;
alter table sessions enable row level security;
alter table tasks enable row level security;
alter table achievements enable row level security;
alter table enrollments enable row level security;
alter table manual_tags enable row level security;
alter table parents_children enable row level security;
alter table reports enable row level security;

-- Policies (simplified)
create policy profiles_self on profiles for select using (auth.uid() = user_id);
create policy profiles_self_ins on profiles for insert with check (auth.uid() = user_id);
create policy profiles_self_upd on profiles for update using (auth.uid() = user_id);

create policy artifacts_self on artifacts for select using (auth.uid() = user_id);
create policy artifacts_self_ins on artifacts for insert with check (auth.uid() = user_id);

create policy plans_self on plans for select using (auth.uid() = user_id);
create policy plans_self_upd on plans for insert with check (auth.uid() = user_id);

create policy sessions_self on sessions for select using (auth.uid() = user_id);
create policy sessions_self_ins on sessions for insert with check (auth.uid() = user_id);

create policy tasks_self on tasks for select using (auth.uid() = user_id);
create policy tasks_self_ins on tasks for insert with check (auth.uid() = user_id);
create policy tasks_self_upd on tasks for update using (auth.uid() = user_id);

-- Parent/teacher policies can be added per app roles in a production deployment





















-- -- XENIA Supabase schema
-- create extension if not exists vector;

-- -- Users are managed by Supabase Auth, we maintain profile/gamification
-- create table if not exists profiles (
--   user_id uuid primary key references auth.users(id) on delete cascade,
--   display_name text,
--   xp integer default 0 not null,
--   level integer default 1 not null,
--   streak_days integer default 0 not null,
--   last_active_date date,
--   created_at timestamp with time zone default now()
-- );

-- create table if not exists artifacts (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid references auth.users(id) on delete cascade,
--   artifact_type text check (artifact_type in ('syllabus','assessment')) not null,
--   filename text not null,
--   storage_path text not null,
--   mime_type text,
--   extracted_text text,
--   embedding vector(768),
--   created_at timestamp with time zone default now()
-- );

-- create table if not exists plans (
--   user_id uuid primary key references auth.users(id) on delete cascade,
--   plan jsonb not null,
--   updated_at timestamp with time zone default now()
-- );

-- create table if not exists sessions (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid references auth.users(id) on delete cascade,
--   topic text,
--   duration_min integer,
--   notes text,
--   created_at timestamp with time zone default now()
-- );

-- create table if not exists tasks (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid references auth.users(id) on delete cascade,
--   topic text,
--   status text default 'todo' check (status in ('todo','doing','done')),
--   due_date date,
--   created_at timestamp with time zone default now()
-- );

-- create table if not exists achievements (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid references auth.users(id) on delete cascade,
--   key text not null,
--   earned_at timestamp with time zone default now()
-- );

-- create table if not exists enrollments (
--   id uuid primary key default gen_random_uuid(),
--   class_id uuid not null,
--   user_id uuid references auth.users(id) on delete cascade,
--   created_at timestamp with time zone default now()
-- );

-- create table if not exists manual_tags (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid references auth.users(id) on delete cascade,
--   teacher_id uuid references auth.users(id) on delete set null,
--   topic text not null,
--   tag text not null,
--   created_at timestamp with time zone default now()
-- );

-- create table if not exists parents_children (
--   parent_user_id uuid references auth.users(id) on delete cascade,
--   child_user_id uuid references auth.users(id) on delete cascade,
--   primary key (parent_user_id, child_user_id)
-- );

-- create table if not exists reports (
--   id uuid primary key default gen_random_uuid(),
--   class_id uuid not null,
--   payload jsonb not null,
--   created_at timestamp with time zone default now()
-- );

-- -- XP function and trigger for level/streak
-- create or replace function add_xp(p_user_id uuid, p_xp int)
-- returns void language plpgsql as $$
-- begin
--   update profiles set xp = xp + p_xp where user_id = p_user_id;
--   perform recompute_profile(p_user_id);
-- end;
-- $$;

-- create or replace function recompute_profile(p_user_id uuid)
-- returns void language plpgsql as $$
-- declare
--   v_xp int;
--   v_level int := 1;
--   v_needed int;
--   v_remaining int;
--   v_today date := now()::date;
--   v_last date;
-- begin
--   select xp, last_active_date into v_xp, v_last from profiles where user_id = p_user_id;
--   if v_xp is null then
--     return;
--   end if;

--   -- streak logic
--   if v_last is null or v_last < v_today then
--     if v_last = v_today - 1 then
--       update profiles set streak_days = streak_days + 1, last_active_date = v_today where user_id = p_user_id;
--     else
--       update profiles set streak_days = 1, last_active_date = v_today where user_id = p_user_id;
--     end if;
--   end if;

--   v_remaining := v_xp;
--   loop
--     v_needed := (100 * power(v_level::numeric, 1.25))::int;
--     exit when v_remaining < v_needed;
--     v_remaining := v_remaining - v_needed;
--     v_level := v_level + 1;
--   end loop;
--   update profiles set level = v_level where user_id = p_user_id;
-- end;
-- $$;

-- -- RLS
-- alter table profiles enable row level security;
-- alter table artifacts enable row level security;
-- alter table plans enable row level security;
-- alter table sessions enable row level security;
-- alter table tasks enable row level security;
-- alter table achievements enable row level security;
-- alter table enrollments enable row level security;
-- alter table manual_tags enable row level security;
-- alter table parents_children enable row level security;
-- alter table reports enable row level security;

-- -- Policies (simplified)
-- create policy if not exists profiles_self on profiles for select using (auth.uid() = user_id);
-- create policy if not exists profiles_self_ins on profiles for insert with check (auth.uid() = user_id);
-- create policy if not exists profiles_self_upd on profiles for update using (auth.uid() = user_id);

-- create policy if not exists artifacts_self on artifacts for select using (auth.uid() = user_id);
-- create policy if not exists artifacts_self_ins on artifacts for insert with check (auth.uid() = user_id);

-- create policy if not exists plans_self on plans for select using (auth.uid() = user_id);
-- create policy if not exists plans_self_upd on plans for insert with check (auth.uid() = user_id);

-- create policy if not exists sessions_self on sessions for select using (auth.uid() = user_id);
-- create policy if not exists sessions_self_ins on sessions for insert with check (auth.uid() = user_id);

-- create policy if not exists tasks_self on tasks for select using (auth.uid() = user_id);
-- create policy if not exists tasks_self_ins on tasks for insert with check (auth.uid() = user_id);
-- create policy if not exists tasks_self_upd on tasks for update using (auth.uid() = user_id);

-- -- Parent/teacher policies can be added per app roles in a production deployment













-- -- -- XENIA Supabase schema
-- -- create extension if not exists vector;

-- -- -- Users are managed by Supabase Auth, we maintain profile/gamification
-- -- create table if not exists profiles (
-- --   user_id uuid primary key references auth.users(id) on delete cascade,
-- --   display_name text,
-- --   xp integer default 0 not null,
-- --   level integer default 1 not null,
-- --   streak_days integer default 0 not null,
-- --   last_active_date date,
-- --   created_at timestamp with time zone default now()
-- -- );

-- -- create table if not exists artifacts (
-- --   id uuid primary key default gen_random_uuid(),
-- --   user_id uuid references auth.users(id) on delete cascade,
-- --   artifact_type text check (artifact_type in ('syllabus','assessment')) not null,
-- --   filename text not null,
-- --   storage_path text not null,
-- --   mime_type text,
-- --   extracted_text text,
-- --   embedding vector(768),
-- --   created_at timestamp with time zone default now()
-- -- );

-- -- create table if not exists plans (
-- --   user_id uuid primary key references auth.users(id) on delete cascade,
-- --   plan jsonb not null,
-- --   updated_at timestamp with time zone default now()
-- -- );

-- -- create table if not exists sessions (
-- --   id uuid primary key default gen_random_uuid(),
-- --   user_id uuid references auth.users(id) on delete cascade,
-- --   topic text,
-- --   duration_min integer,
-- --   notes text,
-- --   created_at timestamp with time zone default now()
-- -- );

-- -- create table if not exists tasks (
-- --   id uuid primary key default gen_random_uuid(),
-- --   user_id uuid references auth.users(id) on delete cascade,
-- --   topic text,
-- --   status text default 'todo' check (status in ('todo','doing','done')),
-- --   due_date date,
-- --   created_at timestamp with time zone default now()
-- -- );

-- -- create table if not exists achievements (
-- --   id uuid primary key default gen_random_uuid(),
-- --   user_id uuid references auth.users(id) on delete cascade,
-- --   key text not null,
-- --   earned_at timestamp with time zone default now()
-- -- );

-- -- create table if not exists enrollments (
-- --   id uuid primary key default gen_random_uuid(),
-- --   class_id uuid not null,
-- --   user_id uuid references auth.users(id) on delete cascade,
-- --   created_at timestamp with time zone default now()
-- -- );

-- -- create table if not exists manual_tags (
-- --   id uuid primary key default gen_random_uuid(),
-- --   user_id uuid references auth.users(id) on delete cascade,
-- --   teacher_id uuid references auth.users(id) on delete set null,
-- --   topic text not null,
-- --   tag text not null,
-- --   created_at timestamp with time zone default now()
-- -- );

-- -- create table if not exists parents_children (
-- --   parent_user_id uuid references auth.users(id) on delete cascade,
-- --   child_user_id uuid references auth.users(id) on delete cascade,
-- --   primary key (parent_user_id, child_user_id)
-- -- );

-- -- create table if not exists reports (
-- --   id uuid primary key default gen_random_uuid(),
-- --   class_id uuid not null,
-- --   payload jsonb not null,
-- --   created_at timestamp with time zone default now()
-- -- );

-- -- -- XP function and trigger for level/streak
-- -- create or replace function add_xp(p_user_id uuid, p_xp int)
-- -- returns void language plpgsql as 1708
-- -- begin
-- --   update profiles set xp = xp + p_xp where user_id = p_user_id;
-- --   perform recompute_profile(p_user_id);
-- -- end;1708;

-- -- create or replace function recompute_profile(p_user_id uuid)
-- -- returns void language plpgsql as 1708
-- -- declare
-- --   v_xp int;
-- --   v_level int := 1;
-- --   v_needed int;
-- --   v_remaining int;
-- --   v_today date := now()::date;
-- --   v_last date;
-- -- begin
-- --   select xp, last_active_date into v_xp, v_last from profiles where user_id = p_user_id;
-- --   if v_xp is null then
-- --     return;
-- --   end if;

-- --   -- streak logic
-- --   if v_last is null or v_last < v_today then
-- --     if v_last = v_today - 1 then
-- --       update profiles set streak_days = streak_days + 1, last_active_date = v_today where user_id = p_user_id;
-- --     else
-- --       update profiles set streak_days = 1, last_active_date = v_today where user_id = p_user_id;
-- --     end if;
-- --   end if;

-- --   v_remaining := v_xp;
-- --   loop
-- --     v_needed := (100 * power(v_level::numeric, 1.25))::int;
-- --     exit when v_remaining < v_needed;
-- --     v_remaining := v_remaining - v_needed;
-- --     v_level := v_level + 1;
-- --   end loop;
-- --   update profiles set level = v_level where user_id = p_user_id;
-- -- end;1708;

-- -- -- RLS
-- -- alter table profiles enable row level security;
-- -- alter table artifacts enable row level security;
-- -- alter table plans enable row level security;
-- -- alter table sessions enable row level security;
-- -- alter table tasks enable row level security;
-- -- alter table achievements enable row level security;
-- -- alter table enrollments enable row level security;
-- -- alter table manual_tags enable row level security;
-- -- alter table parents_children enable row level security;
-- -- alter table reports enable row level security;

-- -- -- Policies (simplified)
-- -- create policy if not exists profiles_self on profiles for select using (auth.uid() = user_id);
-- -- create policy if not exists profiles_self_ins on profiles for insert with check (auth.uid() = user_id);
-- -- create policy if not exists profiles_self_upd on profiles for update using (auth.uid() = user_id);

-- -- create policy if not exists artifacts_self on artifacts for select using (auth.uid() = user_id);
-- -- create policy if not exists artifacts_self_ins on artifacts for insert with check (auth.uid() = user_id);

-- -- create policy if not exists plans_self on plans for select using (auth.uid() = user_id);
-- -- create policy if not exists plans_self_upd on plans for insert with check (auth.uid() = user_id);

-- -- create policy if not exists sessions_self on sessions for select using (auth.uid() = user_id);
-- -- create policy if not exists sessions_self_ins on sessions for insert with check (auth.uid() = user_id);

-- -- create policy if not exists tasks_self on tasks for select using (auth.uid() = user_id);
-- -- create policy if not exists tasks_self_ins on tasks for insert with check (auth.uid() = user_id);
-- -- create policy if not exists tasks_self_upd on tasks for update using (auth.uid() = user_id);

-- -- -- Parent/teacher policies can be added per app roles in a production deployment
