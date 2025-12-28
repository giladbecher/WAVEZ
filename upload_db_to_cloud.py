import sqlite3
import pandas as pd
from supabase import create_client, Client
import os
import time

# --- הגדרות ---
SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co"
SUPABASE_KEY = "sb_publishable_3n-9eFTLx35UCwSOukmPgA_ztCsNINC"
LOCAL_DB_PATH = r"C:\WAVEZ\wavez.db"

def migrate_local_sql_to_cloud():
    print("⏳ Connecting to Supabase Cloud...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Cloud!")
    except Exception as e:
        print(f"❌ Cloud Connection Failed: {e}")
        return

    print(f"⏳ Reading local database: {LOCAL_DB_PATH}...")
    if not os.path.exists(LOCAL_DB_PATH):
        print("❌ Local database file not found!")
        return

    try:
        # 1. קריאה מה-DB המקומי
        conn = sqlite3.connect(LOCAL_DB_PATH)
        df = pd.read_sql_query("SELECT * FROM measurements", conn)
        conn.close()
        
        if df.empty:
            print("⚠️ Local database is empty.")
            return

        print(f"📊 Found {len(df)} records in local DB.")

        # 2. ניקוי והתאמה לענן
        # מורידים את עמודת ה-ID (כי הענן מייצר ID חדש משלו)
        if 'id' in df.columns:
            df = df.drop(columns=['id'])
            
        # המרת תאריכים לפורמט סטנדרטי
        df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime("%Y-%m-%d %H:%M:%S")
        
        # טיפול בערכים חסרים (NaN) - הופכים ל-None או 0 כדי ש-Supabase לא יקרוס
        df = df.where(pd.notnull(df), None)

        # המרה לרשימה של מילונים (Dictionaries)
        records = df.to_dict(orient='records')

        print(f"🚀 Starting upload of {len(records)} records...")
        
        # 3. העלאה במנות (Chunks) של 50 כדי לא להעמיס
        chunk_size = 50
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            try:
                supabase.table("measurements").insert(chunk).execute()
                print(f"   ✅ Uploaded batch {i} - {i + len(chunk)}")
                time.sleep(0.1) 
            except Exception as e:
                print(f"   ❌ Error uploading batch {i}: {e}")

        print("\n✨ MIGRATION COMPLETE! ✨")

    except Exception as e:
        print(f"❌ Critical Error: {e}")

if __name__ == "__main__":
    migrate_local_sql_to_cloud()