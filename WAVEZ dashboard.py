import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
from PIL import Image
import time
import os
import shutil
from supabase import create_client, Client

# ==========================================
#          הגדרות חיבור לענן
# ==========================================
SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co"
SUPABASE_KEY = "sb_publishable_3n-9eFTLx35UCwSOukmPgA_ztCsNINC"

# חיבור יעיל (נשמר בזיכרון המטמון של הדשבורד)
@st.cache_resource
def init_connection():
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except:
        return None

supabase = init_connection()

# --- נתיבים מקומיים (לתמונות ולוגו) ---
BASE_DIR = r"C:\WAVEZ"
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
ERRORS_DIR = os.path.join(BASE_DIR, "training_errors")
if not os.path.exists(ERRORS_DIR): os.makedirs(ERRORS_DIR)

def get_logo_path():
    for f in os.listdir(BASE_DIR):
        if "logo" in f.lower() and f.lower().endswith(('.png', '.jpg', '.jpeg')):
            return os.path.join(BASE_DIR, f)
    return None
LOGO_PATH = get_logo_path()

# --- הגדרות עמוד ---
try:
    icon = Image.open(LOGO_PATH) if LOGO_PATH else "🏄"
    st.set_page_config(page_title="WAVEZ Cloud", page_icon=icon, layout="wide")
except:
    st.set_page_config(page_title="WAVEZ Cloud", page_icon="🏄", layout="wide")

# --- עיצוב CSS (העיצוב החדש) ---
st.markdown("""
<style>
    .stApp { direction: rtl; background-color: #0E1117; }
    
    /* כרטיסים */
    div[data-testid="metric-container"] {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 15px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
    }
    
    /* סיידבר */
    section[data-testid="stSidebar"] { background-color: #161B22; }
    
    /* טקסטים */
    h1, h2, h3 { font-family: 'Segoe UI', sans-serif; font-weight: 600; text-align: right; }
    p, label, span { text-align: right; }
    
    /* הסתרת זבל */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* כפתורים */
    .stButton>button { width: 100%; height: 3em; border-radius: 10px; font-weight: bold; border: none; }
    
    /* תמונות */
    div[data-testid="stImage"] > img { float: right; border-radius: 12px; }
    
    /* כפתור ירוק */
    div[data-testid="stHorizontalBlock"] button:nth-of-type(1) { border: 1px solid #00FF00; }
</style>
""", unsafe_allow_html=True)

BEACH_MAPPING = {
    "Haifa_BatGalim": "חיפה - בת גלים", "Haifa_Backdoor": "חיפה - בקדור",
    "Haifa_Nirvana": "חיפה - נירוונה", "Haifa_Meridian": "חיפה - מרידיאן",
    "Krayot_MagicBoards": "קריות - מג'יק", "Maagan_Michael": "מעגן מיכאל",
    "Manau_neurim_netanya": "נתניה - נעורים", "Netanya_Poleg": "נתניה - פולג",
    "Herzliya_Marina": "הרצליה - מרינה", "Herzliya_Zvulun": "הרצליה - זבולון",
    "Herzliya_Dromi": "הרצליה - דרומי", "TLV_Dolphinarium": "תל אביב - דולפינריום",
    "Ma'aravi_tel_aviv": "תל אביב - מערבי", "TLV_Hilton_B": "תל אביב - הילטון ב'",
    "TLV_Hilton_A": "תל אביב - הילטון א'", "TLV_Hilton_A_Lefts": "תל אביב - הילטון שמאל"
}
BEACH_KEYS = list(BEACH_MAPPING.keys())
DAYS_HEBREW = {0: 'שני', 1: 'שלישי', 2: 'רביעי', 3: 'חמישי', 4: 'שישי', 5: 'שבת', 6: 'ראשון'}

