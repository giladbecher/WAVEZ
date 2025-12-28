from supabase import create_client, Client
import json

# --- ההגדרות שלך ---
SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co"
SUPABASE_KEY = "sb_publishable_3n-9eFTLx35UCwSOukmPgA_ztCsNINC"

print("⏳ מתחבר לבסיס הנתונים...")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. שליפת השורה הכי חדשה
    print("🔍 מחפש את התאריך הכי חדש...")
    res_newest = supabase.table("measurements").select("recorded_at, timestamp, created_at").order("id", desc=True).limit(1).execute()
    
    # 2. שליפת השורה הכי ישנה
    print("🔍 מחפש את התאריך הכי ישן...")
    res_oldest = supabase.table("measurements").select("recorded_at, timestamp, created_at").order("id", desc=False).limit(1).execute()
    
    # 3. בדיקת כמות (בקירוב - מביא עד 1000 שורות כדי לא להכביד)
    res_count = supabase.table("measurements").select("id", count="exact").limit(1).execute()
    total_count = res_count.count

    if not res_newest.data:
        print("\n❌ הטבלה ריקה לגמרי! אין היסטוריה.")
    else:
        newest = res_newest.data[0]
        oldest = res_oldest.data[0]
        
        # בחירת עמודת הזמן הקיימת
        time_col = 'recorded_at' if 'recorded_at' in newest and newest['recorded_at'] else 'timestamp'
        
        print("\n📊 === דוח מצב נתונים ===")
        print(f"✅ סה\"כ רשומות שמורות: {total_count}")
        print("-" * 30)
        print(f"📅 התחלה (הכי ישן): {oldest.get(time_col)}")
        print(f"📅 סוף (הכי חדש):   {newest.get(time_col)}")
        print("-" * 30)
        
        if oldest.get(time_col) == newest.get(time_col):
            print("⚠️ אזהרה: נראה שיש נתונים רק מרגע אחד ספציפי.")
        else:
            print("✨ יש לך טווח היסטוריה תקין.")

except Exception as e:
    print(f"\n❌ שגיאה: {e}")