/**
 * Team Types - TypeScript types for team-related data
 */

export interface TeamMember {
  id: string
  user_id: string | null
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'pending' | 'invited' | 'removed'
  invited_at: string | null
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface TeamDetail extends Team {
  member_count: number
  members: TeamMember[]
}

export interface TeamEvent {
  id: string
  team_id: string
  actor_id: string | null
  event_type: string
  payload: Record<string, any> | null
  created_at: string
}

// Request/Response types
export interface CreateTeamRequest {
  name: string
  slug: string
  description?: string
}

export interface UpdateTeamRequest {
  name?: string
  slug?: string
  description?: string
  avatar_url?: string
}

export interface InviteTeamMemberRequest {
  email: string
  role?: 'admin' | 'member' | 'viewer'
}

export interface UpdateTeamMemberRequest {
  role: 'admin' | 'member' | 'viewer'
}
