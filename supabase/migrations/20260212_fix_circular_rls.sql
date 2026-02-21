-- Comprehensive fix: Break circular RLS policy references
-- Problem: teams policy checks team_members, team_members checks teams = infinite recursion
-- Solution: Use only table ownership checks, no cross-table RLS dependencies

-- ============================================================================
-- DROP ALL TEAM AND TEAM_MEMBERS POLICIES
-- ============================================================================

-- Teams
DROP POLICY IF EXISTS teams_select ON teams;
DROP POLICY IF EXISTS teams_insert ON teams;
DROP POLICY IF EXISTS teams_update ON teams;
DROP POLICY IF EXISTS teams_delete ON teams;

-- Team Members
DROP POLICY IF EXISTS team_members_select ON team_members;
DROP POLICY IF EXISTS team_members_insert ON team_members;
DROP POLICY IF EXISTS team_members_update ON team_members;
DROP POLICY IF EXISTS team_members_delete ON team_members;

-- ============================================================================
-- RECREATE POLICIES WITHOUT CIRCULAR REFERENCES
-- ============================================================================

-- TEAMS TABLE: Simple ownership check only (no team_members reference)
CREATE POLICY teams_select ON teams FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY teams_insert ON teams FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY teams_update ON teams FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY teams_delete ON teams FOR DELETE
USING (owner_id = auth.uid());

-- ============================================================================
-- TEAM_MEMBERS TABLE: Simple checks only (no recursive team_members check)
-- ============================================================================

-- SELECT: User can see team members if they are the team owner OR if it's their own record
CREATE POLICY team_members_select ON team_members FOR SELECT
USING (
  -- Team owner can see all members of their team
  EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND t.owner_id = auth.uid()
  )
  OR
  -- User can always see their own membership record
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
