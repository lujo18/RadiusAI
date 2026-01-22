import os
from supabase import create_client, Client

# Initialize Supabase client for stripe schema
def get_supabase_client() -> Client:
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        raise RuntimeError("Missing Supabase credentials")
    return create_client(supabase_url, supabase_key)

# Returns all Stripe accounts from Supabase (stripe schema)
def get_stripe_accounts():
    supabase = get_supabase_client()
    resp = supabase.table("stripe.accounts").select("*").execute()
    if resp.error:
        raise RuntimeError(f"Supabase error: {resp.error.message}")
    return resp.data

# Returns all Stripe plans from Supabase (stripe schema)
def get_stripe_plans():
    supabase = get_supabase_client()
    resp = supabase.table("stripe.plans").select("*").execute()
    if resp.error:
        raise RuntimeError(f"Supabase error: {resp.error.message}")
    return resp.data

# Returns all Stripe products from Supabase (stripe schema) with their default price
def get_stripe_products():
    supabase = get_supabase_client()
    # Select all product fields plus join the default_price from prices table
    resp = supabase.table("stripe.products") \
        .select("*, default_price:default_price(*), price:prices!default_price(*)") \
        .execute()
    if resp.error:
        raise RuntimeError(f"Supabase error: {resp.error.message}")
    return resp.data
