"""
Migration script to add transaction_id column to payments table.
This is needed for duplicate receipt detection.
"""
import sqlite3
import os

# Database path - sql_app.db is in the project root
db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'sql_app.db')

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute('PRAGMA table_info(payments)')
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Existing columns in payments table: {columns}")
    
    if 'transaction_id' not in columns:
        print("Adding transaction_id column...")
        # SQLite doesn't allow adding UNIQUE constraint with ALTER TABLE
        # We add the column without UNIQUE, then create a unique index
        cursor.execute('ALTER TABLE payments ADD COLUMN transaction_id VARCHAR')
        conn.commit()
        print("✅ transaction_id column added successfully!")
    else:
        print("✅ transaction_id column already exists.")
    
    # Create unique index if not exists
    try:
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS ix_payments_transaction_id ON payments(transaction_id)')
        conn.commit()
        print("✅ Unique index created successfully!")
    except sqlite3.OperationalError as e:
        if "already exists" in str(e):
            print("✅ Unique index already exists.")
        else:
            print(f"Warning: Could not create index: {e}")
    
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
