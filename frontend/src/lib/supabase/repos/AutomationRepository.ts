import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type AutomationRow = Database['public']['Tables']['automations']['Row'];
type AutomationInsert = Database['public']['Tables']['automations']['Insert'];
type AutomationUpdate = Database['public']['Tables']['automations']['Update'];

const TABLE = 'automations';

export class AutomationRepository {
  table = TABLE;

  async list(brandId: string): Promise<AutomationRow[]> {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) {
      const errorMsg = error.message || JSON.stringify(error);
      console.error('[AutomationRepository.list]', errorMsg, error);
      throw new Error(`Failed to list automations: ${errorMsg}`);
    }
    return data as AutomationRow[];
  }

  async getById(id: string): Promise<AutomationRow | null> {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
    return data as AutomationRow;
  }

  async create(payload: AutomationInsert): Promise<AutomationRow> {
    const { data, error } = await supabase
      .from('automations')
      .insert(payload)
      .select('*');

    if (error) {
      const errorMsg = error.message || error.details || JSON.stringify(error);
      console.error('[AutomationRepository.create]', errorMsg, error);
      throw new Error(`Failed to create automation: ${errorMsg}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create automation: no data returned');
    }

    return data[0] as AutomationRow;
  }

  async update(id: string, updates: AutomationUpdate): Promise<AutomationRow> {
    const { data, error } = await supabase
      .from('automations')
      .update(updates)
      .eq('id', id)
      .select('*');

    if (error) {
      const errorMsg = error.message || error.details || JSON.stringify(error);
      console.error(`[AutomationRepository.update] ${id}:`, errorMsg, error);
      throw new Error(`Failed to update automation: ${errorMsg}`);
    }

    if (!data || data.length === 0) {
      throw new Error(`Automation with id ${id} not found`);
    }

    return data[0] as AutomationRow;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('automations').delete().eq('id', id);

    if (error) {
      const errorMsg = error.message || JSON.stringify(error);
      console.error(`[AutomationRepository.delete] ${id}:`, errorMsg, error);
      throw new Error(`Failed to delete automation: ${errorMsg}`);
    }

    return true;
  }

  async toggleActive(id: string, isActive: boolean): Promise<AutomationRow> {
    return this.update(id, { is_active: isActive } as AutomationUpdate);
  }

  async updateSchedule(id: string, schedule: Record<string, string[]>): Promise<AutomationRow> {
    return this.update(id, { schedule } as AutomationUpdate);
  }

  async updateNextRun(id: string, nextRunAt: string): Promise<AutomationRow> {
    return this.update(id, { next_run_at: nextRunAt } as AutomationUpdate);
  }
}

export const automationRepository = new AutomationRepository();
