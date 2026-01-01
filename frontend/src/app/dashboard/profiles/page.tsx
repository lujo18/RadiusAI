
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useProfiles } from '@/lib/api/hooks';
import CreateProfileDialog from '@/components/Profiles/CreateProfileDialog';
import EditProfileDialog from '@/components/Profiles/EditProfileDialog';
import ProfileCard from '@/components/Profiles/ProfileCard';

export default function ProfilesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  
  const { data: profiles, isLoading } = useProfiles();

  const editingProfile = profiles?.find(p => p.id === editingProfileId);

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
'use client';

import React from "react";
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useProfiles } from '@/lib/api/hooks';
import CreateProfileDialog from '@/components/Profiles/CreateProfileDialog';
import EditProfileDialog from '@/components/Profiles/EditProfileDialog';
import ProfileCard from '@/components/Profiles/ProfileCard';

export default function ProfilesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  
  const { data: profiles, isLoading } = useProfiles();

  const editingProfile = profiles?.find(p => p.id === editingProfileId);

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Brand Profiles</h1>
            <p className="text-gray-400">
              Manage your brand identities and social media integrations
            </p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 bg-kinetic-mint hover:bg-kinetic-mint/80 text-obsidian px-6 py-3 rounded-lg font-medium transition"
          >
            <FiPlus className="text-xl" />
            Create Profile
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : profiles && profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onEdit={(id) => setEditingProfileId(id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState onCreateClick={() => setShowCreateDialog(true)} />
        )}
      </div>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateProfileDialog onClose={() => setShowCreateDialog(false)} />
      )}
      
        <EditProfileDialog
          profile={editingProfile}
          onClose={() => setEditingProfileId(null)}
        />
      )}
    </div>
  );
}

function ProfileCardSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
          <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-700 rounded"></div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-700 rounded-full w-20"></div>
        <div className="h-6 bg-gray-700 rounded-full w-20"></div>
      </div>
      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <div className="flex-1">
          <div className="h-3 bg-gray-700 rounded w-16 mb-1"></div>
          <div className="h-5 bg-gray-700 rounded w-8"></div>
        </div>
        <div className="flex-1">
          <div className="h-3 bg-gray-700 rounded w-16 mb-1"></div>
          <div className="h-5 bg-gray-700 rounded w-8"></div>

        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
        <FiPlus className="text-3xl text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No profiles yet</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Create your first brand profile to start generating content tailored to your unique voice and style.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 bg-kinetic-mint hover:bg-kinetic-mint/80 text-obsidian px-6 py-3 rounded-lg font-medium transition"
      >
        <FiPlus className="text-xl" />
        Create Your First Profile
      </button>
    </div>
  );
}
