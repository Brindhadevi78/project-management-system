-- 1. Drop the problematic recursive policies
drop policy if exists "View team members" on public.team_members;
drop policy if exists "Manage team members" on public.team_members;

-- 2. Create a secure helper function to fetch a user's teams without triggering policies
create or replace function get_user_teams(user_id uuid)
returns setof uuid as $$
  select team_id from public.team_members where user_id = $1;
$$ language sql security definer;

-- 3. Recreate the SELECT policy using the helper function to avoid recursion
create policy "View team members" on public.team_members for select using (
  -- User is a member
  team_id in (select get_user_teams(auth.uid()))
  OR 
  -- User is the owner
  team_id in (select id from public.teams where owner_id = auth.uid())
);

-- 4. Recreate the MANAGE policy (only owner can modify members)
create policy "Manage team members" on public.team_members for all using (
  team_id in (select id from public.teams where owner_id = auth.uid())
);
