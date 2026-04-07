-- Projects table
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  status text default 'active' check (status in ('active', 'on_hold', 'completed')),
  created_at timestamptz default now()
);

-- Tasks table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee text,
  due_date date,
  created_at timestamptz default now()
);

-- Row Level Security
alter table projects enable row level security;
alter table tasks enable row level security;

create policy "Users manage own projects" on projects
  for all using (auth.uid() = user_id);

create policy "Users manage own tasks" on tasks
  for all using (auth.uid() = user_id);
