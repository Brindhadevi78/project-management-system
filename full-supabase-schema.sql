-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ORIGINAL TABLES (Projects & Tasks)
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  status text default 'active' check (status in ('active', 'on_hold', 'completed')),
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee text,
  due_date date,
  created_at timestamptz default now()
);

-- 3. PROFILES TABLE & TRIGGER (For Emails & Names)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for existing users
insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data->>'full_name' from auth.users
on conflict (id) do nothing;


-- 4. TEAMS & MEMBERS TABLES
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now(),
  unique(team_id, user_id)
);


-- 5. TASK COMMENTS TABLE
create table if not exists public.task_comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);


-- 6. ALTER PROJECTS & TASKS FOR COLLABORATION
-- Safely add columns if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='team_id') then
    alter table public.projects add column team_id uuid references public.teams(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='assignee_id') then
    alter table public.tasks add column assignee_id uuid references auth.users(id) on delete set null;
  end if;
end $$;


-- 7. ENABLE ROW LEVEL SECURITY
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.task_comments enable row level security;


-- 8. SECURE HELPER FUNCTION (Fixes Infinite Recursion)
create or replace function get_user_teams(user_id uuid)
returns setof uuid as $$
  select team_id from public.team_members where user_id = $1;
$$ language sql security definer;


-- 9. APPLY CLEAN RLS POLICIES (Drop existing first to be safe)
drop policy if exists "Profiles viewable by everyone" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

drop policy if exists "View teams if owner or member" on public.teams;
drop policy if exists "Create teams" on public.teams;
drop policy if exists "Update teams" on public.teams;
drop policy if exists "Delete teams" on public.teams;

drop policy if exists "View team members" on public.team_members;
drop policy if exists "Manage team members" on public.team_members;
drop policy if exists "Manage team members update" on public.team_members;
drop policy if exists "Manage team members delete" on public.team_members;

drop policy if exists "Users manage own projects" on public.projects;
drop policy if exists "Users manage own projects or team projects" on public.projects;

drop policy if exists "Users manage own tasks" on public.tasks;
drop policy if exists "Users manage own tasks or team tasks" on public.tasks;

drop policy if exists "Manage task comments" on public.task_comments;


-- Profiles
create policy "Profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Teams
create policy "View teams if owner or member" on public.teams for select using (
  auth.uid() = owner_id or id in (select get_user_teams(auth.uid()))
);
create policy "Create teams" on public.teams for insert with check (auth.uid() = owner_id);
create policy "Update teams" on public.teams for update using (auth.uid() = owner_id);
create policy "Delete teams" on public.teams for delete using (auth.uid() = owner_id);

-- Team Members
create policy "View team members" on public.team_members for select using (
  team_id in (select get_user_teams(auth.uid())) OR team_id in (select id from public.teams where owner_id = auth.uid())
);
create policy "Manage team members" on public.team_members for all using (
  team_id in (select id from public.teams where owner_id = auth.uid())
);

-- Projects
create policy "Users manage own projects or team projects" on public.projects for all using (
  auth.uid() = user_id or (team_id is not null and team_id in (select get_user_teams(auth.uid())))
);

-- Tasks
create policy "Users manage own tasks or team tasks" on public.tasks for all using (
  auth.uid() = user_id or exists (
    select 1 from public.projects p where p.id = tasks.project_id and p.team_id is not null and p.team_id in (select get_user_teams(auth.uid()))
  )
);

-- Task Comments
create policy "Manage task comments" on public.task_comments for all using (
  exists (
    select 1 from public.tasks t 
    left join public.projects p on p.id = t.project_id
    where t.id = task_comments.task_id and (
      t.user_id = auth.uid() or (p.team_id is not null and p.team_id in (select get_user_teams(auth.uid())))
    )
  )
);
