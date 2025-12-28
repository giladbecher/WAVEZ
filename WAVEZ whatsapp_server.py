from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
from supabase import create_client, Client
import pandas as pd
from datetime import datetime

app = Flask(__name__)
SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co"
SUPABASE_KEY = "sb_publishable_3n-9eFTLx35UCwSOukmPgA_ztCsNINC"

try: supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except: supabase = None

CAPACITY_THRESHOLDS = {
    "Haifa_BatGalim": 20, "Haifa_Nirvana": 20, "Haifa_Meridian": 20,
    "Krayot_MagicBoards": 15, "Maagan_Michael": 20, "Manau_neurim_netanya": 12,
    "Netanya_Poleg": 15, "Herzliya_Marina": 15, "Herzliya_Zvulun": 15,
    "Herzliya_Dromi": 20, "TLV_Dolphinarium": 25, "Ma'aravi_tel_aviv": 20,
    "TLV_Hilton_B": 25, "TLV_Hilton_A": 30, "TLV_Hilton_A_Lefts": 15
}

MENU_OPTIONS = {
    "1": {"he": "בת גלים", "db": "Haifa_BatGalim"},
    "2": {"he": "נירוונה", "db": "Haifa_Nirvana"},
    "3": {"he": "מרידיאן", "db": "Haifa_Meridian"},
    "4": {"he": "קריות", "db": "Krayot_MagicBoards"},
    "5": {"he": "מעגן מיכאל", "db": "Maagan_Michael"},
    "6": {"he": "נעורים", "db": "Manau_neurim_netanya"},
    "7": {"he": "פולג", "db": "Netanya_Poleg"},
    "8": {"he": "דרומי", "db": "Herzliya_Dromi"},
    "9": {"he": "זבולון", "db": "Herzliya_Zvulun"},
    "10": {"he": "מרינה", "db": "Herzliya_Marina"},
    "11": {"he": "דולפינריום", "db": "TLV_Dolphinarium"},
    "12": {"he": "מערבי", "db": "Ma'aravi_tel_aviv"},
    "13": {"he": "הילטון א'", "db": "TLV_Hilton_A"},
    "14": {"he": "הילטון שמאל", "db": "TLV_Hilton_A_Lefts"},
    "15": {"he": "הילטון ב'", "db": "TLV_Hilton_B"}
}

def calculate_load_score(beach_name, count):
    limit = CAPACITY_THRESHOLDS.get(beach_name, 20)
    if count > limit: return "🔴 עמוס"
    if count > limit / 2: return "🟡 סביר"
    return "🟢 פנוי"

def get_menu_text():
    msg = "🌊 *WAVEZ Pro*\nבחר חוף:\n"
    for k in sorted(MENU_OPTIONS.keys(), key=int):
        msg += f"{k}. {MENU_OPTIONS[k]['he']}\n"
    return msg

def get_surf_status(db_beach_name, display_name):
    if not supabase: return "❌ שגיאת ענן."
    try:
        response = supabase.table("measurements").select("*").eq("beach_name", db_beach_name).order("id", desc=True).limit(1).execute()
        if not response.data: return f"❌ אין נתונים ל*{display_name}*."

        row = response.data[0]
        ts = datetime.strptime(row['timestamp'], "%Y-%m-%d %H:%M:%S")
        time_str = ts.strftime("%H:%M")
        count = row['surfer_count']
        wave = row['wave_height']
        wind = row['wind_speed']
        status = row['status']
        
        if status == "Night": return f"🌑 *{display_name}*\nלילה כרגע."
        if status == "Connection_Error": return f"⚠️ *{display_name}*\nתקלה זמנית."

        score = calculate_load_score(db_beach_name, count)
        return (f"🏄 *{display_name}*\nסטטוס: *{score}*\n👥 גולשים: {count}\n🌊 גלים: {wave}m\n💨 רוח: {wind} קמ\"ש\n🕒 עדכון: {time_str}")
    except Exception as e: return f"⚠️ שגיאה: {str(e)}"

@app.route("/bot", methods=['POST'])
def bot():
    incoming = request.values.get('Body', '').strip()
    resp = MessagingResponse()
    msg = resp.message()
    if incoming in MENU_OPTIONS:
        sel = MENU_OPTIONS[incoming]
        msg.body(get_surf_status(sel['db'], sel['he']) + "\n\n(שלח תפריט לחזרה)")
    elif any(val['he'] in incoming for val in MENU_OPTIONS.values()):
        for k, v in MENU_OPTIONS.items():
            if v['he'] in incoming:
                msg.body(get_surf_status(v['db'], v['he']))
                break
    else: msg.body(get_menu_text())
    return str(resp)

if __name__ == "__main__":
    app.run(port=5000)