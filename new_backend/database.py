from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# ── env & engine ──────────────────────────────────────────────────────────────
load_dotenv()

engine       = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(bind=engine)

# ── base ──────────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass