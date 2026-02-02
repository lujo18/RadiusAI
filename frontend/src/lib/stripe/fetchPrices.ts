// /**
//  * Utility to fetch current Stripe prices
//  * Use this in server components or API routes
//  */



// import Stripe from 'stripe';
// REMOVE: Migrated all stirpe operations to backend

// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-12-15.clover',
// });

// export interface StripePriceData {
//   id: string;
//   productId: string;
//   productName: string;
//   description: string | null;
//   amount: number;
//   currency: string;
//   interval: string | undefined;
//   metadata: Record<string, string>;
// }

// /**
//  * Get a specific price by ID
//  */
// export async function getStripePrice(priceId: string) {
//   try {
//     const price = await stripe.prices.retrieve(priceId, {
//       expand: ['product'],
//     });

//     const product = price.product as Stripe.Product;

//     return {
//       id: price.id,
//       productId: product.id,
//       productName: product.name,
//       description: product.description,
//       amount: price.unit_amount ? price.unit_amount / 100 : 0,
//       currency: price.currency,
//       interval: price.recurring?.interval,
//       metadata: product.metadata,
//     };
//   } catch (error) {
//     console.error('Error fetching Stripe price:', error);
//     throw error;
//   }
// }
