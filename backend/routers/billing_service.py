import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from auth import get_current_user, get_optional_user
from services.integrations.supabase.client import get_supabase, get_stripe_supabase
from config import Config
from services.usage.service import sync_usage_period_from_subscription
import stripe
import json

logger = logging.Logger(__name__)
router = APIRouter(prefix="/api/billing", tags=["billing"])

# Initialize Stripe
if not Config.STRIPE_SECRET_KEY:
    stripe.api_key = None
else:
    stripe.api_key = Config.STRIPE_SECRET_KEY

# Log which key we're using (masked) to help diagnose test vs live mode mismatches
try:
    if stripe.api_key:
        masked = stripe.api_key[:8] + '...' if len(stripe.api_key) > 8 else stripe.api_key
        print(f"Stripe client initialized. Key prefix: {masked}")
    else:
        print("Stripe client initialized with NO API key")
except Exception:
    print("Stripe client initialization logging failed")
def require_stripe_key():
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe secret key not configured")


@router.get("/products")
def list_products():
    """List active Stripe products and prices"""
    require_stripe_key()
    logger.info("GETTING PRODUCTS")
    try:
        products = stripe.Product.list(active=True, limit=50)
        prices = stripe.Price.list(active=True, limit=200)

        # map prices to products
        price_map = {}
        for p in prices.data:
            price_map.setdefault(getattr(p, 'product', None), []).append(p)

        output = []
        for prod in products.data:
            item = {
                "id": getattr(prod, 'id', None),
                "name": getattr(prod, 'name', None),
                "description": getattr(prod, 'description', None),
                "metadata": getattr(prod, 'metadata', None) or {},
                "prices": [
                    {
                        "id": getattr(pr, 'id', None),
                        "unit_amount": getattr(pr, 'unit_amount', None),
                        "currency": getattr(pr, 'currency', None),
                        "recurring": getattr(pr, 'recurring', None),
                        "product": getattr(pr, 'product', None),
                    }
                    for pr in price_map.get(getattr(prod, 'id', None), [])
                ],
            }
            output.append(item)
            
        print('products', output)

        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list products: {str(e)}")


