# -*- coding: utf-8 -*-
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

# --- Selenium Libraries ---
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# ==========================================
#            SUPABASE SETTINGS 
# ==========================================
SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrY3pndXR3cml3ZGVveHpsbHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYzOTM0NiwiZXhwIjoyMDgwMjE1MzQ2fQ.5xc96hGjg--umg2e75BCg3ZM9x47t-whVQWNogibf0E"

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase Cloud!")
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}")
    supabase = None

# --- General Settings ---
logging.getLogger('ultralytics').setLevel(logging.WARNING)
logging.getLogger('selenium').setLevel(logging.ERROR)
logging.getLogger('WDM').setLevel(logging.ERROR)
os.environ["OPENCV_LOG_LEVEL"] = "ERROR"

folder_path = "data"
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
    "TLV_ZONE":    {"lat": 32.0853, "lon": 34.7818},    
    "SHARON_ZONE": {"lat": 32.3294, "lon": 34.8565}, 
    "NORTH_ZONE":  {"lat": 32.8368, "lon": 34.9663}   
}

# --- Beach Configuration ---
beaches_config = {
    # Tel Aviv
    "Ma'aravi_tel_aviv": {"page_url": "https://beachcam.co.il/yafo.html",        "type": "browser_screenshot"},
    "TLV_Dolphinarium":  {"page_url": "https://beachcam.co.il/dolfinarium.html", "type": "browser_screenshot"},
    "TLV_Hilton":        {"page_url": "https://beachcam.co.il/yamit.html",       "type": "browser_screenshot"},

    # Sharon
    "Herzliya_Dromi":    {"page_url": "https://beachcam.co.il/dromi2.html",      "type": "browser_screenshot"},
    "Herzliya_Marina":   {"page_url": "https://beachcam.co.il/marina.html",      "type": "browser_screenshot"},
    "Beit_Yanai":        {"page_url": "https://kookint.com/pages/%D7%9E%D7%A6%D7%9C%D7%9E%D7%AA-%D7%97%D7%95%D7%A3-%D7%91%D7%99%D7%AA-%D7%99%D7%A0%D7%90%D7%99", "type": "browser_screenshot"},
    "Maagan_Michael":    {"page_url": "https://beachcam.co.il/maagan.html",      "type": "browser_screenshot"},

    # North
    "Haifa_Nirvana":     {"page_url": "https://beachcam.co.il/testcam1.html",    "type": "browser_screenshot"},
    "Haifa_Meridian":    {"page_url": "https://beachcam.co.il/meridian.html",    "type": "browser_screenshot"},
    "Haifa_BatGalim":    {"page_url": "https://beachcam.co.il/backdoor.html",    "type": "browser_screenshot"},
    "Krayot_MagicBoards":{"page_url": "https://beachcam.co.il/krayot.html",      "type": "browser_screenshot"},
} 

print("🚀 Loading YOLO...")
model_path = "wavez_pro_v2_noise.pt"
try:
    model = YOLO(model_path)
    print("✅ Custom Model Loaded!")
except Exception as e:
    print(f"❌ CRITICAL ERROR: Model not found! {e}")
    sys.exit(1)

city = LocationInfo("Tel Aviv", "Israel", "Asia/Jerusalem", 32.0853, 34.7818)

# --- Helper Functions ---
def save_to_db(beach_name, status, count, wind, wave):
    if not supabase: return
    try:
        now = datetime.now().isoformat()
        data = {
            "timestamp":    now,
            "beach_name":   beach_name,
            "status":       status,
            "surfer_count": int(count),
            "wind_speed":   float(wind),
            "wave_height":  float(wave)
        }
        supabase.table("measurements").insert(data).execute()
        print(f"    ☁️ Uploaded: {beach_name}")
    except Exception as e:
        print(f"❌ Cloud Upload Error: {e}")

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
    except Exception as e:
        print(f"Image Save Error: {e}")

