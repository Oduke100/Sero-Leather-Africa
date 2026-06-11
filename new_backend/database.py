from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# ── env & config ──────────────────────────────────────────────────────────────
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# ── engine & session ──────────────────────────────────────────────────────────
engine       = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ── base model ────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass