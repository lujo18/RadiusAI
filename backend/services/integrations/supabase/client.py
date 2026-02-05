from supabase.client import create_client, Client, ClientOptions
from config import Config


def get_supabase() -> Client:
    url = Config.SUPABASE_URL
    key = Config.SUPABASE_SERVICE_ROLE_KEY

    if url is None or key is None:
        raise ValueError(
            "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        )

    supabase: Client = create_client(url, key)
    return supabase


def get_stripe_supabase() -> Client:
    url = Config.SUPABASE_URL
    key = Config.SUPABASE_SERVICE_ROLE_KEY

    if url is None or key is None:
        raise ValueError(
            "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        )

    options = ClientOptions(schema="stripe")

    supabase: Client = create_client(url, key, options)
    return supabase