# --- Optimized Screenshot Function (reuses single browser instance per cycle) ---
def capture_screenshot_with_driver(driver, page_url):
    print(f"    📸 Screenshot: {page_url}...", end="")
    try:
        driver.get(page_url)
        time.sleep(8)  # Wait for page + stream to load

        # ── Beit Yanai special handling ────────────────────────────────────────
        # The kookint page is a long e-commerce page with a Surfline iframe
        # player far below the fold. We scroll to it, then switch INTO the
        # iframe context to click play, then switch back for the screenshot.
        if 'kookint' in page_url:
            try:
                # 1. Find the Surfline iframe on the parent page
                iframe_selectors = [
                    "iframe[src*='surfline']",
                    "iframe[src*='cam']",
                    "iframe[src*='embed']",
                    "iframe",  # last resort
                ]
                surfline_iframe = None
                for sel in iframe_selectors:
                    try:
                        surfline_iframe = WebDriverWait(driver, 8).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, sel))
                        )
                        if surfline_iframe:
                            break
                    except:
                        continue

                if surfline_iframe:
                    # 2. Scroll the iframe into the center of the viewport
                    driver.execute_script(
                        "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
                        surfline_iframe
                    )
                    print(" 📜 Scrolled ", end="")
                    time.sleep(2)  # Let scroll settle

                    # 3. Switch INTO the iframe context so we can interact with
                    #    elements inside it (parent-page clicks won't reach here)
                    driver.switch_to.frame(surfline_iframe)

                    # 4. Find and click the play button inside the iframe
                    play_clicked = False
                    iframe_play_selectors = [
                        ".sl-play-button",         # Surfline custom class
                        ".vjs-big-play-button",    # Video.js big play button
                        "[class*='play-button']",  # Any class containing play-button
                        "[class*='PlayButton']",
                        "button[aria-label*='Play']",
                        "button[title*='Play']",
                        "button",                  # Last resort: first button found
                    ]
                    for sel in iframe_play_selectors:
                        try:
                            play_btn = WebDriverWait(driver, 3).until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, sel))
                            )
                            driver.execute_script("arguments[0].click();", play_btn)
                            play_clicked = True
                            print(f" ▶️ Clicked({sel}) ", end="")
                            break
                        except:
                            continue

                    if not play_clicked:
                        print(" ⚠️ No play btn found ", end="")

                    # 5. Switch BACK to parent page before screenshotting
                    driver.switch_to.default_content()

                    # 6. Buffer time — live stream needs time to decode frames
                    print(" ⏳ Buffering ", end="")
                    time.sleep(8)

                else:
                    # No iframe found — fallback scroll to 60% of page height
                    driver.execute_script(
                        "window.scrollTo({top: document.body.scrollHeight * 0.6, behavior: 'smooth'});"
                    )
                    print(" 📜 ScrollFallback ", end="")
                    time.sleep(5)

            except Exception as beit_err:
                # Safety net — log but never crash the main loop
                try:
                    driver.switch_to.default_content()  # ensure we're back on parent
                except: pass
                print(f" ⚠️ BeitYanai-prep warning: {str(beit_err)[:60]} ", end="")
        # ── End Beit Yanai special handling ───────────────────────────────────

        # Try to capture the specific video element first
        try:
            possible_selectors = [
                "iframe[src*='surfline']",
                "iframe[src*='ipcamlive']",
                "iframe[src*='embed']",
                "iframe[src*='cam']",
                "video",
                ".video-js",
                "#videoPlayer",
            ]
            target_element = None
            for selector in possible_selectors:
                try:
                    target_element = WebDriverWait(driver, 3).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    if target_element: break
                except: continue

            if target_element:
                png_data = target_element.screenshot_as_png
                print(" ✅ Frame-Grab ", end="")
            else:
                raise Exception("No player found")
        except:
            print(" ⚠️ Fallback (Crop) ", end="")
            png_data = driver.get_screenshot_as_png()

        nparr = np.frombuffer(png_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f" ❌ Error: {str(e)[:50]}")
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
    except:
        return 0, 0

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
        frame[0:min(height, mid_y+overlap),    0:min(width, mid_x+overlap)],
        frame[0:min(height, mid_y+overlap),    max(0, mid_x-overlap):width],
        frame[max(0, mid_y-overlap):height,    0:min(width, mid_x+overlap)],
        frame[max(0, mid_y-overlap):height,    max(0, mid_x-overlap):width]
    ]

