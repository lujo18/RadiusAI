# Database Migrations

## Backfill Stripe Product ID

This migration populates the `stripe_product_id` column for existing users who already have Stripe subscriptions.

### Prerequisites

1. Ensure you have the `stripe_product_id` column added to the `users` table:
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
   ```

2. Make sure your `.env` file has:
   - `STRIPE_SECRET_KEY` (your Stripe secret key)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Running the Migration

From the `backend` directory:

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Mac/Linux

# Run the migration
python migrations/backfill_stripe_product_id.py
```

### What it does

1. Fetches all users who have a `stripe_customer_id` or `stripe_subscription_id` but no `stripe_product_id`
2. For each user:
   - Retrieves their Stripe subscription
   - Extracts the product ID from the subscription items
   - Updates the `stripe_product_id` column
   - If `stripe_subscription_id` was missing, updates that too
3. Provides a summary of:
   - Users successfully updated
   - Users skipped (no active subscription)
   - Errors encountered

### Safety

- **Idempotent**: Safe to run multiple times - only updates users missing `stripe_product_id`
- **Read-heavy**: Makes Stripe API calls to fetch subscription data
- **Non-destructive**: Only adds data, never removes existing data

### Example Output

```
Starting stripe_product_id backfill migration...
============================================================
Fetching users with Stripe data...
Found 42 total users
Found 15 users needing product ID backfill

Processing user john@example.com (ID: abc123)
  Fetching subscription sub_xxx
  Found product ID from subscription: prod_123
  Updating user with: {'stripe_product_id': 'prod_123'}
  ✓ Updated successfully

...

============================================================
Migration Summary:
  Total users processed: 15
  Successfully updated: 12
  Skipped (no subscription): 2
  Errors: 1
============================================================
```

### Troubleshooting

**"STRIPE_SECRET_KEY not configured"**
- Add `STRIPE_SECRET_KEY` to your `.env` file

**"Subscription not found or invalid"**
- User's subscription may have been deleted in Stripe
- Script will try to find active subscriptions via customer ID

**"No active subscription or product found"**
- User has no active Stripe subscription
- This is normal for users who haven't subscribed or have cancelled
