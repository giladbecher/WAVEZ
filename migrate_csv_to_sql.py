import pandas as pd
import sqlite3
import os

# --- נתיבים ---
BASE_DIR = r"C:\WAVEZ"
CSV_PATH = os.path.join(BASE_DIR, "WAVEZ DATA.csv")
DB_PATH = os.path.join(BASE_DIR, "wavez.db")

def migrate_data():
    print("⏳ Reading old CSV data...")
    
    if not os.path.exists(CSV_PATH):
        print("❌ CSV file not found!")
        return

    try:
        # 1. קריאת ה-CSV
        df = pd.read_csv(CSV_PATH, on_bad_lines='skip')
        df.columns = df.columns.str.strip() # ניקוי רווחים בשמות עמודות
        
        print(f"   Found {len(df)} rows in CSV.")

        # 2. התאמת הנתונים למבנה החדש של SQL
        # יצירת עמודת זמן אחודה (timestamp) במקום Date ו-Time נפרדים
        df['timestamp'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], dayfirst=True, errors='coerce')
        
        # ניקוי שורות עם תאריך לא תקין
        df = df.dropna(subset=['timestamp'])
        
        # בחירת העמודות הרלוונטיות ושינוי שמן לשמות של ה-SQL (אותיות קטנות)
        df_sql = df[['timestamp', 'Beach_Name', 'Status', 'Surfer_Count', 'Wind_Speed', 'Wave_Height']].copy()
        df_sql.columns = ['timestamp', 'beach_name', 'status', 'surfer_count', 'wind_speed', 'wave_height']
        
        # המרת timestamp למחרוזת (כי SQLite מעדיף לשמור תאריך כטקסט)
        df_sql['timestamp'] = df_sql['timestamp'].dt.strftime("%Y-%m-%d %H:%M:%S")

        # 3. כתיבה למסד הנתונים
        print("⏳ Inserting into Database...")
        conn = sqlite3.connect(DB_PATH)
        
        # 'append' אומר: תוסיף למה שקיים, אל תמחק
        df_sql.to_sql('measurements', conn, if_exists='append', index=False)
        
        conn.close()
        print(f"✅ Success! Moved {len(df_sql)} rows to wavez.db")
        print("🚀 Now you can restart your scanner and dashboard.")

    except Exception as e:
        print(f"❌ Error during migration: {e}")

if __name__ == "__main__":
    migrate_data()