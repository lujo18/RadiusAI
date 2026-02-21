
"use client";

import React from "react";
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrands } from '@/features/brand/hooks';
import CreateProfileDialog from '@/components/Profiles/CreateProfileDialog';
import EditProfileDialog from '@/components/Profiles/EditProfileDialog';
import ProfileCard from '@/components/Profiles/ProfileCard';

export default function ProfilesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  
  const { data: profiles, isLoading } = useBrands();

  const editingProfile = profiles?.find(p => p.id === editingProfileId);

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-foreground text-3xl font-bold mb-2">Brand Profiles</h1>
            <p className="text-muted-foreground">
              Manage your brand identities and social media integrations
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
          >
            <FiPlus className="text-xl" />
            Create Profile
          </Button>
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
      {editingProfile && (
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-4 pt-4 border-t border">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-8" />
          </div>
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
        <FiPlus className="text-3xl text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No profiles yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Create your first brand profile to start generating content tailored to your unique voice and style.
      </p>
      <Button
        onClick={onCreateClick}
        size="lg"
      >
        <FiPlus className="text-xl" />
        Create Your First Profile
      </Button>
    </div>
  );
}
