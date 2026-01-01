import React from "react";
'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { FiLock, FiZap } from 'react-icons/fi';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

interface FeatureLockProps {
  children: ReactNode;
  feature?: string;
  showOverlay?: boolean;
}

/**
 * Wrapper component that locks features behind subscription
 * During development (NEXT_PUBLIC_ENABLE_PAYWALL=false), always renders children
 */
export default function FeatureLock({ 
  children, 
  feature = 'this feature',
  showOverlay = true 
}: FeatureLockProps) {
  const router = useRouter();
  const { isActive, isLoading } = useSubscriptionGuard();

  // Show loading state
  if (isLoading) {
    return <div className="opacity-50">{children}</div>;
  }

  // If subscription is active (or in dev mode), show content
  if (isActive) {
    return <>{children}</>;
  }

  // Locked state
  if (showOverlay) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none blur-sm">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-dark-600/80 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-md text-center">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiLock className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Unlock {feature}</h3>
            <p className="text-gray-400 mb-4">
              Subscribe to access this feature and unlock the full power of ViralStack.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <FiZap className="w-5 h-5" />
              View Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Just hide the content without overlay
  return null;
}
