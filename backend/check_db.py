import psycopg2

try:
    conn = psycopg2.connect(
        host='127.0.0.1',
        port=5432,
        user='postgres',
        password='',
        dbname='ux_auditor'
    )
    print("Connected to PostgreSQL OK")
    cur = conn.cursor()
    cur.execute("SELECT name, email FROM users WHERE email = 'aswi@gmail.com'")
    r = cur.fetchone()
    print("Default user exists:", r)
    conn.close()
except Exception as e:
    print(f"Connection error: {e}")
