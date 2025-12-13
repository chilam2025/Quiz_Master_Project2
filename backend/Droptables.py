import psycopg2

DATABASE_URL = "postgresql://quiz_db_14ek_user:V1DJtyn9RYFKN2p6Tx1WcoTSZ4NvDAHH@dpg-d4ti9hbuibrs73ano130-a.oregon-postgres.render.com/quiz_db_14ek"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute('DROP TABLE question CASCADE;')
cur.execute('DROP TABLE quiz CASCADE;')
cur.execute('DROP TABLE quiz_attempt CASCADE;')
cur.execute('DROP TABLE "user" CASCADE;')  # user is reserved, need quotes

conn.commit()
cur.close()
conn.close()

print("Tables dropped successfully")
