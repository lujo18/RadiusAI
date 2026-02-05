import { automationRunService } from '@/lib/api/services/automationRunService';
import type { Database } from '@/types/database';

type AutomationRunRow = Database['public']['Tables']['automation_runs']['Row'];

export const automationRunApi = {
  list: async (automationId: string, limit?: number): Promise<AutomationRunRow[]> => {
    return automationRunService.getAutomationRuns(automationId, limit);
  },

  listByBrand: async (brandId: string, limit?: number): Promise<AutomationRunRow[]> => {
    return automationRunService.getAutomationRunsByBrand(brandId, limit);
  },

  get: async (id: string): Promise<AutomationRunRow | null> => {
    return automationRunService.getAutomationRun(id);
  },

  getLatest: async (automationId: string): Promise<AutomationRunRow | null> => {
    return automationRunService.getLatestRun(automationId);
  },

  listSuccessful: async (automationId: string, limit?: number): Promise<AutomationRunRow[]> => {
    return automationRunService.getSuccessfulRuns(automationId, limit);
  },

  listFailed: async (automationId: string, limit?: number): Promise<AutomationRunRow[]> => {
    return automationRunService.getFailedRuns(automationId, limit);
  },

  getSuccessRate: async (
    automationId: string,
    days?: number
  ): Promise<{ total: number; successes: number; failures: number; rate: number }> => {
    return automationRunService.getSuccessRate(automationId, days);
  },
};
