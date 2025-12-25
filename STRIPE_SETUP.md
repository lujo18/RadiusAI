# Stripe Setup Guide

Complete guide to set up Stripe payments for SlideForge.

## 📋 Prerequisites

- Stripe account (https://stripe.com)
- Supabase project with schema deployed
- Admin access to your Supabase project

---

## 🔧 Step 1: Create Stripe Account & Products

### 1.1 Sign Up for Stripe
1. Go to https://dashboard.stripe.com/register
2. Create account and verify email
3. Enable test mode (toggle in top-right)

### 1.2 Create Products

**Pro Plan:**
1. Go to Products → Add Product
2. Name: `SlideForge Pro`
3. Description: `For serious content creators`
4. Pricing: `$29.00 USD` / `Recurring` / `Monthly`
5. Click "Save product"
6. **Copy the Price ID** (starts with `price_`)

**Agency Plan:**
1. Products → Add Product
2. Name: `SlideForge Agency`
3. Description: `For agencies managing multiple brands`
4. Pricing: `$99.00 USD` / `Recurring` / `Monthly`
5. Click "Save product"
6. **Copy the Price ID** (starts with `price_`)

---

## 🔑 Step 2: Get API Keys

1. Go to Developers → API keys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" and copy **Secret key** (starts with `sk_test_`)

---

## 🌐 Step 3: Set Up Webhook

### 3.1 Create Webhook Endpoint
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - For local testing: Use ngrok or Stripe CLI
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. **Copy the Signing secret** (starts with `whsec_`)

### 3.2 Local Testing with Stripe CLI (Optional)

```powershell
# Install Stripe CLI
scoop install stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret shown in terminal
```

---

## 🗄️ Step 4: Update Supabase Schema

Add Stripe fields to profiles table:

```sql
-- Add Stripe columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription 
ON profiles(stripe_subscription_id);
```

---

## 🔐 Step 5: Add Environment Variables

Create or update `.env.local` in your frontend folder:

```env
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Public Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID=price_...

# Stripe Secret Keys (NEVER commit to git)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**⚠️ Important:** Add `.env.local` to `.gitignore`!

```
# .gitignore
.env.local
.env*.local
```

---

## 🧪 Step 6: Test the Integration

### 6.1 Test Checkout Flow

1. Start your dev server: `npm run dev`
2. Navigate to `/pricing` or use the Paywall component
3. Click "Upgrade Now" on Pro plan
4. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. Complete checkout
6. Verify user's plan updated in Supabase

### 6.2 Test Webhook Events

**With Stripe CLI:**
```powershell
# Trigger test webhook
stripe trigger checkout.session.completed
```

**Manually:**
1. Complete a test checkout
2. Check webhook logs in Stripe Dashboard
3. Verify database updated correctly

### 6.3 Test Customer Portal

1. After subscribing, click "Manage Subscription"
2. Should redirect to Stripe Customer Portal
3. Test updating payment method
4. Test canceling subscription
5. Verify plan downgrades to "starter" in database

---

## 🚀 Step 7: Production Deployment

### 7.1 Switch to Production Mode

1. In Stripe Dashboard, toggle "Test mode" OFF
2. Create new products in production mode
3. Get new production API keys
4. Update environment variables with production keys

### 7.2 Production Environment Variables

```env
# Production Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_live_...
NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID=price_live_...

NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

### 7.3 Update Webhook URL

1. Developers → Webhooks
2. Update endpoint URL to production domain
3. Copy new webhook secret

---

## 🛡️ Step 8: Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Use service role key only in API routes (server-side)
- [ ] Verify webhook signatures in webhook handler
- [ ] Enable Stripe Radar for fraud detection
- [ ] Set up email receipts in Stripe settings
- [ ] Configure tax settings if required
- [ ] Review Stripe security best practices

---

## 🎯 Usage in Your App

### Protect Routes Based on Plan

```typescript
import { usePlanLimits } from '@/hooks/usePlanLimits';

function MyComponent() {
  const { plan, canCreatePost, getRemainingPosts } = usePlanLimits();

  const handleCreate = () => {
    if (!canCreatePost(currentPostCount)) {
      // Show upgrade modal
      router.push('/pricing');
      return;
    }
    // Create post
  };

  return (
    <div>
      <p>Plan: {plan}</p>
      <p>Posts remaining: {getRemainingPosts(currentPostCount)}</p>
    </div>
  );
}
```

### Show Paywall Component

```typescript
import Paywall from '@/components/Paywall';

export default function PricingPage() {
  return <Paywall />;
}
```

---

## 🐛 Troubleshooting

### Webhook Not Receiving Events
- Check webhook URL is correct and publicly accessible
- Verify webhook secret matches environment variable
- Check webhook logs in Stripe Dashboard
- For local testing, use Stripe CLI or ngrok

### Checkout Session Not Creating
- Verify price IDs are correct
- Check Stripe API keys are valid
- Ensure `NEXT_PUBLIC_BASE_URL` is correct
- Check browser console and server logs

### Plan Not Updating After Payment
- Check webhook is receiving events
- Verify `userId` is in session metadata
- Check Supabase service role key is correct
- Look at webhook logs in Stripe Dashboard

### Customer Portal Not Opening
- Verify user has `stripe_customer_id` in profiles table
- Check customer exists in Stripe
- Ensure return URL is correct

---

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

---

## 🎉 Next Steps

1. Complete Stripe setup following steps above
2. Test all flows in development
3. Deploy to production with production keys
4. Monitor webhook events and user subscriptions
5. Set up Stripe email notifications
6. Consider adding annual billing option
7. Add coupon/promotion code support

**Your Stripe paywall is ready! 🚀**
