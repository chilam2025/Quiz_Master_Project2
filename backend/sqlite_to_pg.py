import sqlite3
import pandas as pd
from sqlalchemy import create_engine

# --- SQLite ---
sqlite_conn = sqlite3.connect("quiz.db")

# --- PostgreSQL (Render) ---
pg_engine = create_engine(
          "postgresql+psycopg2://quiz_db_14ek_user:V1DJtyn9RYFKN2p6Tx1WcoTSZ4NvDAHH@dpg-d4ti9hbuibrs73ano130-a.oregon-postgres.render.com:5432/quiz_db_14ek?sslmode=require"

)

# 3. Get all SQLite tables
tables = pd.read_sql(
    "SELECT name FROM sqlite_master WHERE type='table';",
    sqlite_conn
)

# 4. Migrate table by table
for table_name in tables['name']:
    print(f"Migrating {table_name}...")
    df = pd.read_sql(f"SELECT * FROM {table_name}", sqlite_conn)
    df.to_sql(table_name, pg_engine, if_exists='append', index=False)

print("Migration completed successfully.")
