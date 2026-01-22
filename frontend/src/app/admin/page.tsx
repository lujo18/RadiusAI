"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/lib/api/hooks/useUser";

export default function AdminPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useUserProfile();

  useEffect(() => {
    if (!isLoading && (!profile || !profile.is_admin)) {
      router.replace("/");
    }
  }, [isLoading, profile, router]);

  if (isLoading || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="text-foreground/60">Checking admin access…</div>
      </div>
    );
  }

  if (!profile.is_admin) return null;

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-8">Admin Dashboard</h1>
      <div className="bg-card/50 glass-card border border-border rounded-xl p-8 shadow-lg">
        <p className="text-foreground/80 mb-4">Welcome to the admin panel. Add admin tools here.</p>
        {/* Add admin controls, stats, or management UI here */}
      </div>
    </div>
  );
}
