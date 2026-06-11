import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Admin
from auth import hash_password

db = SessionLocal()

admin = Admin(
    username        = "admin",
    hashed_password = hash_password("changethispassword")
)

db.add(admin)
db.commit()
db.close()

print("Admin created!")