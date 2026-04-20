"use client";

import React, { Suspense } from "react";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useDashboardStore, useAuthStore } from '@/store';
import { useBrandFilter } from '@/hooks/useBrandFilter';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiActivity, FiArrowRight, FiPlus, FiCheckCircle, FiX } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardingModal from '@/components/OnboardingModal';
import { supabase } from '@/lib/supabase/client';
import { OverviewPageComponent } from "@/components/pages/OverviewPageComponent";

function OverviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGenerating = useDashboardStore((state) => state.isGenerating);
  const stats = useDashboardStore((state) => state.stats);
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const { activeBrandId, isOverview } = useBrandFilter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    // Restore session after Stripe redirect if needed
    const restoreSession = async () => {
      const sessionId = searchParams.get('session_id');
      
      // If coming from Stripe, ensure session is restored
      if (sessionId && !user) {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          const restoredUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            plan: 'growth' as const,
          };
          login(restoredUser, session.user, session);
        } else if (error || !session) {
          // Session invalid, redirect to login
          router.push('/');
          return;
        }
      }
    };
    
    restoreSession();
    
    // Check if user just completed payment
    const sessionId = searchParams.get('session_id');
    const onboarding = searchParams.get('onboarding');
    
    if (sessionId) {
      // Show success banner
      setShowSuccessBanner(true);
      
      // Auto-hide banner after 5 seconds
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
    
    if (onboarding === 'true') {
      // Show onboarding modal
      setShowOnboarding(true);
    }
  }, [searchParams]);

 

  
  return (
    <OverviewPageComponent brandId={activeBrandId}/>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OverviewPageContent />
    </Suspense>
  );
}
