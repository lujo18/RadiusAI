import { supabase } from '../client';
import type { Database } from '@/types/database';

type Plan = Database['public']['Tables']['plans']['Row'];
type PlanInsert = Database['public']['Tables']['plans']['Insert'];
type PlanUpdate = Database['public']['Tables']['plans']['Update'];

export class PlansRepository {
  static async getPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('plan_id', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getPlan(planId: string): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('plan_id', planId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  static async createPlan(plan: PlanInsert): Promise<Plan> {
    const { data, error } = await supabase
      .from('plans')
      .insert([plan])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updatePlan(planId: string, updates: PlanUpdate): Promise<Plan> {
    const { data, error } = await supabase
      .from('plans')
      .update(updates)
      .eq('plan_id', planId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deletePlan(planId: string): Promise<boolean> {
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('plan_id', planId);
    if (error) throw new Error(error.message);
    return true;
  }
}
