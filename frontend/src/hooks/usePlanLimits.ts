import React from "react";
import { useAuthStore } from '@/store/authStore';

const DEFAULT_PLAN_CONFIG = {
  plans: {
    starter: { limits: { templates: 10, posts: 50, profiles: 1, aiGenerations: 100 } },
    growth: { limits: { templates: 50, posts: 500, profiles: 5, aiGenerations: 1000 } },
    unlimited: { limits: { templates: Infinity, posts: Infinity, profiles: Infinity, aiGenerations: Infinity } },
  }
};

export function usePlanLimits() {
  const { user } = useAuthStore();

  const plan = user?.plan || 'starter';
  const limits = (DEFAULT_PLAN_CONFIG as any).plans[plan]?.limits || (DEFAULT_PLAN_CONFIG as any).plans.starter.limits;

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