# --- פונקציית טעינת נתונים מהענן ---
def load_data():
    if not supabase: return None
    try:
        # שולפים את 2000 השורות האחרונות (מספיק להיסטוריה קרובה)
        response = supabase.table("measurements").select("*").order("id", desc=True).limit(3000).execute()
        
        if not response.data: return None
            
        df = pd.DataFrame(response.data)
        
        # סינון ועיבוד
        df = df[df['beach_name'] != 'Haifa_Backdoor']
        df['Datetime'] = pd.to_datetime(df['timestamp'])
        df['HebrewName'] = df['beach_name'].map(BEACH_MAPPING).fillna(df['beach_name'])
        df['Hour'] = df['Datetime'].dt.hour
        df['Day'] = df['Datetime'].dt.date
        df['WeekdayCode'] = df['Datetime'].dt.dayofweek 
        return df
    except Exception as e:
        st.error(f"שגיאת ענן: {e}")
        return None

def save_error_image(beach_name, reason):
    # שמירת תמונות נשארת מקומית (במחשב שלך) לאימון עתידי
    src = os.path.join(ASSETS_DIR, f"{beach_name}.jpg")
    if os.path.exists(src):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dst = os.path.join(ERRORS_DIR, f"ERROR_{reason}_{beach_name}_{timestamp}.jpg")
        try:
            shutil.copy(src, dst)
            return True
        except: return False
    return False

