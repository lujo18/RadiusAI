// DELETE: Depreciated — Plans repository previously sourced from Stripe products.
// Replace with provider-agnostic plan/product repository under `features/billing`.
export class PlansRepository {
  static async getPlans() {
    // Placeholder while plans data is sourced from Stripe product APIs.
    return [];
  }
}