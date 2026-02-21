"""
Migration script to backfill stripe_product_id for existing users
Run this once to populate the stripe_product_id column for users who already have subscriptions
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.integrations.supabase.client import get_supabase
from config import Config
import stripe

# Initialize Stripe
stripe.api_key = Config.STRIPE_SECRET_KEY

def backfill_product_ids():
    """Fetch all users with Stripe data and backfill their product IDs"""
    
    if not Config.STRIPE_SECRET_KEY:
        print("ERROR: STRIPE_SECRET_KEY not configured")
        return
    
    supabase = get_supabase()
    
    # Fetch all users who have either a stripe_customer_id or stripe_subscription_id
    # but don't have a stripe_product_id yet
    print("Fetching users with Stripe data...")
    result = supabase.table('users').select('id, email, stripe_customer_id, stripe_subscription_id, stripe_product_id').execute()
    
    if not result.data:
        print("No users found")
        return
    
    users = result.data
    print(f"Found {len(users)} total users")
    
    # Filter users who need migration
    users_to_migrate = [
        u for u in users 
        if (u.get('stripe_customer_id') or u.get('stripe_subscription_id')) 
        and not u.get('stripe_product_id')
    ]
    
    print(f"Found {len(users_to_migrate)} users needing product ID backfill")
    
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for user in users_to_migrate:
        user_id = user['id']
        email = user.get('email', 'unknown')
        subscription_id = user.get('stripe_subscription_id')
        customer_id = user.get('stripe_customer_id')
        
        print(f"\nProcessing user {email} (ID: {user_id})")
        
        try:
            product_id = None
            
            # Try to get subscription directly if we have subscription_id
            if subscription_id:
                print(f"  Fetching subscription {subscription_id}")
                try:
                    sub = stripe.Subscription.retrieve(subscription_id)
                    if sub.get('items') and sub['items'].get('data'):
                        price = sub['items']['data'][0].get('price')
                        if price:
                            product_id = price.get('product')
                            print(f"  Found product ID from subscription: {product_id}")
                except stripe.error.InvalidRequestError as e:
                    print(f"  Subscription not found or invalid: {e}")
                except Exception as e:
                    print(f"  Error fetching subscription: {e}")
            
            # If no product_id yet, try fetching from customer
            if not product_id and customer_id:
                print(f"  Fetching subscriptions for customer {customer_id}")
                try:
                    subs = stripe.Subscription.list(customer=customer_id, limit=1, status='active')
                    if subs.data:
                        sub = subs.data[0]
                        # Update subscription_id if we found one
                        subscription_id = sub.get('id')
                        if sub.get('items') and sub['items'].get('data'):
                            price = sub['items']['data'][0].get('price')
                            if price:
                                product_id = price.get('product')
                                print(f"  Found product ID from customer subscriptions: {product_id}")
                except stripe.error.InvalidRequestError as e:
                    print(f"  Customer not found or invalid: {e}")
                except Exception as e:
                    print(f"  Error fetching customer subscriptions: {e}")
            
            # Update user if we found a product_id
            if product_id:
                update_data = {'stripe_product_id': product_id}
                
                # Also update subscription_id if we found it from customer lookup
                if subscription_id and not user.get('stripe_subscription_id'):
                    update_data['stripe_subscription_id'] = subscription_id
                
                print(f"  Updating user with: {update_data}")
                supabase.table('users').update(update_data).eq('id', user_id).execute()
                updated_count += 1
                print(f"  ✓ Updated successfully")
            else:
                print(f"  ⚠ No active subscription or product found")
                skipped_count += 1
                
        except Exception as e:
            print(f"  ✗ Error processing user: {e}")
            error_count += 1
    
    print("\n" + "="*60)
    print("Migration Summary:")
    print(f"  Total users processed: {len(users_to_migrate)}")
    print(f"  Successfully updated: {updated_count}")
    print(f"  Skipped (no subscription): {skipped_count}")
    print(f"  Errors: {error_count}")
    print("="*60)

if __name__ == '__main__':
    print("Starting stripe_product_id backfill migration...")
    print("="*60)
    backfill_product_ids()
