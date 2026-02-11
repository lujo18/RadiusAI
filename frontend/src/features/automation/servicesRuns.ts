import { automationRunRepository } from '@/lib/supabase/repos/AutomationRunRepository';
import type { Database } from '@/types/database';

type AutomationRunRow = Database['public']['Tables']['automation_runs']['Row'];

export const automationRunService = {
  async getAutomationRuns(automationId: string, limit: number = 50): Promise<AutomationRunRow[]> {
    try {
      return await automationRunRepository.listByAutomation(automationId, limit);
    } catch (error) {
      console.error('[automationRunService.getAutomationRuns]', error);
      throw error;
    }
  },

  async getAutomationRunsByBrand(brandId: string, limit: number = 100): Promise<AutomationRunRow[]> {
    try {
      return await automationRunRepository.listByBrand(brandId, limit);
    } catch (error) {
      console.error('[automationRunService.getAutomationRunsByBrand]', error);
      throw error;
    }
  },

  async getAutomationRun(id: string): Promise<AutomationRunRow | null> {
    try {
      return await automationRunRepository.getById(id);
    } catch (error) {
      console.error('[automationRunService.getAutomationRun]', error);
      throw error;
    }
  },

  async getLatestRun(automationId: string): Promise<AutomationRunRow | null> {
    try {
      return await automationRunRepository.getLatestForAutomation(automationId);
    } catch (error) {
      console.error('[automationRunService.getLatestRun]', error);
      throw error;
    }
  },

  async getSuccessfulRuns(automationId: string, limit: number = 50): Promise<AutomationRunRow[]> {
    try {
      return await automationRunRepository.listByStatus(automationId, 'success', limit);
    } catch (error) {
      console.error('[automationRunService.getSuccessfulRuns]', error);
      throw error;
    }
  },

  async getFailedRuns(automationId: string, limit: number = 50): Promise<AutomationRunRow[]> {
    try {
      return await automationRunRepository.listByStatus(automationId, 'failed', limit);
    } catch (error) {
      console.error('[automationRunService.getFailedRuns]', error);
      throw error;
    }
  },

  async getSuccessRate(
    automationId: string,
    days?: number
  ): Promise<{ total: number; successes: number; failures: number; rate: number }> {
    try {
      return await automationRunRepository.getSuccessRate(automationId, days);
    } catch (error) {
      console.error('[automationRunService.getSuccessRate]', error);
      throw error;
    }
  },
};
