import { automationRepository } from '@/lib/supabase/repos/AutomationRepository';
import type { Database } from '@/types/database';

type AutomationRow = Database['public']['Tables']['automations']['Row'];
type AutomationInsert = Database['public']['Tables']['automations']['Insert'];
type AutomationUpdate = Database['public']['Tables']['automations']['Update'];

export const automationService = {
  async getAutomations(brandId: string): Promise<AutomationRow[]> {
    try {
      return await automationRepository.list(brandId);
    } catch (error) {
      console.error('[automationService.getAutomations]', error);
      throw error;
    }
  },

  async getAutomation(id: string): Promise<AutomationRow | null> {
    try {
      return await automationRepository.getById(id);
    } catch (error) {
      console.error('[automationService.getAutomation]', error);
      throw error;
    }
  },

  async createAutomation(
    brandId: string,
    payload: Omit<AutomationInsert, 'brand_id'>
  ): Promise<AutomationRow> {
    try {
      const fullPayload: AutomationInsert = {
        ...payload,
        brand_id: brandId,
      };
      return await automationRepository.create(fullPayload);
    } catch (error) {
      console.error('[automationService.createAutomation]', error);
      throw error;
    }
  },

  async updateAutomation(id: string, updates: AutomationUpdate): Promise<AutomationRow> {
    try {
      return await automationRepository.update(id, updates);
    } catch (error) {
      console.error('[automationService.updateAutomation]', error);
      throw error;
    }
  },

  async deleteAutomation(id: string): Promise<boolean> {
    try {
      return await automationRepository.delete(id);
    } catch (error) {
      console.error('[automationService.deleteAutomation]', error);
      throw error;
    }
  },

  async toggleActive(id: string, isActive: boolean): Promise<AutomationRow> {
    try {
      return await automationRepository.toggleActive(id, isActive);
    } catch (error) {
      console.error('[automationService.toggleActive]', error);
      throw error;
    }
  },

  async updateSchedule(id: string, schedule: Record<string, string[]>): Promise<AutomationRow> {
    try {
      return await automationRepository.updateSchedule(id, schedule);
    } catch (error) {
      console.error('[automationService.updateSchedule]', error);
      throw error;
    }
  },

  async updateNextRun(id: string, nextRunAt: string): Promise<AutomationRow> {
    try {
      return await automationRepository.updateNextRun(id, nextRunAt);
    } catch (error) {
      console.error('[automationService.updateNextRun]', error);
      throw error;
    }
  },
};

export default automationService;
