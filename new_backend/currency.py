from decimal import Decimal
from database import SessionLocal
from models import Currency

# ── helpers ───────────────────────────────────────────────────────────────────
def get_rates(db) -> dict:
    rows = db.query(Currency).filter(Currency.is_active == True).all()
    return {"KES": Decimal("1.0"), **{r.code.upper(): Decimal(str(r.rate_to_kes)) for r in rows}}

def get_supported(db) -> list:
    rows = db.query(Currency).filter(Currency.is_active == True).all()
    return ["KES"] + [r.code.upper() for r in rows]

# ── conversion ────────────────────────────────────────────────────────────────
def convert(amount: Decimal, currency: str, db=None) -> Decimal:
    currency = currency.upper()
    if currency == "KES":
        return round(amount, 2)
    close = db is None
    if close:
        db = SessionLocal()
    try:
        rate = get_rates(db).get(currency, Decimal("1.0"))
        return round(amount * rate, 2)
    finally:
        if close:
            db.close()