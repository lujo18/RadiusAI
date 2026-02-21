# Stripe Product ID Migration

## Summary
Updated Radius to use Stripe **Product IDs** instead of **Price IDs** in environment variables. This simplifies configuration and allows the code to automatically fetch the active price for each product.

## What Changed

### Environment Variables (`.env.local`)
```env
# OLD: Price IDs (price_...)
NEXT_PUBLIC_STRIPE_PRODUCT_STARTER=price_xxx
NEXT_PUBLIC_STRIPE_PRODUCT_PRO=price_xxx
NEXT_PUBLIC_STRIPE_PRODUCT_AGENCY=price_xxx

# NEW: Product IDs (prod_...)
NEXT_PUBLIC_STRIPE_PRODUCT_STARTER=prod_TdtjSerGsaShKb
NEXT_PUBLIC_STRIPE_PRODUCT_GROWTH=prod_TeCZSXmRDjSJ8m
NEXT_PUBLIC_STRIPE_PRODUCT_UNLIMITED=prod_TeCfgFiJyDGcLN
```

### Plan Names Updated
- **OLD**: `starter`, `pro`, `agency`
- **NEW**: `starter`, `growth`, `unlimited`

## Code Changes

### 1. **Signup Page** (`src/app/signup/page.tsx`)
- Changed `priceMap` to `productMap`
- Updated to send `productId` instead of `priceId`
- Updated plan names: `pro` → `growth`, `agency` → `unlimited`
- Default plan changed to `growth`

### 2. **Create Checkout API** (`src/app/api/stripe/create-checkout/route.ts`)
- Now accepts `productId` instead of `priceId`
- Fetches active price for the product using:
  ```typescript
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    type: 'recurring',
  });
  ```
- Uses first active price for checkout

### 3. **Pricing Page** (`src/app/pricing/page.tsx`)
- Updated `handleCheckout` to accept `productId` and plan names: `growth`, `unlimited`
- Changed button handlers to pass product IDs
- Updated plan references from `pro`/`agency` to `growth`/`unlimited`
- Simplified price display (removed yearly billing toggle complexity)

### 4. **Prices API** (`src/app/api/stripe/prices/route.ts`)
- Already configured correctly
- Fetches all prices and groups by product name
- Returns structure with `productId` included

### 5. **Pricing Content** (`src/content/pricing.ts`)
- Renamed `pro` plan to `growth`
- Renamed `agency` plan to `unlimited`

## How It Works Now

1. **Product Configuration in Stripe:**
   - Create products in Stripe Dashboard (Starter, Growth, Unlimited)
   - Add prices to each product (e.g., $19/mo, $29/mo, $99/mo)
   - Copy product IDs to `.env.local`

2. **Dynamic Price Fetching:**
   - Prices API fetches all prices from Stripe
   - Groups them by product name
   - Returns the active price for each plan

3. **Checkout Flow:**
   ```
   User clicks plan → Check auth → If logged in:
   → Send productId to create-checkout
   → API fetches active price for product
   → Creates Stripe session with price ID
   → Redirects to Stripe Checkout
   ```

## Benefits

✅ **Simpler Configuration**: Only need product IDs in env vars  
✅ **Flexible Pricing**: Can change prices in Stripe without code changes  
✅ **Automatic Price Selection**: Always uses active price for product  
✅ **Better Product Management**: Products group related prices  
✅ **Easier Testing**: Can have test/production products with different prices

## Testing Checklist

- [ ] Pricing page loads correctly
- [ ] All three plans display with correct names (Starter, Growth, Unlimited)
- [ ] Clicking "Get Started" on pricing page redirects to signup if not logged in
- [ ] After signup, user is redirected to Stripe checkout
- [ ] Correct product/price is used in Stripe session
- [ ] Payment completion redirects back to dashboard

## Next Steps

1. **Add Stripe API Keys** to `.env.local`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

2. **Verify Products in Stripe**:
   - Ensure each product has at least one active price
   - Product names should contain: "starter", "growth", or "unlimited"

3. **Test Full Flow**:
   - Visit pricing page
   - Select a plan
   - Complete signup
   - Complete Stripe checkout
   - Verify subscription in Supabase

4. **Set Up Webhook** (for production):
   - Create webhook endpoint in Stripe
   - Point to: `https://your-domain.com/api/stripe/webhooks`
   - Add `STRIPE_WEBHOOK_SECRET` to env vars
