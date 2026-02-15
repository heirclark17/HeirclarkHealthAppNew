#!/usr/bin/env python3
import psycopg2

# Railway database connection
DATABASE_URL = "postgresql://postgres:nDGNPPsAqwbVUJzKQwePfQFtuVsrFCrN@switchyard.proxy.rlwy.net:46327/railway"

def check_tables():
    try:
        print("Connecting to Railway database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        print("\nChecking available tables...")
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()
        if tables:
            print("\n[SUCCESS] Available tables:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("[WARNING] No tables found")

        # Check workout_plans structure
        print("\n\nChecking workout_plans columns...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'workout_plans'
            ORDER BY ordinal_position;
        """)

        columns = cursor.fetchall()
        if columns:
            print("\n[SUCCESS] workout_plans structure:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"[ERROR] Failed: {e}")
        return False

if __name__ == "__main__":
    check_tables()
