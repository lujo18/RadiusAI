import { automationService } from '@/lib/api/services/automationService';
import type { Database } from '@/types/database';

type AutomationRow = Database['public']['Tables']['automations']['Row'];
type AutomationInsert = Database['public']['Tables']['automations']['Insert'];
type AutomationUpdate = Database['public']['Tables']['automations']['Update'];

export const automationApi = {
  list: async (brandId: string): Promise<AutomationRow[]> => {
    return automationService.getAutomations(brandId);
  },

  get: async (id: string): Promise<AutomationRow | null> => {
    return automationService.getAutomation(id);
  },

  create: async (brandId: string, payload: Omit<AutomationInsert, 'brand_id'>) => {
    return automationService.createAutomation(brandId, payload);
  },

  update: async (id: string, updates: AutomationUpdate): Promise<AutomationRow> => {
    return automationService.updateAutomation(id, updates);
  },

  delete: async (id: string): Promise<boolean> => {
    return automationService.deleteAutomation(id);
  },

  toggleActive: async (id: string, isActive: boolean): Promise<AutomationRow> => {
    return automationService.toggleActive(id, isActive);
  },

  updateSchedule: async (id: string, schedule: Record<string, string[]>): Promise<AutomationRow> => {
    return automationService.updateSchedule(id, schedule);
  },

  updateNextRun: async (id: string, nextRunAt: string): Promise<AutomationRow> => {
    return automationService.updateNextRun(id, nextRunAt);
  },

  /** Convenience method: toggle active state based on current state */
  toggleActiveStatus: async (automation: AutomationRow): Promise<AutomationRow> => {
    return automationApi.toggleActive(automation.id, !automation.is_active);
  },
};
