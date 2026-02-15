#!/usr/bin/env python3
import psycopg2
import sys

# Railway database connection
DATABASE_URL = "postgresql://postgres:nDGNPPsAqwbVUJzKQwePfQFtuVsrFCrN@switchyard.proxy.rlwy.net:46327/railway"

def run_migration():
    try:
        print("Connecting to Railway database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        print("Running migration: Adding cardio_recommendations and nutrition_guidance columns...")

        # Run migration SQL
        cursor.execute("""
            ALTER TABLE workout_plans
            ADD COLUMN IF NOT EXISTS cardio_recommendations JSONB,
            ADD COLUMN IF NOT EXISTS nutrition_guidance JSONB;
        """)

        conn.commit()
        print("[SUCCESS] Migration completed successfully!")

        # Verify columns were added
        print("\nVerifying columns...")
        cursor.execute("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'workout_plans'
            AND column_name IN ('cardio_recommendations', 'nutrition_guidance')
            ORDER BY column_name;
        """)

        results = cursor.fetchall()
        if results:
            print("\n[SUCCESS] Columns verified:")
            for row in results:
                print(f"  - {row[0]}: {row[1]}")
        else:
            print("[WARNING] Could not verify columns")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
