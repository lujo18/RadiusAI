from fastapi import APIRouter, Depends, HTTPException
from backend.auth import get_current_user
from backend.services.integrations.supabase.client import get_supabase, get_stripe_supabase

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/subscription")
def get_subscription(user: str = Depends(get_current_user)):
    """Return the current Stripe subscription for the authenticated user.

    This looks up the user's `stripe_customer_id` from the `profiles` table
    in the main Supabase schema, then queries the `stripe.subscriptions`
    table (via the service role key) to return the latest subscription row.
    """
    try:
        supabase = get_supabase()

        # Fetch the customer's stripe_customer_id from users table
        user_res = supabase.table('users').select('stripe_customer_id').eq('id', user).execute()
        if not getattr(user_res, 'data', None) or len(user_res.data) == 0:
            raise HTTPException(status_code=404, detail='User not found')

        customer_id = user_res.data[0].get('stripe_customer_id')
        if not customer_id:
            raise HTTPException(status_code=404, detail='No Stripe customer configured for this user')

        # Query the stripe schema for subscriptions for this customer
        stripe_supabase = get_stripe_supabase()

        # Find the most recent subscription row for this customer
        sub_res = stripe_supabase.table('subscriptions').select('*').eq('customer_id', customer_id).order('created_at', desc=True).limit(1).execute()
        subscription = sub_res.data[0] if getattr(sub_res, 'data', None) and len(sub_res.data) > 0 else None

        # Enrich with price/product info when possible
        enriched = None
        if subscription:
            enriched = dict(subscription)

            # Normalize current_period_end to ISO string if present
            cpe = subscription.get('current_period_end')
            if cpe is not None:
                try:
                    # Supabase may store timestamp or epoch seconds
                    if isinstance(cpe, (int, float)):
                        enriched['current_period_end'] = cpe
                        enriched['current_period_end_iso'] = None
                    else:
                        enriched['current_period_end_iso'] = str(cpe)
                except Exception:
                    enriched['current_period_end_iso'] = str(cpe)

            # Attempt to locate a price id from subscription payload
            price_id = None
            # common fields: price_id, price, items
            if subscription.get('price_id'):
                price_id = subscription.get('price_id')
            elif subscription.get('price') and isinstance(subscription.get('price'), dict):
                price_id = subscription.get('price', {}).get('id')
            elif subscription.get('items'):
                items = subscription.get('items')
                # items may be list or dict with data
                if isinstance(items, list) and len(items) > 0:
                    itm = items[0]
                    if isinstance(itm, dict):
                        price_id = itm.get('price') or (itm.get('price', {}) and itm.get('price', {}).get('id'))
                elif isinstance(items, dict) and items.get('data') and len(items.get('data')) > 0:
                    itm = items.get('data')[0]
                    price_id = itm.get('price') or (itm.get('price', {}) and itm.get('price', {}).get('id'))

            if price_id:
                try:
                    price_res = stripe_supabase.table('prices').select('*').eq('id', price_id).limit(1).execute()
                    price = price_res.data[0] if getattr(price_res, 'data', None) and len(price_res.data) > 0 else None
                    if price:
                        enriched['price'] = price
                        unit_amount = price.get('unit_amount') or price.get('unit_amount_decimal') or price.get('amount')
                        currency = price.get('currency') or price.get('currency_code') or 'usd'
                        if unit_amount:
                            try:
                                # unit_amount often integer cents
                                amount_display = f"{int(unit_amount) / 100:.2f}"
                                enriched['amount_due_display'] = amount_display
                                enriched['currency'] = currency
                            except Exception:
                                enriched['amount_due_display'] = str(unit_amount)

                        # fetch product name if available
                        prod_id = price.get('product') or price.get('product_id')
                        if prod_id:
                            prod_res = stripe_supabase.table('products').select('*').eq('id', prod_id).limit(1).execute()
                            product = prod_res.data[0] if getattr(prod_res, 'data', None) and len(prod_res.data) > 0 else None
                            if product:
                                enriched['product'] = product
                                enriched['plan_display_name'] = product.get('name') or price.get('nickname')
                            else:
                                enriched['plan_display_name'] = price.get('nickname') or price.get('id')
                        else:
                            enriched['plan_display_name'] = price.get('nickname') or price.get('id')
                except Exception:
                    # ignore enrichment failures
                    pass

        return {'subscription': enriched}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to fetch subscription: {str(e)}')
