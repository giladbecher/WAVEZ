import cv2
import time
import os
import sys 
import numpy as np
import requests 
import logging
import pytz
from datetime import datetime, timedelta
from astral import LocationInfo
from astral.sun import sun
from ultralytics import YOLO
from supabase import create_client, Client 

# --- ספריות סלניום ---
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# ==========================================
#          הגדרות SUPABASE 
# ==========================================
SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrY3pndXR3cml3ZGVveHpsbHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYzOTM0NiwiZXhwIjoyMDgwMjE1MzQ2fQ.5xc96hGjg--umg2e75BCg3ZM9x47t-whVQWNogibf0E"
2
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase Cloud!")
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}")
    # ממשיכים גם אם נכשל, אולי האינטרנט יחזור
    supabase = None

# --- הגדרות כלליות ---
logging.getLogger('ultralytics').setLevel(logging.WARNING)
logging.getLogger('selenium').setLevel(logging.ERROR)
logging.getLogger('WDM').setLevel(logging.ERROR)
os.environ["OPENCV_LOG_LEVEL"] = "ERROR"

folder_path = r"C:\WAVEZ"
ASSETS_FOLDER = os.path.join(folder_path, "assets")
if not os.path.exists(ASSETS_FOLDER): os.makedirs(ASSETS_FOLDER)

DATASET_COLLECTION_MODE = False 
RAW_IMAGE_FOLDER = os.path.join(folder_path, "RAW_DATASET_IMAGES")
CONFIDENCE_THRESHOLD = 0.25 

last_api_request_hour = -1 
tlv_wind, tlv_wave = 0, 0     
sharon_wind, sharon_wave = 0, 0 
north_wind, north_wave = 0, 0   
last_image_save_time = {}

BEACHES_GPS_MAP = {
    "TLV_ZONE": {"lat": 32.0853, "lon": 34.7818},    
    "SHARON_ZONE": {"lat": 32.3294, "lon": 34.8565}, 
    "NORTH_ZONE": {"lat": 32.8368, "lon": 34.9663}   
}

# --- רשימת החופים ---
beaches_config = {
    # צפון (BeachCam)
    "Haifa_BatGalim": {"page_url": "https://beachcam.co.il/batgalim.html", "type": "browser_screenshot"},
    "Haifa_Nirvana": {"page_url": "https://beachcam.co.il/testcam1.html", "type": "browser_screenshot"},
    "Haifa_Meridian": {"page_url": "https://beachcam.co.il/meridian.html", "type": "browser_screenshot"},
    "Krayot_MagicBoards": {"page_url": "https://beachcam.co.il/krayot.html", "type": "browser_screenshot"},
    "Maagan_Michael": {"page_url": "https://beachcam.co.il/maagan.html", "type": "browser_screenshot"},
    
    # שרון (כולל מרינה שעברה לצילום מסך)
    "Herzliya_Marina": {"page_url": "https://beachcam.co.il/marina.html", "type": "browser_screenshot"},
    "Beit_Yanai": {"page_url": "https://kookint.com/pages/%D7%9E%D7%A6%D7%9C%D7%9E%D7%AA-%D7%97%D7%95%D7%A3-%D7%91%D7%99%D7%AA-%D7%99%D7%A0%D7%90%D7%99", "type": "browser_screenshot"},
    "Manau_neurim_netanya": {"url": "https://vod.wavehub.co.il/live/_definst_/Manau_SD.stream/chunklist_w1769995696.m3u8", "type": "video"},
    "Netanya_Poleg": {"url": "https://vod.wavehub.co.il/live/_definst_/Poleg_SD.stream/chunklist_w741927332.m3u8", "type": "video"},
    "Herzliya_Zvulun": {"url": "https://vod.wavehub.co.il/live/_definst_/Zvulun_576p.stream/chunklist_w1928512222.m3u8", "type": "video"},
    "Herzliya_Dromi": {"url": "https://vod.wavehub.co.il/live/_definst_/Dromi_576p.stream/chunklist_w187805107.m3u8", "type": "video"},
    
    # תל אביב (דולפינריום בתיקון)
    "TLV_Dolphinarium": {"page_url": "https://beachcam.co.il/dolfinarium.html", "type": "browser_screenshot"},
    "Ma'aravi_tel_aviv": {"url": "https://vod.wavehub.co.il/live/_definst_/Shenkar_SD.stream/chunklist_w104771397.m3u8", "type": "video"},
    "TLV_Hilton_B": {"url": "https://68f5996a5b438.streamlock.net:8086/live/_definst_/HiltonB_SD.stream/chunklist_w1496382929.m3u8", "type": "video"},
    "TLV_Hilton_A": {"url": "https://vod.wavehub.co.il/live/_definst_/HiltonA_SD.stream/chunklist_w720779245.m3u8", "type": "video"},
    "TLV_Hilton_A_Lefts": {"url": "https://vod.wavehub.co.il/live/_definst_/HiltonA_Lefts_SD.stream/chunklist_w1672383654.m3u8", "type": "video"},
} 

