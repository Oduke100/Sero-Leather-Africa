import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dependancies import get_db
from models import Admin

# ── config ────────────────────────────────────────────────────────────────────
SECRET_KEY         = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set in the environment. Set it before starting the app.")
ALGORITHM          = "HS256"
TOKEN_EXPIRE_HOURS = 8

pwd_context  = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="admin/login")

# ── helpers ───────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ── guard ─────────────────────────────────────────────────────────────────────
def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    err = HTTPException(status_code=401, detail="Invalid or expired session")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise err
    except JWTError:
        raise err
    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None:
        raise err
    if admin.active_token != token:
        raise HTTPException(status_code=401, detail="Session expired, logged in from another device")
    return admin