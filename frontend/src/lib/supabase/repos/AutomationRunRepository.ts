import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type AutomationRunRow = Database['public']['Tables']['automation_runs']['Row'];
type AutomationRunInsert = Database['public']['Tables']['automation_runs']['Insert'];

const TABLE = 'automation_runs';

export class AutomationRunRepository {
  table = TABLE;

  async listByAutomation(automationId: string, limit: number = 50): Promise<AutomationRunRow[]> {
    const { data, error } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('automation_id', automationId)
      .order('run_started_at', { ascending: false })
      .limit(limit);

    if (error) {
      const errorMsg = error.message || JSON.stringify(error);
      console.error('[AutomationRunRepository.listByAutomation]', errorMsg, error);
      throw new Error(`Failed to list automation runs: ${errorMsg}`);
    }
    return data as AutomationRunRow[];
  }

  async listByBrand(brandId: string, limit: number = 100): Promise<AutomationRunRow[]> {
    // First get automations for this brand, then get runs for those automations
    const { data: automations, error: automationError } = await supabase
      .from('automations')
      .select('id')
      .eq('brand_id', brandId);

    if (automationError) {
      throw automationError;
    }

    if (!automations || automations.length === 0) {
      return [];
    }

    const automationIds = automations.map((a) => a.id);

    const { data, error } = await supabase
      .from('automation_runs')
      .select('*')
      .in('automation_id', automationIds)
      .order('run_started_at', { ascending: false })
      .limit(limit);

    if (error) {
      const errorMsg = error.message || JSON.stringify(error);
      console.error('[AutomationRunRepository.listByBrand]', errorMsg, error);
      throw new Error(`Failed to list automation runs: ${errorMsg}`);
    }
    return data as AutomationRunRow[];
  }

  async getById(id: string): Promise<AutomationRunRow | null> {
    const { data, error } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
    return data as AutomationRunRow;
  }

  async getLatestForAutomation(automationId: string): Promise<AutomationRunRow | null> {
    const { data, error } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('automation_id', automationId)
      .order('run_started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
    return data as AutomationRunRow;
  }

  async listByStatus(
    automationId: string,
    status: 'success' | 'failed',
    limit: number = 50
  ): Promise<AutomationRunRow[]> {
    const { data, error } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('automation_id', automationId)
      .eq('status', status)
      .order('run_started_at', { ascending: false })
      .limit(limit);

    if (error) {
      const errorMsg = error.message || JSON.stringify(error);
      console.error('[AutomationRunRepository.listByStatus]', errorMsg, error);
      throw new Error(`Failed to list automation runs by status: ${errorMsg}`);
    }
    return data as AutomationRunRow[];
  }

  async getSuccessRate(automationId: string, days: number = 7): Promise<{
    total: number;
    successes: number;
    failures: number;
    rate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('automation_runs')
      .select('status')
      .eq('automation_id', automationId)
      .gte('run_started_at', startDate.toISOString());

    if (error) {
      throw error;
    }

    const runs = data as Array<{ status: string }>;
    const total = runs.length;
    const successes = runs.filter((r) => r.status === 'success').length;
    const failures = runs.filter((r) => r.status === 'failed').length;
    const rate = total === 0 ? 0 : Math.round((successes / total) * 100);

    return { total, successes, failures, rate };
  }
}

export const automationRunRepository = new AutomationRunRepository();
