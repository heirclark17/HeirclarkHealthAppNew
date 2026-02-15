#!/usr/bin/env python3
import psycopg2

# Railway database connection
DATABASE_URL = "postgresql://postgres:nDGNPPsAqwbVUJzKQwePfQFtuVsrFCrN@switchyard.proxy.rlwy.net:46327/railway"

def check_user_profiles():
    try:
        print("Connecting to Railway database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Check user_profiles structure
        print("\nChecking user_profiles columns...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'user_profiles'
            ORDER BY ordinal_position;
        """)

        columns = cursor.fetchall()
        if columns:
            print("\n[SUCCESS] user_profiles structure:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")

        # Check user_goals structure
        print("\n\nChecking user_goals columns...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'user_goals'
            ORDER BY ordinal_position;
        """)

        columns = cursor.fetchall()
        if columns:
            print("\n[SUCCESS] user_goals structure:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"[ERROR] Failed: {e}")
        return False

if __name__ == "__main__":
    check_user_profiles()
