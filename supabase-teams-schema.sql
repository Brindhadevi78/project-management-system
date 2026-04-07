-- 1. Create a public profiles table matched to auth.users (so users can search for emails to invite)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text
);

-- Trigger to automatically create a profile when a new user signs up
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

-- Insert existing users into profiles (to backfill your existing accounts)
insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data->>'full_name' from auth.users
on conflict (id) do nothing;

-- 2. Teams Table
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 3. Team Members Table
create table public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now(),
  unique(team_id, user_id)
);

-- 4. Alter Projects and Tasks
alter table public.projects add column if not exists team_id uuid references public.teams(id) on delete cascade;

-- Add assignee_id to tasks instead of just assignee text
alter table public.tasks add column if not exists assignee_id uuid references auth.users(id) on delete set null;

-- 5. Task Comments
create table public.task_comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- 6. Row Level Security Updates
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.task_comments enable row level security;

-- Profiles: Anyone can read profiles (required so team admins can resolve emails to user IDs)
create policy "Profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Teams RLS
create policy "View teams if owner or member" on public.teams for select using (
  auth.uid() = owner_id or exists (select 1 from public.team_members where team_id = teams.id and user_id = auth.uid())
);
create policy "Create teams" on public.teams for insert with check (auth.uid() = owner_id);
create policy "Update teams" on public.teams for update using (auth.uid() = owner_id);
create policy "Delete teams" on public.teams for delete using (auth.uid() = owner_id);

-- Team Members RLS
create policy "View team members" on public.team_members for select using (
  exists (select 1 from public.teams t where t.id = team_members.team_id and (t.owner_id = auth.uid() or exists (select 1 from public.team_members tm where tm.team_id = t.id and tm.user_id = auth.uid())))
);
create policy "Manage team members" on public.team_members for all using (
  exists (select 1 from public.teams t where t.id = team_members.team_id and t.owner_id = auth.uid())
);

-- Update Projects policies to include team access
drop policy if exists "Users manage own projects" on public.projects;
create policy "Users manage own projects or team projects" on public.projects for all using (
  auth.uid() = user_id or 
  (team_id is not null and exists (select 1 from public.team_members where team_id = projects.team_id and user_id = auth.uid()))
);

-- Update Tasks policies
drop policy if exists "Users manage own tasks" on public.tasks;
create policy "Users manage own tasks or team tasks" on public.tasks for all using (
  auth.uid() = user_id or 
  exists (
    select 1 from public.projects p 
    where p.id = tasks.project_id and p.team_id is not null and exists (
      select 1 from public.team_members tm where tm.team_id = p.team_id and tm.user_id = auth.uid()
    )
  )
);

-- Task Comments RLS
create policy "Manage task comments" on public.task_comments for all using (
  exists (
    select 1 from public.tasks t 
    left join public.projects p on p.id = t.project_id
    where t.id = task_comments.task_id and (
      t.user_id = auth.uid() or
      (p.team_id is not null and exists (select 1 from public.team_members tm where tm.team_id = p.team_id and tm.user_id = auth.uid()))
    )
  )
);
