import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_url = os.getenv("SUPABASE_URL")
_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not _url or not _key:
    raise ValueError(
        "Missing Supabase configuration. "
        "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
    )


def get_supabase() -> Client:
    """
    Create a fresh Supabase client for each request.
    This avoids stale HTTP/2 connections being reused after network drops
    (common on restrictive networks like school/corporate WiFi).
    """
    return create_client(_url, _key)