def main():
    # טעינת נתונים
    with st.spinner('טוען נתונים מהענן...'):
        df = load_data()

    with st.sidebar:
        if LOGO_PATH: st.image(LOGO_PATH, width=120)
        st.title("WAVEZ Cloud ☁️")
        
        page = st.radio("תפריט:", ["🏠 חוף הבית", "🔮 תחזית חכמה", "🛠️ אימון המודל"])
        st.markdown("---")
        
        if df is not None:
            # רשימת חופים פעילה מתוך הדאטה
            available_beaches = [b for b in df['beach_name'].unique() if b in BEACH_KEYS]
            
            if not available_beaches:
                st.error("אין נתונים לחופים פעילים.")
                st.stop()

            if 'home_beach' not in st.session_state or st.session_state['home_beach'] not in available_beaches:
                st.session_state['home_beach'] = available_beaches[0]
            
            # בחירת חוף גלובלית (רק אם אנחנו בבית)
            if page == "🏠 חוף הבית":
                st.selectbox(
                    "בחר חוף לתצוגה:", 
                    available_beaches, 
                    format_func=lambda x: BEACH_MAPPING.get(x, x),
                    key="home_beach_select",
                    index=available_beaches.index(st.session_state['home_beach'])
                )
                st.session_state['home_beach'] = st.session_state.home_beach_select
        
        st.markdown("---")
        # אין צורך בצ'קבוקס, הרענון מובנה

    if df is None:
        st.error("לא ניתן להתחבר לנתונים.")
        st.stop()

    beach_data = df[df['beach_name'] == st.session_state['home_beach']].sort_values('Datetime')
    if beach_data.empty: st.warning("אין נתונים לחוף זה."); st.stop()
        
    current_status = beach_data.iloc[-1]
    beach_hebrew = BEACH_MAPPING.get(st.session_state['home_beach'], st.session_state['home_beach'])

    # ==========================================
    #           עמוד 1: חוף הבית
    # ==========================================
    if page == "🏠 חוף הבית":
        st.header(f"מצב נוכחי: {beach_hebrew}")
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("🏄 גולשים", int(current_status['surfer_count']))
        c2.metric("🌊 גובה גל", f"{current_status['wave_height']}m")
        c3.metric("💨 רוח", f"{current_status['wind_speed']} km/h")
        # המרה לשעון ישראל (פשוטה לתצוגה)
        time_display = current_status['Datetime'].strftime("%H:%M")
        c4.metric("🕒 עדכון", time_display)

        st.divider()
        col_img, col_graph = st.columns([1, 2])
        with col_img:
            img_path = os.path.join(ASSETS_DIR, f"{st.session_state['home_beach']}.jpg")
            if os.path.exists(img_path):
                live_img = Image.open(img_path)
                st.image(live_img, caption="שידור חי (מקומי)", use_container_width=True)
            else: st.info("המצלמה לא זמינה")

        with col_graph:
            today_df = beach_data[beach_data['Day'] == pd.Timestamp.now().date()]
            if not today_df.empty:
                today_df['Smooth'] = today_df['surfer_count'].rolling(window=3, min_periods=1).mean()
                fig = go.Figure()
                fig.add_trace(go.Scatter(x=today_df['Datetime'], y=today_df['Smooth'], mode='lines', name='גולשים', line=dict(color='#00d4ff', width=4, shape='spline'), fill='tozeroy', fillcolor='rgba(0, 212, 255, 0.15)'))
                fig.update_layout(title="מגמת עומס היום", template="plotly_dark", paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', margin=dict(l=0, r=0, t=30, b=0), height=300, xaxis=dict(title=None), yaxis=dict(title=None))
                st.plotly_chart(fig, use_container_width=True)

    # ==========================================
    #           עמוד 2: תחזית חכמה
    # ==========================================
    elif page == "🔮 תחזית חכמה":
        st.header(f"ניתוח עומסים חכם: {beach_hebrew}")
        current_wave = current_status['wave_height']
        today_code = pd.Timestamp.now().dayofweek
        today_name = DAYS_HEBREW[today_code]
        
        similar_days = beach_data[
            (beach_data['WeekdayCode'] == today_code) & 
            (beach_data['wave_height'].between(current_wave - 0.3, current_wave + 0.3))
        ]
        
        data_source_text = ""
        if len(similar_days) < 10:
            st.warning(f"מציג ממוצע כללי לימי {today_name} (עדיין אוספים נתונים מדויקים).")
            similar_days = beach_data 
        else:
            st.info(f"📊 התחזית מבוססת על ימים דומים בעבר (גל {current_wave}m).")

        hourly_avg = similar_days.groupby('Hour')['surfer_count'].mean().reset_index()

        if not hourly_avg.empty:
            peak_hour = hourly_avg.loc[hourly_avg['surfer_count'].idxmax()]
            avg_at_peak = int(peak_hour['surfer_count'])
            st.success(f"הצפי להיום: שיא עומס סביב **{int(peak_hour['Hour'])}:00** עם כ-{avg_at_peak} גולשים.")
            fig_bar = px.bar(hourly_avg, x='Hour', y='surfer_count', title=f"תחזית עומס להמשך היום", labels={'Hour': 'שעה', 'surfer_count': 'כמות צפויה'}, color='surfer_count', color_continuous_scale="RdYlGn_r")
            fig_bar.update_layout(template="plotly_dark", paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig_bar, use_container_width=True)
        else: st.write("אין מספיק נתונים.")

    # ==========================================
    #           עמוד 3: אימון
    # ==========================================
    elif page == "🛠️ אימון המודל":
        if 'train_idx' not in st.session_state: st.session_state.train_idx = 0
        def next_beach(): st.session_state.train_idx = (st.session_state.train_idx + 1) % len(BEACH_KEYS)

        current_train_key = BEACH_KEYS[st.session_state.train_idx]
        current_train_hebrew = BEACH_MAPPING.get(current_train_key, current_train_key)

        st.header(f"אימון מודל: {current_train_hebrew}")
        
        img_path = os.path.join(ASSETS_DIR, f"{current_train_key}.jpg")
        try: count_val = df[df['beach_name'] == current_train_key].iloc[0]['surfer_count']
        except: count_val = 0

        col_view, col_btns = st.columns([2, 1])
        with col_view:
            if os.path.exists(img_path):
                # טעינה מחדש כדי למנוע Cache
                image_data = Image.open(img_path)
                st.image(image_data, caption="תמונה עדכנית מהמחשב המקומי", use_container_width=True)
            else: st.warning("אין תמונה.")
        with col_btns:
            st.metric("הבוט ספר:", int(count_val))
            if st.button("✅ תקין (הבא)", type="primary"): next_beach(); st.rerun()
            if st.button("❌ פספוס"): save_error_image(current_train_key, "missed"); next_beach(); st.rerun()
            if st.button("⚠️ רעש"): save_error_image(current_train_key, "false"); next_beach(); st.rerun()

    # רענון אוטומטי
    time.sleep(30); st.rerun()

if __name__ == "__main__":
    main()