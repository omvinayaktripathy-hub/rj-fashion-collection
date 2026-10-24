import sqlite3

conn = sqlite3.connect(r"database\database.sqlite")
cursor = conn.cursor()
cursor.execute("PRAGMA wal_checkpoint(TRUNCATE);")
print("Checkpoint result:", cursor.fetchall())
cursor.execute("PRAGMA integrity_check;")
print("Integrity check:", cursor.fetchall())
conn.close()
