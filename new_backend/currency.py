from decimal import Decimal
from database import SessionLocal
from models import Currency

def get_rates(db) -> dict:
    rows = db.query(Currency).filter(Currency.is_active == True).all()
    rates = {"KES": Decimal("1.0")}
    for r in rows:
        rates[r.code.upper()] = Decimal(str(r.rate_to_kes))
    return rates

def convert(amount: Decimal, currency: str, db=None) -> Decimal:
    currency = currency.upper()
    if currency == "KES":
        return round(amount, 2)
    if db is None:
        db = SessionLocal()
        close = True
    else:
        close = False
    try:
        rates = get_rates(db)
        rate = rates.get(currency, Decimal("1.0"))
        return round(amount * rate, 2)
    finally:
        if close:
            db.close()

def get_supported(db) -> list:
    rows = db.query(Currency).filter(Currency.is_active == True).all()
    return ["KES"] + [r.code.upper() for r in rows]
