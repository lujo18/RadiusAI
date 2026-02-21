# Stripe Customer Portal Configuration for Upgrades

This guide shows you how to configure Stripe's Customer Portal to allow seamless plan upgrades.

## Overview

The Customer Portal lets users:
- View their current subscription
- **Switch between plans** (upgrade/downgrade)
- Update payment methods
- View invoice history
- Cancel subscriptions

## Step-by-Step Configuration

### 1. Access Customer Portal Settings

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Settings** → **Billing** → **Customer portal**
3. Click **"Activate test link"** (for test mode) or configure for live mode

### 2. Configure Subscription Settings

#### Enable Plan Switching

1. In Customer Portal settings, scroll to **"Subscriptions"**
2. Toggle **ON** the following options:
   - ✅ **Customers can switch plans**
   - ✅ **Customers can update their subscription**

#### Select Available Products

1. Under **"Products customers can switch to"**, click **"Choose products"**
2. Select all your subscription products:
   - ✅ Pro Plan
   - ✅ Agency Plan
   - ✅ Any other tiers
3. Maximum 10 products can be selected
4. Click **"Save"**

### 3. Configure Proration Settings

#### For Immediate Upgrades (Recommended)

1. Under **"Proration"**, select:
   - **"Always invoice immediately"**
   
This ensures:
- Upgrades apply immediately
- User is charged the prorated difference right away
- They get instant access to new features

#### Alternative: End of Billing Period

If you prefer upgrades to take effect at renewal:
- Select **"Invoice at the end of the billing period"**
- Users will keep current plan until next billing date

### 4. Configure Payment Methods

1. Under **"Payment methods"**, toggle **ON**:
   - ✅ **Customers can update payment methods**
   - ✅ **Customers can remove payment methods**

### 5. Invoice History

1. Toggle **ON**:
   - ✅ **Show invoice history**
   
This lets users download past invoices.

### 6. Cancellation Flow (Optional)

Configure what happens when users try to cancel:

1. Under **"Cancellation"**, choose:
   - **"Offer a pause instead"** (retention tactic)
   - **"Survey before canceling"** (collect feedback)
   - **"Cancel immediately"**

2. Recommended: Select **"At the end of billing period"** for cancellations

### 7. Promotion Codes (Optional)

1. Toggle **ON** if you want users to apply coupons:
   - ✅ **Allow promotion code redemption**

## Advanced Configuration

### Custom Return URL

In your API call to create the portal session:

```python
portal = stripe.billing_portal.Session.create(
    customer=customer_id,
    return_url='https://yourapp.com/settings/billing'
)
```

### Webhook Integration

Ensure you're listening for these events:

```python
# In your webhook handler
if event.type == 'customer.subscription.updated':
    # User upgraded/downgraded - refresh their permissions
    subscription = event.data.object
    # Extract new product_id and update database
```

## Testing the Setup

### 1. Create a Test Subscription

```bash
# Use Stripe test card: 4242 4242 4242 4242
```

### 2. Open Customer Portal

From your app:

```typescript
const response = await fetch(`${API_URL}/api/billing/portal`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    user_id: userId,
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to portal
```

### 3. Verify Plan Switching

1. In the portal, you should see **"Update plan"** button
2. Click it to see available plans
3. Select a higher tier
4. Verify the prorated amount
5. Complete the upgrade
6. Confirm webhook received the `customer.subscription.updated` event

## Common Issues & Solutions

### ❌ "Switch plans" button not showing

**Solutions:**
- Ensure you've selected products in portal settings
- Verify products are **active** in Stripe
- Check that subscription has only **one** product (multiple products disable switching)
- Ensure subscription is **active** or **trialing**

### ❌ Proration not working

**Cause:** Wrong proration setting

**Solution:**
- Go to Portal settings → Subscriptions → Proration
- Select **"Always invoice immediately"**

### ❌ Wrong plans showing

**Cause:** Product filtering

**Solution:**
- Only products selected in portal settings appear
- Products must have `active: true`
- Products must have at least one active recurring price

## Integration with Your App

### Backend Webhook Handler

Already implemented in [billing_service.py](../backend/routers/billing_service.py):

```python
elif event.type in ['customer.subscription.created', 'customer.subscription.updated']:
    subscription = event.data.object
    # Extract product_id and update user
    if subscription.get('items') and subscription['items'].get('data'):
        price = subscription['items']['data'][0].get('price')
        if price:
            product_id = price.get('product')
            supabase.table('users').update({
                'stripe_product_id': product_id
            }).eq('id', user_id).execute()
```

### Frontend UpgradeFlow Component

Already created in [UpgradeFlow.tsx](../frontend/src/components/billing/UpgradeFlow.tsx):

```typescript
import UpgradeFlow from '@/components/billing/UpgradeFlow';

// In your component
const [showUpgrade, setShowUpgrade] = useState(false);

// Trigger upgrade flow
<Button onClick={() => setShowUpgrade(true)}>
  Upgrade Plan
</Button>

<UpgradeFlow
  isOpen={showUpgrade}
  onClose={() => setShowUpgrade(false)}
  trigger="paywall"
/>
```

## Production Checklist

Before going live:

- [ ] Configure Customer Portal in **Live mode**
- [ ] Add all production products to portal
- [ ] Set proration to "Always invoice immediately"
- [ ] Test upgrade flow with real card
- [ ] Verify webhook receives subscription.updated events
- [ ] Confirm user permissions update correctly
- [ ] Test downgrade flow (if enabled)
- [ ] Set up cancellation survey
- [ ] Configure return URLs for production domain

## Support

For issues with Stripe configuration:
- [Stripe Customer Portal Docs](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Support](https://support.stripe.com/)

For app-specific issues:
- Check webhook logs in Stripe Dashboard
- Review backend logs for errors
- Ensure `stripe_product_id` column exists in users table