# --- Main Loop ---
print(f"\n🐙 WAVEZ Bot Active. (Optimized Mode)")

while True:
    driver = None
    try:
        is_daytime, current_time = is_sun_up()
        time_str = current_time.strftime("%H:%M:%S")

        if not is_daytime:
            print(f"[{time_str}] 🌑 Night time. Sleeping...")
            time.sleep(600) 
            continue 

        print(f"[{time_str}] ☀️ Starting scan...")
        
        # 1. Initialize Driver ONCE per cycle
        chrome_options = Options()
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.set_page_load_timeout(35)

        # 2. Update Weather
        is_new_hour = (current_time.minute < 5 and last_api_request_hour != current_time.hour)
        if is_new_hour or tlv_wave == 0:
            try:
                tlv_wave, tlv_wind     = get_surf_forecast_open_meteo(BEACHES_GPS_MAP["TLV_ZONE"]["lat"],    BEACHES_GPS_MAP["TLV_ZONE"]["lon"]) 
                sharon_wave, sharon_wind = get_surf_forecast_open_meteo(BEACHES_GPS_MAP["SHARON_ZONE"]["lat"], BEACHES_GPS_MAP["SHARON_ZONE"]["lon"]) 
                north_wave, north_wind  = get_surf_forecast_open_meteo(BEACHES_GPS_MAP["NORTH_ZONE"]["lat"],  BEACHES_GPS_MAP["NORTH_ZONE"]["lon"]) 
                last_api_request_hour = current_time.hour
                print(f"✅ Weather Updated.")
            except: pass

        # 3. Scan Beaches
        for name, data in beaches_config.items():
            if 'Haifa_' in name or 'Krayot_' in name or 'Maagan_' in name:
                cur_wind, cur_wave = north_wind, north_wave
            elif 'Herzliya_' in name or 'Beit_' in name:
                cur_wind, cur_wave = sharon_wind, sharon_wave
            else:
                cur_wind, cur_wave = tlv_wind, tlv_wave

            print(f"    🔎 {name}...", end=" ")
            
            frame = capture_screenshot_with_driver(driver, data['page_url'])
            surfer_count = 0

            if frame is not None:
                # Create annotated copy — clean frame stays intact for DB logic
                annotated_frame = frame.copy()
                height, width = frame.shape[:2]
                mid_x, mid_y  = width // 2, height // 2
                overlap        = 80

                # Offsets (x, y) for each slice, matching process_image_with_slicing order:
                # Slice 0: Top-Left     Slice 1: Top-Right
                # Slice 2: Bottom-Left  Slice 3: Bottom-Right
                slice_offsets = [
                    (0,                      0),                       # Slice 0 — Top-Left
                    (max(0, mid_x - overlap), 0),                       # Slice 1 — Top-Right
                    (0,                      max(0, mid_y - overlap)),  # Slice 2 — Bottom-Left
                    (max(0, mid_x - overlap), max(0, mid_y - overlap)), # Slice 3 — Bottom-Right
                ]

                slices = process_image_with_slicing(frame)
                for i, slice_img in enumerate(slices):
                    results = model.predict(slice_img, conf=CONFIDENCE_THRESHOLD, verbose=False)
                    surfer_count += len(results[0].boxes)

                    # Map each detected box back to full-frame coordinates and draw
                    x_offset, y_offset = slice_offsets[i]
                    for box in results[0].boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                        gx1 = x1 + x_offset
                        gy1 = y1 + y_offset
                        gx2 = x2 + x_offset
                        gy2 = y2 + y_offset
                        cv2.rectangle(annotated_frame, (gx1, gy1), (gx2, gy2), (0, 255, 0), 2)

                print(f"🏄 {surfer_count}")
                smart_save_image(name, annotated_frame, surfer_count)  # save with boxes
                save_to_db(name, "Day", surfer_count, cur_wind, cur_wave)
            else:
                save_to_db(name, "Connection_Error", 0, cur_wind, cur_wave)


    except Exception as e:
        print(f"\n❌ General Error: {e}")
    finally:
        if driver:
            try:
                driver.quit()
                print("🔒 Browser closed safely.")
            except: pass
    
    print("⏳ Waiting 2 minutes for next scan...")
    time.sleep(120)
