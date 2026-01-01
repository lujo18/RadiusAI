import React from "react";
import { useAuthStore } from '@/store/authStore';
import { STRIPE_CONFIG } from '@/lib/stripe/config';

export function usePlanLimits() {
  const { user } = useAuthStore();
  
  const plan = user?.plan || 'starter';
  const limits = STRIPE_CONFIG.plans[plan as keyof typeof STRIPE_CONFIG.plans]?.limits || STRIPE_CONFIG.plans.starter.limits;

  const canCreateTemplate = (currentCount: number) => {
    return currentCount < limits.templates;
  };

  const canCreatePost = (currentCount: number) => {
    return currentCount < limits.posts;
  };

  const canCreateProfile = (currentCount: number) => {
    return currentCount < limits.profiles;
  };

  const canGenerateAI = (currentCount: number) => {
    return currentCount < limits.aiGenerations;
  };

  const getRemainingTemplates = (currentCount: number) => {
    if (limits.templates === Infinity) return 'unlimited';
    return Math.max(0, limits.templates - currentCount);
  };

  const getRemainingPosts = (currentCount: number) => {
    if (limits.posts === Infinity) return 'unlimited';
    return Math.max(0, limits.posts - currentCount);
  };

  const getRemainingProfiles = (currentCount: number) => {
    if (limits.profiles === Infinity) return 'unlimited';
    return Math.max(0, limits.profiles - currentCount);
  };

  return {
    plan,
    limits,
    canCreateTemplate,
    canCreatePost,
    canCreateProfile,
    canGenerateAI,
    getRemainingTemplates,
    getRemainingPosts,
    getRemainingProfiles,
  };
}