@router.get("/product")
def get_product(product_id: str, request: Request):
    """Fetch a Stripe product by either `product_id` or `productId` query param.

    Optional query param `expand` may be provided (comma-separated) to pass to Stripe retrieve.
    """
    require_stripe_key()
    pid = product_id or productId
    if not pid:
        raise HTTPException(status_code=400, detail='product_id or productId query parameter is required')
    try:
        # Support optional expand query param: ?expand=items.data.price.product
        expand_param = None
        if request is not None:
            expand_param = request.query_params.get('expand')

        if expand_param:
            expand = [e.strip() for e in expand_param.split(',') if e.strip()]
            prod = stripe.Product.retrieve(pid, expand=expand)
        else:
            prod = stripe.Product.retrieve(pid)

        prices = stripe.Price.list(product=pid, limit=50)

        # Normalize response to simple shape
        product_obj = {
            "id": getattr(prod, 'id', None),
            "name": getattr(prod, 'name', None),
            "description": getattr(prod, 'description', None),
            "metadata": getattr(prod, 'metadata', None) or {},
        }

        prices_list = [
            {
                "id": getattr(pr, 'id', None),
                "unit_amount": getattr(pr, 'unit_amount', None),
                "currency": getattr(pr, 'currency', None),
                "recurring": getattr(pr, 'recurring', None),
                "product": getattr(pr, 'product', None),
            }
            for pr in prices.data
        ]

        return {"product": product_obj, "prices": prices_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")


@router.post("/checkout")
async def create_checkout(req: Request, maybe_user: str = Depends(get_optional_user)):
    require_stripe_key()
    body = await req.json()
    price_id = body.get("price_id") or body.get("priceId")
    product_id = body.get("product_id") or body.get("productId")
    # Default success URL should land users on the app overview after purchase
    success_url = body.get("success_url") or (Config.FRONTEND_URL.rstrip('/') + '/overview?session_id={CHECKOUT_SESSION_ID}')
    cancel_url = body.get("cancel_url") or Config.FRONTEND_URL
    # Determine user: prefer authenticated user, fall back to `user_id` in payload for local testing
    user = maybe_user or body.get('user_id') or body.get('userId')

    try:
        if not user:
            raise HTTPException(status_code=401, detail='Missing authenticated user or user_id in payload')

        supabase = get_supabase()
        # Ensure customer exists for user
        user_res = supabase.table('users').select('stripe_customer_id').eq('id', user).execute()
        customer_id = None
        if getattr(user_res, 'data', None) and len(user_res.data) > 0:
            customer_id = user_res.data[0].get('stripe_customer_id')

        # If a customer_id exists, verify it belongs to the current Stripe account/key
        if customer_id:
            try:
                stripe.Customer.retrieve(customer_id)
            except Exception as ex:
                # If the customer does not exist in this Stripe account (e.g., live vs test mismatch), create a new one
                print(f"Stored Stripe customer {customer_id} not found for current key — creating new customer. Error: {ex}")
                customer_id = None

        if not customer_id:
            # create stripe customer
            cust = stripe.Customer.create(metadata={"user_id": user})
            customer_id = cust.id
            # persist to users table
            try:
                supabase.table('users').update({'stripe_customer_id': customer_id}).eq('id', user).execute()
            except Exception as e:
                print(f"Failed to persist stripe_customer_id to users table: {e}")

        # Determine the price to use: accept explicit price_id or product_id
        if not price_id and product_id:
            # find first recurring price for product
            prices = stripe.Price.list(product=product_id, limit=10)
            chosen = None
            for p in prices.data:
                if getattr(p, 'recurring', None):
                    chosen = p.id
                    break
            price_id = chosen

        if not price_id:
            raise HTTPException(status_code=400, detail='price_id or product_id is required')

        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode='subscription',
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user},
        )

        print(f"Created Stripe Checkout session {session.id} for user {user} (customer {customer_id})")
        return {"url": session.url, "id": session.id}
    except Exception as e:
        print(f"Failed to create checkout session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/portal")
