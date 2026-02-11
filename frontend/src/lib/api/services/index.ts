// Compatibility shims for legacy service imports. Replace with real implementations
// from the feature folders when migrating callers.
export const brandService = {
	async startSocialConnect(_args?: any) { throw new Error('brandService.startSocialConnect shim called'); },
	async disconnectSocialAccount(_args?: any) { throw new Error('brandService.disconnectSocialAccount shim called'); },
	async cancelConnection(_connectToken?: string) { throw new Error('brandService.cancelConnection shim called'); },
	async checkConnectionStatus(_connectToken?: string) { throw new Error('brandService.checkConnectionStatus shim called'); },
};

export const automationService = {
	async getAutomations(_brandId: string) { throw new Error('automationService.getAutomations shim called'); },
	async getAutomation(_id: string) { throw new Error('automationService.getAutomation shim called'); },
	async createAutomation(_brandId: string, _payload?: any) { throw new Error('automationService.createAutomation shim called'); },
	async updateAutomation(_id: string, _updates?: any) { throw new Error('automationService.updateAutomation shim called'); },
	async deleteAutomation(_id: string) { throw new Error('automationService.deleteAutomation shim called'); },
	async toggleActive(_id: string, _isActive: boolean) { throw new Error('automationService.toggleActive shim called'); },
	async updateSchedule(_id: string, _schedule: Record<string, string[]>) { throw new Error('automationService.updateSchedule shim called'); },
	async updateNextRun(_id: string, _nextRunAt: string) { throw new Error('automationService.updateNextRun shim called'); },
};

export const automationRunService = {
	async getAutomationRuns(_automationId: string, _limit?: number) { throw new Error('automationRunService.getAutomationRuns shim called'); },
	async getAutomationRunsByBrand(_brandId: string, _limit?: number) { throw new Error('automationRunService.getAutomationRunsByBrand shim called'); },
	async getAutomationRun(_id: string) { throw new Error('automationRunService.getAutomationRun shim called'); },
	async getLatestRun(_automationId: string) { throw new Error('automationRunService.getLatestRun shim called'); },
	async getSuccessfulRuns(_automationId: string, _limit?: number) { throw new Error('automationRunService.getSuccessfulRuns shim called'); },
	async getFailedRuns(_automationId: string, _limit?: number) { throw new Error('automationRunService.getFailedRuns shim called'); },
	async getSuccessRate(_automationId: string, _days?: number) { throw new Error('automationRunService.getSuccessRate shim called'); },
};

export const brandCtaService = {
	async getBrandCtas(_brandId: string) { throw new Error('brandCtaService.getBrandCtas shim called'); },
	async getBrandCta(_ctaId: string) { throw new Error('brandCtaService.getBrandCta shim called'); },
	async getAllCtas() { throw new Error('brandCtaService.getAllCtas shim called'); },
	async createBrandCta(_brandId: string, _payload?: any) { throw new Error('brandCtaService.createBrandCta shim called'); },
	async updateBrandCta(_ctaId: string, _updates?: any) { throw new Error('brandCtaService.updateBrandCta shim called'); },
	async deleteBrandCta(_ctaId: string) { throw new Error('brandCtaService.deleteBrandCta shim called'); },
	async toggleStatus(_ctaId: string, _isActive?: boolean) { throw new Error('brandCtaService.toggleStatus shim called'); },
	async toggleCtaStatus(_ctaId: string, _isActive?: boolean) { throw new Error('brandCtaService.toggleCtaStatus shim called'); },
	async duplicateCta(_ctaId: string, _targetBrandId: string) { throw new Error('brandCtaService.duplicateCta shim called'); },
};

export const postService = {
	async create() { throw new Error('postService shim'); },
	async publishPost(_brandId: string, _platforms: string[], _postId: string) { throw new Error('postService.publishPost shim called'); },
	async draftPost(_brandId: string, _platforms: string[], _postId: string) { throw new Error('postService.draftPost shim called'); },
	async schedulePost(_brandId: string, _platforms: string[], _postId: string, _scheduledAt: string) { throw new Error('postService.schedulePost shim called'); },
	async deletePostWithSlides(_postId: string) { throw new Error('postService.deletePostWithSlides shim called'); },
};

export const presetPackService = {
	async createPresetPack(_data?: any) { throw new Error('presetPackService.createPresetPack shim called'); },
	async getPresetPacks(_accessibility?: 'global' | 'private') { throw new Error('presetPackService.getPresetPacks shim called'); },
	async getUserPrivatePacks() { throw new Error('presetPackService.getUserPrivatePacks shim called'); },
	async getPresetPack(_id: string) { throw new Error('presetPackService.getPresetPack shim called'); },
	async updatePresetPack(_id: string, _updates?: any) { throw new Error('presetPackService.updatePresetPack shim called'); },
	async deletePresetPack(_id: string) { throw new Error('presetPackService.deletePresetPack shim called'); },
	async uploadPresetImage(_data?: any) { throw new Error('presetPackService.uploadPresetImage shim called'); },
	async getPresetImages(_packId: string, _options?: any) { throw new Error('presetPackService.getPresetImages shim called'); },
	async deletePresetImage(_id: string) { throw new Error('presetPackService.deletePresetImage shim called'); },
};

export const PresetPackService = presetPackService;

export const templateService = {

	async getTemplates() { throw new Error('templateService.getTemplates shim called'); },
	async getTemplatesByBrand(_brandId: string) { throw new Error('templateService.getTemplatesByBrand shim called'); },
	async getTemplate(_templateId: string) { throw new Error('templateService.getTemplate shim called'); },
	async createTemplate(_data?: any) { throw new Error('templateService.createTemplate shim called'); },
	async updateTemplate(_templateId: string, _updates?: any) { throw new Error('templateService.updateTemplate shim called'); },
	async deleteTemplate(_id: string) { throw new Error('templateService.deleteTemplate shim called'); },
	async setDefaultTemplate(_id?: string) { throw new Error('templateService.setDefaultTemplate shim called'); },
};

export const testimonialsService = {
		async getTestimonials() { throw new Error('testimonialsService.getTestimonials shim called'); },
		async getTestimonial(_id: string) { throw new Error('testimonialsService.getTestimonial shim called'); },
		async createTestimonial(_data?: any) { throw new Error('testimonialsService.createTestimonial shim called'); },
		async updateTestimonial(_id: string, _updates?: any) { throw new Error('testimonialsService.updateTestimonial shim called'); },
		async deleteTestimonial(_id: string) { throw new Error('testimonialsService.deleteTestimonial shim called'); },
	};


export const userService = {
	async getProfile() { throw new Error('userService.getProfile shim called'); },
	async updateProfile(_updates?: any) { throw new Error('userService.updateProfile shim called'); },
	async getConnectedAccounts() { throw new Error('userService.getConnectedAccounts shim called'); },
};
