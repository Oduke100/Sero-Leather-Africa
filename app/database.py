# app/database.py
# ─────────────────────────────────────────────
#  Database connection factory.
#  Every endpoint calls get_connection(), uses
#  it, then closes it in a finally block.
# ─────────────────────────────────────────────

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """Return a raw psycopg2 connection from DATABASE_URL."""
    try:
        return psycopg2.connect(os.getenv("DATABASE_URL"))
    except Exception as e:
        raise Exception(f"Could not connect to the database: {e}")