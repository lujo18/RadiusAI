import { useAuthStore } from '@/store/authStore';
import { PLANS, toPlanKey, withinLimit, formatLimit, type PlanKey } from '@/lib/plans';

export function usePlanLimits() {
  const { user } = useAuthStore();

  const rawPlan = user?.plan || 'starter';
  const planKey: PlanKey = toPlanKey(rawPlan) ?? 'starter';
  const limits = PLANS[planKey].limits;

  const canCreateTemplate = (currentCount: number) => withinLimit(limits.templates, currentCount);
  const canCreatePost = (currentCount: number) => withinLimit(limits.posts, currentCount);
  const canCreateProfile = (currentCount: number) => withinLimit(limits.brands, currentCount);
  const canGenerateAI = (currentCount: number) => withinLimit(limits.aiGenerations, currentCount);

  const getRemainingTemplates = (currentCount: number) =>
    limits.templates === Infinity ? 'unlimited' : Math.max(0, limits.templates - currentCount);

  const getRemainingPosts = (currentCount: number) =>
    limits.posts === Infinity ? 'unlimited' : Math.max(0, limits.posts - currentCount);

  const getRemainingProfiles = (currentCount: number) =>
    limits.brands === Infinity ? 'unlimited' : Math.max(0, limits.brands - currentCount);

  return {
    plan: planKey,
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
