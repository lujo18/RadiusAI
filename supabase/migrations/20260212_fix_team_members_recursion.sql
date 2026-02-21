-- Fix infinite recursion in team_members RLS policy
-- The previous migration had self-referential policies that caused recursion
-- New approach: Only check team ownership, not team_members membership in RLS

-- Drop all problematic team_members policies
DROP POLICY IF EXISTS team_members_select ON team_members;
DROP POLICY IF EXISTS team_members_insert ON team_members;
DROP POLICY IF EXISTS team_members_update ON team_members;
DROP POLICY IF EXISTS team_members_delete ON team_members;

-- ============================================================================
-- NEW TEAM_MEMBERS POLICIES - NO SELF-REFERENCE
-- ============================================================================

-- SELECT: User can see team members if they are the team owner OR if it's their own record
CREATE POLICY team_members_select ON team_members FOR SELECT
USING (
  -- Team owner can see all members
  EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND t.owner_id = auth.uid()
  )
  OR
  -- User can see their own record
  user_id = auth.uid()
);

-- INSERT: Only team owner can add members
CREATE POLICY team_members_insert ON team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND t.owner_id = auth.uid()
  )
);

-- UPDATE: Only team owner can update members
CREATE POLICY team_members_update ON team_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND t.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND t.owner_id = auth.uid()
  )
);

-- DELETE: Only team owner can remove members
CREATE POLICY team_members_delete ON team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND t.owner_id = auth.uid()
  )
);