async def create_portal(req: Request, user: str = Depends(get_current_user)):
    require_stripe_key()
    body = await req.json()
    return_url = body.get('return_url') or Config.FRONTEND_URL

    try:
        supabase = get_supabase()
        user_res = supabase.table('users').select('stripe_customer_id').eq('id', user).execute()
        customer_id = None
        if getattr(user_res, 'data', None) and len(user_res.data) > 0:
            customer_id = user_res.data[0].get('stripe_customer_id')

        if not customer_id:
            raise HTTPException(status_code=400, detail='No Stripe customer for user')

        portal = stripe.billing_portal.Session.create(customer=customer_id, return_url=return_url)
        return {"url": portal.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create portal session: {str(e)}")


@router.get("/customer")
def get_customer(user: str = Depends(get_current_user)):
    require_stripe_key()
    try:
        supabase = get_supabase()
        user_res = supabase.table('users').select('stripe_customer_id').eq('id', user).execute()
        if not getattr(user_res, 'data', None) or len(user_res.data) == 0:
            raise HTTPException(status_code=404, detail='User not found')
        customer_id = user_res.data[0].get('stripe_customer_id')
        if not customer_id:
            return {"customer": None}

        customer = stripe.Customer.retrieve(customer_id)
        subs = stripe.Subscription.list(customer=customer_id, limit=50)
        payments = stripe.PaymentIntent.list(customer=customer_id, limit=50)
        return {"customer": customer, "subscriptions": subs.data, "payments": payments.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch customer data: {str(e)}")


@router.post('/webhook')
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get('stripe-signature')
    if not Config.STRIPE_WEBHOOK_SECRET:
        # Just return 200 if not configured, but log
        print('Webhook secret not configured; received event')
        return {"received": True}

    try:
        event = stripe.Webhook.construct_event(payload.decode('utf-8'), sig, Config.STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        print('Webhook signature verification failed:', e)
        raise HTTPException(status_code=400, detail='Invalid signature')

    # Handle relevant events
    try:
        if event.type == 'checkout.session.completed':
            session = event.data.object
            customer_id = session.get('customer')
            subscription_id = session.get('subscription')
            metadata = session.get('metadata') or {}
            user_id = metadata.get('user_id')
            # If the session has metadata with user id, persist the customer id
            if user_id:
                    try:
                        supabase = get_supabase()
                        update_data = {'stripe_customer_id': customer_id}
                        
                        # If subscription was created, fetch and store product_id
                        if subscription_id:
                            try:
                                sub = stripe.Subscription.retrieve(subscription_id)
                                update_data['stripe_subscription_id'] = subscription_id
                                
                                # Extract product ID from subscription items
                                if sub.get('items') and sub['items'].get('data'):
                                    price = sub['items']['data'][0].get('price')
                                    if price:
                                        product_id = price.get('product')
                                        if product_id:
                                            update_data['stripe_product_id'] = product_id
                            except Exception as e:
                                print(f"Failed to retrieve subscription {subscription_id}: {e}")
                        
                        supabase.table('users').update(update_data).eq('id', user_id).execute()
                        
                        # Sync usage period on checkout complete to initialize credits for new customers
                        sync_usage_period_from_subscription(user_id)
                        print(f"Persisted Stripe data for user {user_id}: customer={customer_id}, subscription={subscription_id}, product={update_data.get('stripe_product_id')}")
                    except Exception as e:
                        print(f"Failed to persist Stripe data from webhook: {e}")

        elif event.type in ['customer.subscription.created', 'customer.subscription.updated']:
            # Subscription created or entered new billing period - refresh user's activity/credits
            subscription = event.data.object
            customer_id = subscription.get('customer')
            subscription_id = subscription.get('id')
            try:
                # Look up user_id by customer_id
                supabase = get_supabase()
                user_res = supabase.table('users').select('id').eq('stripe_customer_id', customer_id).execute()
                if getattr(user_res, 'data', None) and len(user_res.data) > 0:
                    user_id = user_res.data[0].get('id')
                    
                    # Extract product ID from subscription items
                    update_data = {'stripe_subscription_id': subscription_id}
                    if subscription.get('items') and subscription['items'].get('data'):
                        price = subscription['items']['data'][0].get('price')
                        if price:
                            product_id = price.get('product')
                            if product_id:
                                update_data['stripe_product_id'] = product_id
                    
                    # Update user with subscription and product info
                    supabase.table('users').update(update_data).eq('id', user_id).execute()
                    print(f"Updated Stripe data for user {user_id}: subscription={subscription_id}, product={update_data.get('stripe_product_id')}")
                    
                    # Sync usage period - creates new team_activity row if billing period changed
                    sync_result = sync_usage_period_from_subscription(user_id)
                    if sync_result:
                        print(f"Synced usage period for user {user_id}: period_start={sync_result.get('period_start')}, period_end={sync_result.get('period_end')}")
                    else:
                        print(f"Usage period sync returned None for user {user_id} - may be already in same period")
                else:
                    print(f"No user found for customer_id {customer_id}")
            except Exception as e:
                print(f"Failed to sync usage period from subscription event: {e}")
        
        elif event.type == 'customer.subscription.deleted':
            # Subscription cancelled - clear subscription data
            subscription = event.data.object
            customer_id = subscription.get('customer')
            try:
                supabase = get_supabase()
                user_res = supabase.table('users').select('id').eq('stripe_customer_id', customer_id).execute()
                if getattr(user_res, 'data', None) and len(user_res.data) > 0:
                    user_id = user_res.data[0].get('id')
                    # Clear subscription data
                    supabase.table('users').update({
                        'stripe_subscription_id': None,
                        'stripe_product_id': None
                    }).eq('id', user_id).execute()
                    print(f"Cleared subscription data for user {user_id}")
                else:
                    print(f"No user found for customer_id {customer_id}")
            except Exception as e:
                print(f"Failed to clear subscription data: {e}")

        elif event.type == 'invoice.payment_succeeded':
            # Invoice paid - may indicate period change, try to sync usage as fallback
            invoice = event.data.object
            customer_id = invoice.get('customer')
            try:
                supabase = get_supabase()
                user_res = supabase.table('users').select('id').eq('stripe_customer_id', customer_id).execute()
                if getattr(user_res, 'data', None) and len(user_res.data) > 0:
                    user_id = user_res.data[0].get('id')
                    # Sync usage period - idempotent, safe to call multiple times per period
                    sync_result = sync_usage_period_from_subscription(user_id)
                    if sync_result:
                        print(f"Synced usage period for user {user_id} via invoice: period_start={sync_result.get('period_start')}, period_end={sync_result.get('period_end')}")
                else:
                    print(f"No user found for customer_id {customer_id}")
            except Exception as e:
                print(f"Failed to sync usage period from invoice.payment_succeeded: {e}")

        print(f"Received Stripe webhook: {event.type}")
        return {"received": True}
    except Exception as e:
        print(f'Failed to process webhook: {e}')
        raise HTTPException(status_code=500, detail='Webhook processing error')


@router.get("/invoices")
async def get_invoices(user: str = Depends(get_current_user)):
    """Return recent invoices for the authenticated user."""
    require_stripe_key()
    try:
        supabase = get_supabase()
        user_res = supabase.table('users').select('stripe_customer_id').eq('id', user).execute()
        if not getattr(user_res, 'data', None) or len(user_res.data) == 0:
            raise HTTPException(status_code=404, detail='User not found')
        
        customer_id = user_res.data[0].get('stripe_customer_id')
        if not customer_id:
            return {"invoices": []}

        # Fetch latest invoices
        invoices = stripe.Invoice.list(customer=customer_id, limit=25, status='paid')
        
        normalized_invoices = []
        for inv in invoices.data:
            normalized_invoices.append({
                'id': getattr(inv, 'id', None),
                'amount': getattr(inv, 'amount_paid', None),
                'currency': getattr(inv, 'currency', None),
                'status': getattr(inv, 'status', None),
                'created': getattr(inv, 'created', None),
                'paid_at': getattr(inv, 'paid_at', None),
                'invoice_date': getattr(inv, 'date', None),
                'period_start': getattr(inv, 'period_start', None),
                'period_end': getattr(inv, 'period_end', None),
                'pdf_url': getattr(inv, 'invoice_pdf', None),
            })
        
        return {"invoices": normalized_invoices}
    except Exception as e:
        print(f'[get_invoices] Error: {e}')
        raise HTTPException(status_code=500, detail=f'Failed to fetch invoices: {str(e)}')


@router.post("/upgrade")
async def upgrade_subscription(req: Request, user: str = Depends(get_current_user)):
    """
    Upgrade user's subscription to a new plan immediately
    Handles prorated billing automatically
    
    Body params:
    - new_price_id: Stripe Price ID for the new plan
    - new_product_id: (optional) Stripe Product ID if price_id not provided
    """
    require_stripe_key()
    
    body = await req.json()
    new_price_id = body.get("new_price_id") or body.get("newPriceId") or body.get("priceId")
    new_product_id = body.get("new_product_id") or body.get("newProductId") or body.get("productId")
    
    if not new_price_id and not new_product_id:
        raise HTTPException(status_code=400, detail="new_price_id or new_product_id required")
    
    try:
        supabase = get_supabase()
        
        # Get user's current subscription
        user_res = supabase.table('users')\
            .select('stripe_customer_id, stripe_subscription_id, stripe_product_id')\
            .eq('id', user)\
            .execute()
        
        if not getattr(user_res, 'data', None) or len(user_res.data) == 0:
            raise HTTPException(status_code=404, detail='User not found')
        
        user_data = user_res.data[0]
        customer_id = user_data.get('stripe_customer_id')
        subscription_id = user_data.get('stripe_subscription_id')
        current_product_id = user_data.get('stripe_product_id')
        
        if not subscription_id:
            # User doesn't have a subscription - redirect to checkout instead
            raise HTTPException(
                status_code=400,
                detail='No active subscription. Please use checkout endpoint instead.'
            )
        
        # Resolve price_id from product_id if needed
        if not new_price_id and new_product_id:
            prices = stripe.Price.list(product=new_product_id, active=True, type='recurring', limit=10)
            if prices.data:
                new_price_id = prices.data[0].id
            else:
                raise HTTPException(status_code=404, detail=f'No recurring price found for product {new_product_id}')
        
        # Verify new price is different from current
        current_sub = stripe.Subscription.retrieve(subscription_id)
        current_price_id = current_sub['items']['data'][0]['price']['id']
        
        if current_price_id == new_price_id:
            raise HTTPException(status_code=400, detail='User is already on this plan')
        
        # Get the new price details to extract product
        new_price = stripe.Price.retrieve(new_price_id)
        new_product_id_resolved = new_price.product if hasattr(new_price, 'product') else new_price.get('product')
        
        # Check if this is an upgrade or downgrade (based on price amount)
        current_amount = current_sub['items']['data'][0]['price']['unit_amount']
        new_amount = new_price.unit_amount
        
        is_upgrade = new_amount > current_amount
        proration_behavior = 'always_invoice' if is_upgrade else 'create_prorations'
        
        # Update the subscription with immediate proration
        updated_sub = stripe.Subscription.modify(
            subscription_id,
            items=[{
                'id': current_sub['items']['data'][0]['id'],
                'price': new_price_id,
            }],
            proration_behavior=proration_behavior,  # Immediate billing for upgrades
            billing_cycle_anchor='unchanged',  # Keep same billing date
        )
        
        # Update user record with new product_id
        supabase.table('users').update({
            'stripe_product_id': new_product_id_resolved
        }).eq('id', user).execute()
        
        print(f"Successfully upgraded user {user} from {current_product_id} to {new_product_id_resolved}")
        
        return {
            "success": True,
            "subscription": {
                "id": updated_sub.id,
                "status": updated_sub.status,
                "current_period_end": updated_sub.current_period_end,
                "product_id": new_product_id_resolved,
            },
            "message": f"Successfully upgraded to new plan! {'Prorated charges will be billed immediately.' if is_upgrade else 'Credit will be applied to next invoice.'}"
        }
        
    except stripe.error.StripeError as e:
        print(f"Stripe error upgrading subscription: {e}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to upgrade subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upgrade subscription: {str(e)}")


@router.get("/available-upgrades")
async def get_available_upgrades(user: str = Depends(get_current_user)):
    """
    Get available upgrade options for the current user
    Returns plans that are higher tier than current plan
    """
    require_stripe_key()
    
    try:
        supabase = get_supabase()
        
        # Get user's current product
        user_res = supabase.table('users')\
            .select('stripe_product_id, stripe_subscription_id')\
            .eq('id', user)\
            .execute()
        
        if not getattr(user_res, 'data', None) or len(user_res.data) == 0:
            raise HTTPException(status_code=404, detail='User not found')
        
        user_data = user_res.data[0]
        current_product_id = user_data.get('stripe_product_id')
        
        # Get all active products with prices
        products = stripe.Product.list(active=True, limit=100)
        
        available_upgrades = []
        current_price = 0
        
        for product in products.data:
            # Get the default price for this product
            prices = stripe.Price.list(product=product.id, active=True, type='recurring', limit=1)
            if not prices.data:
                continue
            
            price = prices.data[0]
            price_amount = price.unit_amount or 0
            
            # Track current plan price
            if product.id == current_product_id:
                current_price = price_amount
            
            # Build product info
            product_info = {
                "product_id": product.id,
                "price_id": price.id,
                "name": product.name,
                "description": product.description,
                "amount": price_amount / 100,  # Convert cents to dollars
                "currency": price.currency,
                "interval": price.recurring.get('interval') if price.recurring else 'month',
                "metadata": product.metadata or {},
            }
            
            available_upgrades.append(product_info)
        
        # Filter to only higher-priced plans
        upgrade_options = [
            p for p in available_upgrades 
            if (p['amount'] * 100) > current_price
        ]
        
        # Sort by price ascending
        upgrade_options.sort(key=lambda x: x['amount'])
        
        return {
            "current_product_id": current_product_id,
            "upgrades": upgrade_options
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to fetch upgrade options: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch upgrade options: {str(e)}")


@router.get("/subscription")
async def get_subscription(user: str = Depends(get_current_user), request: Request = None):
    """Return the current Stripe subscription for the authenticated user using Stripe SDK."""
    try:
        require_stripe_key()
        supabase = get_supabase()
        
        # Parse expand param from query string
        expand_param = request.query_params.get("expand")
        expand_list = []
        if expand_param:
            try:
                expand_list = json.loads(expand_param) if isinstance(expand_param, str) else expand_param
                if not isinstance(expand_list, list):
                    expand_list = []
            except:
                expand_list = []
        
        print(f'[get_subscription] expand_list: {expand_list}')
        
        # Fetch the customer's stripe_customer_id from users table
        user_res = supabase.table('users').select('stripe_customer_id').eq('id', user).execute()
        if not getattr(user_res, 'data', None) or len(user_res.data) == 0:
            print(f'[get_subscription] User {user} not found in database')
            raise HTTPException(status_code=404, detail='User not found')

        customer_id = user_res.data[0].get('stripe_customer_id')
        if not customer_id:
            print(f'[get_subscription] User {user} has no stripe_customer_id')
            raise HTTPException(status_code=404, detail='No Stripe customer configured for this user')

        print(f'[get_subscription] Fetching subscriptions for customer {customer_id}')
        
        # Filter out product expansion (too deep) and make separate call for products
        safe_expand = [e for e in expand_list if 'product' not in e]
        
        # Simple Stripe SDK call - list subscriptions for this customer
        try:
            if safe_expand:
                stripe_subs = stripe.Subscription.list(
                    customer=customer_id,
                    limit=1,
                    expand=safe_expand
                )
            else:
                stripe_subs = stripe.Subscription.list(
                    customer=customer_id,
                    limit=1,
                )
        except Exception as e:
            print(f'[get_subscription] Stripe API error: {e}')
            raise HTTPException(status_code=500, detail=f'Failed to fetch subscription from Stripe: {str(e)}')

        # Check if we got any subscriptions
        if not stripe_subs or not getattr(stripe_subs, 'data', None) or len(stripe_subs.data) == 0:
            print(f'[get_subscription] No subscriptions found for customer {customer_id}')
            return {'subscription': None}

        # Extract first subscription and normalize response
        sub = stripe_subs.data[0]
        print(f'[get_subscription] Found subscription: {sub.id}, status: {sub.status}')
        
        # Collect product IDs from items
        product_ids = set()
        try:
            # Try dict-like access first (Stripe objects support both attribute and dict access)
            items_obj = sub.get('items') if hasattr(sub, 'get') else getattr(sub, 'items', None)
            print(f'[get_subscription] items_obj (dict attempt): {items_obj}')
            
            if items_obj is None:
                print('[get_subscription] items_obj is None, skipping product collection')
            elif isinstance(items_obj, dict):
                items_data = items_obj.get('data', [])
                print(f'[get_subscription] items_data from dict: {len(items_data) if items_data else 0} items')
                for item in items_data:
                    price_id = item.get('price')
                    if price_id:
                        product_id = price_id.get('product') if isinstance(price_id, dict) else price_id
                        if product_id and isinstance(product_id, str):
                            product_ids.add(product_id)
        except Exception as e:
            print(f'[get_subscription] Error collecting product IDs: {e}', exc_info=True)
        
        # Fetch products separately to avoid expansion depth limit
        products_map = {}
        for product_id in product_ids:
            try:
                product = stripe.Product.retrieve(product_id)
                products_map[product_id] = product
                print(f'[get_subscription] Fetched product {product_id}: {product.name}')
            except Exception as e:
                print(f'[get_subscription] Failed to fetch product {product_id}: {e}')
        
        # Build normalized response directly from Stripe object
        enriched = {
            'id': getattr(sub, 'id', None),
            'customer': customer_id,
            'status': getattr(sub, 'status', None),
            'current_period_start': getattr(sub, 'created', None),  # Use created timestamp
            'current_period_end': None,  # Will be calculated from items
            'items': {'data': []},
        }

        # Process items and prices
        try:
            # Try dict-like access for items
            items_obj = sub.get('items') if hasattr(sub, 'get') else getattr(sub, 'items', None)
            print(f'[get_subscription] items_obj for processing: {type(items_obj)}')
            
            if items_obj and isinstance(items_obj, dict):
                items_data = items_obj.get('data', [])
                print(f'[get_subscription] Processing {len(items_data)} items')
                
                for idx, item in enumerate(items_data):
                    print(f'[get_subscription] Processing item {idx}')
                    price_data = item.get('price') if isinstance(item, dict) else getattr(item, 'price', None)
                    print(f'[get_subscription] price_data type: {type(price_data)}')
                    
                    if price_data:
                        # Handle both dict and object access
                        if isinstance(price_data, dict):
                            product_id = price_data.get('product')
                            price_id = price_data.get('id')
                            unit_amount = price_data.get('unit_amount')
                            currency = price_data.get('currency')
                            recurring = price_data.get('recurring')
                        else:
                            product_id = getattr(price_data, 'product', None)
                            price_id = getattr(price_data, 'id', None)
                            unit_amount = getattr(price_data, 'unit_amount', None)
                            currency = getattr(price_data, 'currency', None)
                            recurring = getattr(price_data, 'recurring', None)
                        
                        item_dict = {
                            'id': item.get('id') if isinstance(item, dict) else getattr(item, 'id', None),
                            'quantity': item.get('quantity') if isinstance(item, dict) else getattr(item, 'quantity', None),
                            'price': {
                                'id': price_id,
                                'amount': unit_amount,
                                'currency': currency,
                                'recurring': recurring,
                                'product': None,
                            }
                        }
                        
                        # Attach product info (from separately fetched products map)
                        if product_id and product_id in products_map:
                            product = products_map[product_id]
                            item_dict['price']['product'] = {
                                'id': getattr(product, 'id', None),
                                'name': getattr(product, 'name', None),
                                'description': getattr(product, 'description', None),
                                'metadata': getattr(product, 'metadata', None) or {},
                            }
                        elif product_id:
                            # Product fetch failed, just store ID
                            item_dict['price']['product'] = {'id': product_id}
                        
                        print(f'[get_subscription] Appending item: {item_dict["id"]}')
                        enriched['items']['data'].append(item_dict)
                        
                        # Capture next billing date from first item
                        if enriched['current_period_end'] is None:
                            item_period_end = item.get('current_period_end') if isinstance(item, dict) else getattr(item, 'current_period_end', None)
                            print(f'[get_subscription] item_period_end: {item_period_end}')
                            if item_period_end:
                                enriched['current_period_end'] = item_period_end
                    else:
                        print(f'[get_subscription] No price_data for item {idx}')
            else:
                print(f'[get_subscription] items_obj is not a dict: {type(items_obj)}')
        except Exception as e:
            print(f'[get_subscription] Error processing items: {e}', exc_info=True)
            
        # Calculate display price from first item
        if enriched['items']['data']:
            first_price = enriched['items']['data'][0].get('price')
            if first_price and first_price.get('amount'):
                amount = first_price['amount']
                enriched['amount_due'] = amount
                enriched['amount_due_display'] = f"${amount / 100:.2f}"
                enriched['currency'] = first_price.get('currency', 'usd').upper()

        print(f'[get_subscription] Returning subscription with {len(enriched["items"]["data"])} items')
        return {'subscription': enriched}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f'[get_subscription] Unexpected error: {e}')
        raise HTTPException(status_code=500, detail=f'Failed to fetch subscription: {str(e)}')
