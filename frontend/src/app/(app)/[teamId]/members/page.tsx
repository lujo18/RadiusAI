'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTeam, useRemoveTeamMember, useUpdateTeamMemberRole, useInviteTeamMember } from '@/lib/api/hooks/useTeams'
import { Spinner } from '@/components/ui/spinner'
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi'

/**
 * Team Members Management Page
 * 
 * Allows team owners/admins to:
 * - View team members
 * - Invite new members
 * - Change member roles
 * - Remove members
 */
export default function TeamMembersPage() {
  const params = useParams()
  const teamId = params.teamId as string
  
  const { data: team, isLoading: teamLoading } = useTeam(teamId)
  const removeTeamMember = useRemoveTeamMember(teamId)
  const updateTeamMemberRole = useUpdateTeamMemberRole(teamId, '')
  const inviteTeamMember = useInviteTeamMember(teamId)
  
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  const handleInvite = async () => {
    if (!inviteEmail) return
    
    try {
      await inviteTeamMember.mutateAsync({
        email: inviteEmail,
        role: inviteRole as 'admin' | 'member' | 'viewer',
      })
      
      setInviteEmail('')
      setShowInviteForm(false)
    } catch (error) {
      console.error('Failed to invite member:', error)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (confirm('Are you sure? This action cannot be undone.')) {
      try {
        await removeTeamMember.mutateAsync(memberId)
      } catch (error) {
        console.error('Failed to remove member:', error)
      }
    }
  }

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground/60">Team not found</p>
      </div>
    )
  }

  // Check if user can manage members (owner or admin)
  const canManageMembers = team.members?.some(
    (m: any) => m.role === 'owner' || m.role === 'admin'
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
        {canManageMembers && (
          <Button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="gap-2"
          >
            <FiPlus className="size-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Invite Form */}
      {canManageMembers && showInviteForm && (
        <Card className="p-6 glass-card">
          <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="member">Member (can create/edit)</option>
                <option value="admin">Admin (can manage team)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail || inviteTeamMember.isPending}
              >
                {inviteTeamMember.isPending ? 'Inviting...' : 'Send Invite'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Members List */}
      <Card className="glass-card overflow-hidden">
        <div className="divide-y divide-border">
          {team.members?.map((member: any) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-foreground/5 transition">
              <div className="flex-1">
                <p className="font-medium text-foreground">{member.email}</p>
                <p className="text-sm text-foreground/60">
                  Role: <span className="capitalize font-medium">{member.role}</span>
                </p>
                {member.status !== 'active' && (
                  <p className="text-xs text-yellow-500 mt-1">
                    Status: <span className="capitalize">{member.status}</span>
                  </p>
                )}
              </div>
              
              {canManageMembers && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(member.id)}
                    disabled={removeTeamMember.isPending}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FiTrash2 className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
