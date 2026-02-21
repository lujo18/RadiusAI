-- Aggressive RLS fix: Disable and rebuild cleanly
-- Drop ALL RLS policies on team_members to fix infinite recursion

-- First, disable RLS on team_members temporarily
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Drop all policies (even if already dropped)
DROP POLICY IF EXISTS team_members_select ON team_members;
DROP POLICY IF EXISTS team_members_insert ON team_members;
DROP POLICY IF EXISTS team_members_update ON team_members;
DROP POLICY IF EXISTS team_members_delete ON team_members;

-- Re-enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE NEW SIMPLE NON-RECURSIVE POLICIES (MINIMAL LOGIC)
-- ============================================================================

-- SELECT: Only allow users to see their own membership record
-- This is the simplest possible policy with no recursion
CREATE POLICY team_members_select ON team_members FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Only team owner can add members (check via teams table only)
CREATE POLICY team_members_insert ON team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.owner_id = auth.uid()
  )
);

-- UPDATE: Only team owner can update members
CREATE POLICY team_members_update ON team_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.owner_id = auth.uid()
  )
);

-- DELETE: Only team owner can remove members
CREATE POLICY team_members_delete ON team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.owner_id = auth.uid()
  )
);

-- Also ensure teams table has simple policies
DROP POLICY IF EXISTS teams_select ON teams;
DROP POLICY IF EXISTS teams_insert ON teams;
DROP POLICY IF EXISTS teams_update ON teams;
DROP POLICY IF EXISTS teams_delete ON teams;

-- Teams: Simple ownership check only
CREATE POLICY teams_select ON teams FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY teams_insert ON teams FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY teams_update ON teams FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY teams_delete ON teams FOR DELETE
USING (owner_id = auth.uid());
