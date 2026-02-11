// Minimal legacy client barrel for compatibility during migration.
// These are placeholders that should be migrated to feature-based surface modules.
export const billingApi = {
  async getBilling() { throw new Error('billingApi.getBilling shim called'); },
  async getSubscription(_expand?: string[]): Promise<any> { throw new Error('billingApi.getSubscription shim called'); },
  async createPortal(_payload?: any): Promise<any> { throw new Error('billingApi.createPortal shim called'); },
  async createCheckout(_payload?: any): Promise<any> { throw new Error('billingApi.createCheckout shim called'); },
};

export const templateApi = {
  async getTemplates() { throw new Error('templateApi.getTemplates shim called'); },
  async getTemplatesByBrand(_brandId: string) { throw new Error('templateApi.getTemplatesByBrand shim called'); },
  async getTemplate(_id: string) { throw new Error('templateApi.getTemplate shim called'); },
  async createTemplate(_data?: any) { throw new Error('templateApi.createTemplate shim called'); },
  async updateTemplate(_args?: any) { throw new Error('templateApi.updateTemplate shim called'); },
  async deleteTemplate(_id?: string) { throw new Error('templateApi.deleteTemplate shim called'); },
  async setDefaultTemplate(_id?: string) { throw new Error('templateApi.setDefaultTemplate shim called'); },
};

export const systemTemplatesApi = {
  async getSystemTemplates() { throw new Error('systemTemplatesApi.getSystemTemplates shim called'); },
  async getSystemTemplate(_id: string) { throw new Error('systemTemplatesApi.getSystemTemplate shim called'); },
  async createSystemTemplate(_template?: any) { throw new Error('systemTemplatesApi.createSystemTemplate shim called'); },
  async updateSystemTemplate(_id: string, _updates?: any) { throw new Error('systemTemplatesApi.updateSystemTemplate shim called'); },
  async deleteSystemTemplate(_id: string) { throw new Error('systemTemplatesApi.deleteSystemTemplate shim called'); },
};

export const testimonialsApi = {
  async getTestimonials() { throw new Error('testimonialsApi.getTestimonials shim called'); },
  async getTestimonial(_id: string) { throw new Error('testimonialsApi.getTestimonial shim called'); },
  async createTestimonial(_data?: any) { throw new Error('testimonialsApi.createTestimonial shim called'); },
  async updateTestimonial(_id: string, _updates?: any) { throw new Error('testimonialsApi.updateTestimonial shim called'); },
  async deleteTestimonial(_id: string) { throw new Error('testimonialsApi.deleteTestimonial shim called'); },
};

export const userApi = {
  async getProfile() { throw new Error('userApi.getProfile shim called'); },
  async getConnectedAccounts() { throw new Error('userApi.getConnectedAccounts shim called'); },
  async updateProfile(_data?: any) { throw new Error('userApi.updateProfile shim called'); },
};

export const plansApi = {
  async getPlans() { throw new Error('plansApi.getPlans shim called'); },
  async getPlan(_id: string) { throw new Error('plansApi.getPlan shim called'); },
  async createPlan(_data?: any) { throw new Error('plansApi.createPlan shim called'); },
  async updatePlan(_id: string, _updates?: any) { throw new Error('plansApi.updatePlan shim called'); },
  async deletePlan(_id: string) { throw new Error('plansApi.deletePlan shim called'); },
};

export const brandApi = {
  async startSocialConnect(_args?: any) { throw new Error('brandApi shim called'); },
  async disconnectSocialAccount(_args?: any) { throw new Error('brandApi.disconnectSocialAccount shim called'); },
};

export const postApi = {
  async getPosts(_filters?: any) { throw new Error('postApi.getPosts shim called'); },
  async getPost(_id?: string) { throw new Error('postApi.getPost shim called'); },
  async getScheduledPosts(_from?: Date, _to?: Date, _brandId?: string) { throw new Error('postApi.getScheduledPosts shim called'); },
  async createPost(_data?: any) { throw new Error('postApi.createPost shim called'); },
  async updatePost(_id?: string, _updates?: any) { throw new Error('postApi.updatePost shim called'); },
  async deletePost(_id?: string) { throw new Error('postApi.deletePost shim called'); },
  async publishPost(_args?: any) { throw new Error('postApi.publishPost shim called'); },
  async draftPost(_args?: any) { throw new Error('postApi.draftPost shim called'); },
  async schedulePost(_args?: any) { throw new Error('postApi.schedulePost shim called'); },
  async deletePostWithSlides(_id?: string) { throw new Error('postApi.deletePostWithSlides shim called'); },
};

export const contentApi = {
  async fetchContent() { throw new Error('contentApi.fetchContent shim called'); },
  async deletePostWithSlides(_postId?: string) { throw new Error('contentApi.deletePostWithSlides shim called'); },
};

export const productsApi = {
  async list() { throw new Error('productsApi shim called'); },
  async getProducts() { throw new Error('productsApi.getProducts shim called'); },
};

export const productsApiClient = productsApi;

// Default export for legacy `import apiClient from '@/features/common/hooks/client'`
const apiClient: any = {
  billing: billingApi,
  templates: templateApi,
  systemTemplates: systemTemplatesApi,
  testimonials: testimonialsApi,
  user: userApi,
  plans: plansApi,
  brand: brandApi,
  post: postApi,
  content: contentApi,
  products: productsApi,
};

// Minimal HTTP helpers used by legacy code expecting `apiClient.get/post/put/delete`
async function httpGet(path: string) {
  const res = await fetch(path, { method: 'GET' });
  return res.json();
}

async function httpPost(path: string, body?: any) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

async function httpPut(path: string, body?: any) {
  const res = await fetch(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

async function httpDelete(path: string) {
  const res = await fetch(path, { method: 'DELETE' });
  return res.json();
}

// Attach HTTP helpers to default apiClient so `apiClient.get(...)` works
(apiClient as any).get = httpGet;
(apiClient as any).post = httpPost;
(apiClient as any).put = httpPut;
(apiClient as any).delete = httpDelete;

// Also export helpers as named functions
export { httpGet as get, httpPost as post, httpPut as put, httpDelete as del };

export default apiClient;
