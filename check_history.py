from supabase import create_client, Client

# --- ההגדרות שלך ---
SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co"
SUPABASE_KEY = "sb_publishable_3n-9eFTLx35UCwSOukmPgA_ztCsNINC"

print("⏳ מתחבר לבסיס הנתונים...")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. בדיקת כמות
    print("🔍 סופר שורות...")
    res_count = supabase.table("measurements").select("id", count="exact").execute()
    total_count = res_count.count
    
    # 2. בדיקת טווח תאריכים (לפי timestamp)
    print("🔍 בודק היסטוריה...")
    
    # הכי חדש
    res_newest = supabase.table("measurements").select("timestamp").order("id", desc=True).limit(1).execute()
    # הכי ישן
    res_oldest = supabase.table("measurements").select("timestamp").order("id", desc=False).limit(1).execute()

    if total_count == 0:
        print("\n❌ הטבלה ריקה לגמרי! אין היסטוריה.")
    else:
        newest_time = res_newest.data[0]['timestamp']
        oldest_time = res_oldest.data[0]['timestamp']
        
        print("\n📊 === דוח מצב נתונים (אמת) ===")
        print(f"✅ סה\"כ רשומות: {total_count}")
        print("-" * 30)
        print(f"📅 התחלה (הכי ישן): {oldest_time}")
        print(f"📅 סוף (הכי חדש):   {newest_time}")
        print("-" * 30)
        print("💡 מסקנה: הטבלה עובדת עם עמודת 'timestamp'.")

except Exception as e:
    print(f"\n❌ שגיאה: {e}")