import os
from functools import lru_cache
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


@lru_cache()
def get_supabase_client() -> Client:
    """
    Get a cached Supabase client instance.
    Uses the service role key for backend operations.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError(
            "Missing Supabase configuration. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
        )
    
    return create_client(url, key)


def get_supabase() -> Client:
    """Dependency for FastAPI routes to get Supabase client."""
    return get_supabase_client()