print("🚀 Loading YOLO...")
model_path = r"C:\WAVEZ\runs\detect\wavez_rtx_s_50\weights\best.pt"
try:
    model = YOLO(model_path)
    print("✅ Custom Model Loaded!")
except Exception as e:
    print(f"❌ CRITICAL ERROR: Model not found! {e}")
    sys.exit(1)

city = LocationInfo("Tel Aviv", "Israel", "Asia/Jerusalem", 32.0853, 34.7818)

# --- פונקציית שמירה לענן ---
def save_to_db(beach_name, status, count, wind, wave):
    if not supabase: return
    try:
        now = datetime.now().isoformat()
        data = {
            "timestamp": now,
            "beach_name": beach_name,
            "status": status,
            "surfer_count": int(count),
            "wind_speed": float(wind),
            "wave_height": float(wave)
        }
        supabase.table("measurements").insert(data).execute()
        # print(f"   ☁️ Uploaded: {beach_name}") 
    except Exception as e:
        print(f"❌ Cloud Upload Error: {e}")

# --- שמירת תמונה מקומית (לדשבורד) ---
def smart_save_image(beach_name, frame, surfer_count):
    try:
        now = time.time()
        last_save = last_image_save_time.get(beach_name, 0)
        
        if surfer_count > 0 or (now - last_save > 900):
            h, w = frame.shape[:2]
            cv2.rectangle(frame, (0, 0), (w, 30), (0, 0, 0), -1)
            text = f"{datetime.now().strftime('%H:%M:%S')} | Surfers: {surfer_count}"
            cv2.putText(frame, text, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            cv2.imwrite(os.path.join(ASSETS_FOLDER, f"{beach_name}.jpg"), frame)
            last_image_save_time[beach_name] = now
            
            if DATASET_COLLECTION_MODE:
                if not os.path.exists(RAW_IMAGE_FOLDER): os.makedirs(RAW_IMAGE_FOLDER)
                date_str = datetime.now().strftime("%Y-%m-%d")
                time_str = datetime.now().strftime("%H_%M_%S")
                cv2.imwrite(os.path.join(RAW_IMAGE_FOLDER, f"{beach_name}_{date_str}_{time_str.replace(':', '_')}.jpg"), frame)
    except Exception as e: print(f"Image Save Error: {e}")

def capture_screenshot_from_browser(page_url):
    print(f"   📸 Screenshot: {page_url}...", end="")
    driver = None
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--log-level=3")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
        chrome_options.page_load_strategy = 'eager'
        
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        driver.set_page_load_timeout(30)
        try: driver.get(page_url)
        except TimeoutException: driver.execute_script("window.stop();")
        
        time.sleep(6) 
        
        img = None
        try:
            target_element = None
            possible_selectors = ["iframe[src*='ipcamlive']", "div#player", "video", "div.player-container"]
            for selector in possible_selectors:
                try:
                    target_element = WebDriverWait(driver, 2).until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                    if target_element: break
                except: continue

            if target_element:
                png_data = target_element.screenshot_as_png
                print(" ✅ Frame-Grab", end="")
            else: raise Exception("Element not found")
        except:
            print(" ⚠️ Fallback (Crop)", end="")
            png_data = driver.get_screenshot_as_png()
            nparr = np.frombuffer(png_data, np.uint8)
            full_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            h, w = full_img.shape[:2]
            # חיתוך חכם (מעיף header/footer)
            img = full_img[int(h*0.20):int(h*0.85), 0:w] 
            driver.quit(); return img
        
        nparr = np.frombuffer(png_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        driver.quit(); return img

    except Exception as e:
        print(f" ❌ Error: {e}")
        if driver: 
            try: driver.quit()
            except: pass
        return None

def get_surf_forecast_open_meteo(lat, lon):
    try:
        url_waves = "https://marine-api.open-meteo.com/v1/marine"
        params_waves = {"latitude": lat, "longitude": lon, "hourly": "wave_height", "timezone": "auto"}
        resp_waves = requests.get(url_waves, params=params_waves, timeout=5)
        url_wind = "https://api.open-meteo.com/v1/forecast"
        params_wind = {"latitude": lat, "longitude": lon, "hourly": "windspeed_10m", "timezone": "auto"}
        resp_wind = requests.get(url_wind, params=params_wind, timeout=5)
        if resp_waves.status_code == 200 and resp_wind.status_code == 200:
            data_waves = resp_waves.json()
            data_wind = resp_wind.json()
            current_hour = datetime.now().hour
            wave = data_waves['hourly']['wave_height'][current_hour]
            wind_kmh = data_wind['hourly']['windspeed_10m'][current_hour]
            return float(wave), float(wind_kmh)
        return 0, 0
    except: return 0, 0

def get_image_from_url(url):
    try:
        resp = requests.get(url, stream=True, timeout=5)
        if resp.status_code == 200:
            image_arr = np.asarray(bytearray(resp.content), dtype=np.uint8)
            return cv2.imdecode(image_arr, -1)
        return None
    except: return None

def is_sun_up():
    tz = pytz.timezone('Asia/Jerusalem')
    now = datetime.now(tz)
    s = sun(city.observer, date=now, tzinfo=tz)
    return (s['sunrise'] - timedelta(minutes=30)) < now < (s['sunset'] + timedelta(minutes=30)), now

def process_image_with_slicing(frame):
    height, width = frame.shape[:2]
    mid_x, mid_y = width // 2, height // 2
    overlap = 80 
    return [
        frame[0:min(height, mid_y+overlap), 0:min(width, mid_x+overlap)],
        frame[0:min(height, mid_y+overlap), max(0, mid_x-overlap):width],
        frame[max(0, mid_y-overlap):height, 0:min(width, mid_x+overlap)],
        frame[max(0, mid_y-overlap):height, max(0, mid_x-overlap):width]
    ]

# --- Main Loop ---
print(f"\n🐙 WAVEZ Bot Active. (Cloud Upload Mode)")

while True:
    try:
        is_daytime, current_time = is_sun_up()
        time_str = current_time.strftime("%H:%M:%S")

        if not is_daytime:
            print(f"[{time_str}] 🌑 Night time.")
            time.sleep(120) 
            continue 

        print(f"[{time_str}] ☀️ Starting scan...")
        
        is_new_hour = (current_time.minute < 5 and last_api_request_hour != current_time.hour)
        if is_new_hour or tlv_wave == 0:
            try:
                t_gps = BEACHES_GPS_MAP["TLV_ZONE"]
                tlv_wave, tlv_wind = get_surf_forecast_open_meteo(t_gps['lat'], t_gps['lon']) 
                s_gps = BEACHES_GPS_MAP["SHARON_ZONE"]
                sharon_wave, sharon_wind = get_surf_forecast_open_meteo(s_gps['lat'], s_gps['lon']) 
                n_gps = BEACHES_GPS_MAP["NORTH_ZONE"]
                north_wave, north_wind = get_surf_forecast_open_meteo(n_gps['lat'], n_gps['lon']) 
                last_api_request_hour = current_time.hour
                print(f"✅ Weather Updated.")
            except: pass

        for name, data in beaches_config.items():
            if 'Haifa_' in name or 'Krayot_' in name or 'Maagan_' in name:
                cur_wind, cur_wave = north_wind, north_wave
            elif 'Herzliya_' in name or 'Netanya_' in name or 'Manau_' in name:
                cur_wind, cur_wave = sharon_wind, sharon_wave
            else:
                cur_wind, cur_wave = tlv_wind, tlv_wave

            print(f"   🔎 {name}...", end=" ")
            
            frame = None
            status = "Init"
            surfer_count = 0
            
            if data.get('type') == 'browser_screenshot':
                frame = capture_screenshot_from_browser(data['page_url'])
            elif data.get('type') == 'image':
                frame = get_image_from_url(data['url'])
            else: 
                cap = cv2.VideoCapture(data['url'], cv2.CAP_FFMPEG)
                if cap.isOpened():
                    for _ in range(30): cap.read()
                    ret, temp_frame = cap.read()
                    cap.release()
                    if ret: frame = temp_frame

            if frame is not None:
                status = "Day"
                smart_save_image(name, frame, surfer_count)
                slices = process_image_with_slicing(frame)
                for i, slice_img in enumerate(slices):
                    results = model.predict(slice_img, conf=CONFIDENCE_THRESHOLD, verbose=False)
                    surfer_count += len(results[0].boxes)
                print(f" 🏄 {surfer_count}")
            else:
                status = "Connection_Error"
                print(" ❌ Error")

            # ✅ השורה הקריטית: שמירה לענן
            save_to_db(name, status, surfer_count, cur_wind, cur_wave)

        print("⏳ Waiting 2 minutes...")
        time.sleep(120) 

    except Exception as e:
        print(f"\n❌ General Error: {e}")
        time.sleep(60)