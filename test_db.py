# test_db.py
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")
print("Usando URL:", "(oculta)" if url else "(no definida)")

if not url:
    raise SystemExit("DATABASE_URL no definida en .env")

engine = create_engine(url)

with engine.connect() as conn:
    res = conn.execute(text("SELECT VERSION()"))
    version = res.scalar()
    print("Versión del servidor:", version)
