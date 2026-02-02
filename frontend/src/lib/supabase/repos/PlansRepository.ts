import { supabase } from '../client';

type Plan = {
  id: string;
  plan_id: string;
  name: string;
  max_brands: number | null;
  max_posts_per_month: number | null;
  max_slides_per_month: number | null;
  ai_credits?: number | null;
};
type PlanInsert = Omit<Plan, 'id'>;
type PlanUpdate = Partial<PlanInsert>;

// Note: Plans table is not yet implemented in the database
// These methods are stubs and will fail until the table is created
export class PlansRepository {
  static async getPlans(): Promise<Plan[]> {
    // TODO: Implement when plans table is created
    console.warn('PlansRepository.getPlans() not yet implemented');
    return [];
  }

  static async getPlan(planId: string): Promise<Plan | null> {
    // TODO: Implement when plans table is created
    console.warn('PlansRepository.getPlan() not yet implemented');
    return null;
  }

  static async createPlan(plan: PlanInsert): Promise<Plan> {
    // TODO: Implement when plans table is created
    throw new Error('PlansRepository.createPlan() not yet implemented');
  }

  static async updatePlan(planId: string, updates: PlanUpdate): Promise<Plan> {
    // TODO: Implement when plans table is created
    throw new Error('PlansRepository.updatePlan() not yet implemented');
  }

  static async deletePlan(planId: string): Promise<boolean> {
    // TODO: Implement when plans table is created
    throw new Error('PlansRepository.deletePlan() not yet implemented');
  }
}
