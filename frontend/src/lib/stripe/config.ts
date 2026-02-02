import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// REMOVE: Migrating subscription limits and info into supabase
// export const STRIPE_CONFIG = {
//   plans: {
//     starter: {
//       name: 'Starter',
//       price: 19,
//       priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
//       limits: {
//         templates: 10,
//         posts: 50,
//         profiles: 1,
//         aiGenerations: 100,
//       },
//     },
//     growth: {
//       name: 'Growth',
//       price: 49,
//       priceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
//       limits: {
//         templates: 50,
//         posts: 500,
//         profiles: 5,
//         aiGenerations: 1000,
//       },
//     },
//     unlimited: {
//       name: 'Unlimited',
//       price: 99,
//       priceId: process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_PRICE_ID,
//       limits: {
//         templates: Infinity,
//         posts: Infinity,
//         profiles: Infinity,
//         aiGenerations: Infinity,
//       },
//     },
//   },
// };

// export type PlanType = keyof typeof STRIPE_CONFIG.plans;
