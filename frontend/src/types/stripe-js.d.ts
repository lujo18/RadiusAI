declare module '@stripe/stripe-js' {
  export interface Stripe {
    // Minimal stub for compile-time only. Runtime behavior is provided by Stripe's library.
  }

  export function loadStripe(key?: string | null): Promise<Stripe | null>;
}
