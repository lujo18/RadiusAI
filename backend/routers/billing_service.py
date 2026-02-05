import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from auth import get_current_user, get_optional_user
from services.integrations.supabase.client import get_supabase, get_stripe_supabase
from config import Config
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
    try:
        products = stripe.Product.list(limit=50)
        prices = stripe.Price.list(limit=200)

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

        return {"products": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list products: {str(e)}")


@router.get("/product")
def get_product(product_id: str = None, productId: str = None, request: Request = None):
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
            metadata = session.get('metadata') or {}
            user_id = metadata.get('user_id')
            # If the session has metadata with user id, persist the customer id
            if user_id:
                    try:
                        supabase = get_supabase()
                        supabase.table('users').update({'stripe_customer_id': customer_id}).eq('id', user_id).execute()
                        print(f"Persisted stripe_customer_id {customer_id} for user {user_id} from webhook")
                    except Exception as e:
                        print(f"Failed to persist stripe_customer_id from webhook: {e}")

        # Additional event handling can go here (invoice.payment_succeeded, customer.subscription.created)

        print(f"Received Stripe webhook: {event.type}")
        return {"received": True}
    except Exception as e:
        print(f'Failed to process webhook: {e}')
        raise HTTPException(status_code=500, detail='Webhook processing error')


@router.get('/subscription')
def get_subscription(request: Request, user: str = Depends(get_current_user)):
    """Return the current Stripe subscription for the authenticated user.

    This looks up the user's `stripe_customer_id` from the `users` table
    then queries the `stripe.subscriptions` table (via the service role key)
    to return the latest subscription row.
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

        # Use Stripe SDK directly to fetch latest subscription for the customer.
        # Support optional expand query param (JSON-encoded array) passed from frontend.
        # To avoid Stripe's deep expansion limits, we strip any trailing '.product' segments
        # from the requested expands and perform product retrieval server-side.
        raw_expand = request.query_params.get('expand') if request is not None else None

        product_expand_requested = False
        safe_expand = None
        if raw_expand:
            try:
                requested = json.loads(raw_expand)
                if isinstance(requested, list):
                    # Detect whether caller asked for product expansion somewhere
                    product_expand_requested = any('product' in str(e) for e in requested)
                    # Build a safe expand list by removing '.product' suffixes to avoid depth limits
                    safe_list = []
                    for e in requested:
                        if isinstance(e, str) and '.product' in e:
                            safe_list.append(e.replace('.product', ''))
                        else:
                            safe_list.append(e)
                    # Dedupe while preserving order
                    seen = set()
                    safe_expand = []
                    for e in safe_list:
                        if e not in seen:
                            seen.add(e)
                            safe_expand.append(e)
                else:
                    safe_expand = None
            except Exception:
                safe_expand = None

        if stripe.api_key and customer_id:
            try:
                if safe_expand:
                    stripe_subs = stripe.Subscription.list(customer=customer_id, limit=1, expand=safe_expand)
                else:
                    stripe_subs = stripe.Subscription.list(customer=customer_id, limit=1)


                if stripe_subs and getattr(stripe_subs, 'data', None) and len(stripe_subs.data) > 0:
                    s = stripe_subs.data[0]
                    # Debug: print raw subscription and items to help diagnose empty items.data
                    try:
                        print("[DEBUG] Raw Stripe subscription repr:", repr(s))
                    except Exception:
                        try:
                            print("[DEBUG] Raw Stripe subscription str:", str(s))
                        except Exception:
                            pass
                    try:
                        # Prefer dict-like access (Stripe objects support .get)
                        if hasattr(s, 'get'):
                            items_debug = s.get('items')
                        else:
                            tmp = getattr(s, 'items', None)
                            items_debug = tmp if not callable(tmp) else None
                        print("[DEBUG] items attribute:", items_debug)
                        items_len = 0
                        if items_debug:
                            if isinstance(items_debug, dict):
                                items_len = len(items_debug.get('data', []))
                            else:
                                items_len = len(getattr(items_debug, 'data', []) if getattr(items_debug, 'data', None) else [])
                        print("[DEBUG] items.data length:", items_len)
                    except Exception as _:
                        print("[DEBUG] failed to introspect items attribute")
                    # Normalize/enrich subscription returned from Stripe SDK
                    enriched = {
                        'id': getattr(s, 'id', None),
                        'status': getattr(s, 'status', None),
                        'current_period_end': getattr(s, 'current_period_end', None),
                        'items': {'data': []},
                    }

                    # Try to extract items and price objects (prices may be expanded)
                    try:
                        # Read items using dict-like access when possible
                        if hasattr(s, 'get'):
                            items = s.get('items')
                        else:
                            tmp = getattr(s, 'items', None)
                            items = tmp if not callable(tmp) else None
                        if items and (getattr(items, 'data', None) or (isinstance(items, dict) and items.get('data'))):
                            product_ids = set()
                            data_iter = items.data if getattr(items, 'data', None) else items.get('data', [])
                            for it in data_iter:
                                # get price object or id
                                price_obj = None
                                if isinstance(it, dict):
                                    price_obj = it.get('price')
                                else:
                                    price_obj = getattr(it, 'price', None)

                                # normalize price to plain dict
                                price_dict = None
                                try:
                                    if hasattr(price_obj, 'to_dict'):
                                        price_dict = price_obj.to_dict()
                                    elif isinstance(price_obj, dict):
                                        price_dict = price_obj
                                    else:
                                        price_dict = {
                                            'id': getattr(price_obj, 'id', None),
                                            'unit_amount': getattr(price_obj, 'unit_amount', None),
                                            'currency': getattr(price_obj, 'currency', None),
                                            'product': getattr(price_obj, 'product', None) if price_obj is not None else None,
                                        }
                                except Exception:
                                    price_dict = {'id': None}

                                if isinstance(price_dict.get('product'), str):
                                    product_ids.add(price_dict.get('product'))

                                # Extract per-item period end if available (period.end, current_period_end, or billing_cycle_anchor)
                                period_end = None
                                try:
                                    if isinstance(it, dict):
                                        # possible shapes: { 'period': { 'start': ..., 'end': ... } } or 'current_period_end' fields
                                        period_obj = it.get('period') or it.get('current_period_end') or it.get('billing_cycle_anchor')
                                        if isinstance(period_obj, dict):
                                            period_end = period_obj.get('end') or period_obj.get('current_period_end')
                                        else:
                                            period_end = period_obj
                                    else:
                                        # object-like access
                                        period_obj = getattr(it, 'period', None)
                                        if period_obj is not None:
                                            if hasattr(period_obj, 'get'):
                                                period_end = period_obj.get('end') or period_obj.get('current_period_end')
                                            else:
                                                period_end = getattr(period_obj, 'end', None) or getattr(period_obj, 'current_period_end', None)
                                        if not period_end:
                                            period_end = getattr(it, 'current_period_end', None) or getattr(it, 'billing_cycle_anchor', None)
                                except Exception:
                                    period_end = None

                                item_out = {
                                    'id': getattr(it, 'id', None) if not isinstance(it, dict) else it.get('id'),
                                    'price': price_dict,
                                    'current_period_end': period_end,
                                }
                                enriched['items']['data'].append(item_out)

                            # If caller requested product expansion, fetch product objects separately
                            # (avoids deep expansion limit). Prefer Supabase cached products first.
                            if product_expand_requested and len(product_ids) > 0:
                                product_map = {}
                                # Try to read cached products from Supabase stripe.products
                                try:
                                    stripe_supabase = get_stripe_supabase()
                                    sup_res = stripe_supabase.table('products').select('*').in_('id', list(product_ids)).execute()
                                    if getattr(sup_res, 'data', None):
                                        for p in sup_res.data:
                                            pid = p.get('id')
                                            if pid:
                                                product_map[pid] = p
                                except Exception as e:
                                    print(f"Supabase products cache read failed: {e}")

                                # Fetch any missing product objects from Stripe and upsert to cache
                                missing = [pid for pid in product_ids if pid not in product_map]
                                for pid in missing:
                                    try:
                                        prod = stripe.Product.retrieve(pid)
                                        prod_dict = {
                                            'id': getattr(prod, 'id', None),
                                            'name': getattr(prod, 'name', None),
                                            'description': getattr(prod, 'description', None),
                                            'metadata': getattr(prod, 'metadata', None) or {},
                                        }
                                        product_map[pid] = prod_dict
                                        # attempt to upsert into Supabase cache (best-effort)
                                        try:
                                            if 'stripe_supabase' in locals():
                                                stripe_supabase.table('products').upsert(prod_dict).execute()
                                        except Exception as e:
                                            print(f"Failed to upsert product {pid} to supabase cache: {e}")
                                    except Exception as ex:
                                        print(f"Failed to retrieve product {pid} from Stripe: {ex}")
                                        continue

                                # attach product objects into price.product where applicable
                                for it in enriched['items']['data']:
                                    p = it.get('price')
                                    pid = p.get('product') if isinstance(p, dict) else None
                                    if pid and pid in product_map:
                                        p['product'] = product_map[pid]

                            # Populate top-level plan shorthand from first item if available
                            first_price = enriched['items']['data'][0].get('price')
                            if first_price:
                                enriched['plan'] = first_price
                                try:
                                    amount = first_price.get('unit_amount') or first_price.get('amount')
                                    if amount:
                                        enriched['amount_due'] = int(amount)
                                        enriched['amount_due_display'] = f"{int(amount) / 100:.2f}"
                                        enriched['currency'] = first_price.get('currency') or 'usd'
                                except Exception:
                                    pass
                            # If subscription-level current_period_end is missing, prefer item-level period end
                            try:
                                if not enriched.get('current_period_end'):
                                    for it in enriched.get('items', {}).get('data', []):
                                        item_period = it.get('current_period_end')
                                        if item_period:
                                            enriched['current_period_end'] = item_period
                                            break
                            except Exception:
                                pass
                    except Exception:
                        print("Failed to extract plan info from Stripe subscription")

                    return {'subscription': enriched}
            except Exception as e:
                logger.exception("Stripe API subscription fetch failed: %s", e)
        # If Stripe API returned no subscriptions, try reading the synced `stripe.subscriptions` table
        try:
            stripe_supabase = get_stripe_supabase()
            sub_res = stripe_supabase.table('subscriptions').select('*').eq('customer', customer_id).order('created_at', desc=True).limit(1).execute()
            sub_status = getattr(sub_res, 'status_code', None)
            sub_error = getattr(sub_res, 'error', None)
            if getattr(sub_res, 'data', None) and len(sub_res.data) > 0:
                row = sub_res.data[0]
                # Normalize shape similar to enriched above
                enriched = {
                    'id': row.get('id'),
                    'status': row.get('status'),
                    'current_period_end': row.get('current_period_end'),
                    'plan': row.get('plan'),
                    'amount_due': None,
                }
                # Try to extract plan info from synced JSON
                try:
                    plan = row.get('plan')
                    if isinstance(plan, dict):
                        amount = plan.get('unit_amount') or plan.get('amount')
                        if amount:
                            enriched['amount_due'] = int(amount)
                            enriched['amount_due_display'] = f"{int(amount) / 100:.2f}"
                            enriched['currency'] = plan.get('currency') or 'usd'
                        product_id = plan.get('product')
                        if product_id:
                            enriched['product_id'] = product_id
                except Exception:
                    pass

                # Attach product if synced products table has it
                try:
                    prod_res = stripe_supabase.table('products').select('*').eq('id', enriched.get('product_id')).limit(1).execute()
                    if getattr(prod_res, 'data', None) and len(prod_res.data) > 0:
                        enriched['product'] = prod_res.data[0]
                except Exception:
                    pass

                return {'subscription': enriched}
            else:
                # Log diagnostic info if the service-role request failed
                if sub_status == 403 or sub_error:
                    print(f"Failed to read synced subscriptions for customer {customer_id}: {sub_error or sub_status}")
        except Exception as e:
            print(f"Error querying synced stripe.subscriptions: {e}")

        # Nothing found
        return {'subscription': None}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to fetch subscription: {str(e)}')
