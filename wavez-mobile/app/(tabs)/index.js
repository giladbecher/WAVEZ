// @ts-nocheck
import { LinearGradient } from 'expo-linear-gradient';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { ChevronDown, Home, LogOut, MapPin, TrendingUp, Users, Waves, Wind, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { I18nManager, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from '../../components/AppMap';
import { supabase } from '../../supabase';
import CrowdForecast from './CrowdForecast';


// מוודא כפיית RTL
try {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
} catch (e) { }

const BEACH_TRANSLATIONS = {
  "Haifa_BatGalim": "חיפה - בת גלים",
  "Haifa_Nirvana": "חיפה - נירוונה",
  "Haifa_Meridian": "חיפה - מרידיאן",
  "Krayot_MagicBoards": "קריות - מג'יק",
  "Maagan_Michael": "מעגן מיכאל",
  "Beit_Yanai": "בית ינאי",
  "Herzliya_Marina": "הרצליה - מרינה",
  "Herzliya_Dromi": "הרצליה - דרומי",
  "TLV_Dolphinarium": "תל אביב - דולפינריום",
  "Ma'aravi_tel_aviv": "תל אביב - מערבי",
  "TLV_Hilton": "תל אביב - הילטון",
};

// ipcamlive.com camera aliases — add more as they become available
// beachcam.co.il page URLs — these are whitelisted by ipcamlive so the stream plays
const BEACH_CAM_URLS = {
  "Ma'aravi_tel_aviv":  "https://beachcam.co.il/yafo.html",
  "TLV_Dolphinarium":   "https://beachcam.co.il/dolfinarium.html",
  "TLV_Hilton":         "https://beachcam.co.il/yamit.html",
  "Herzliya_Dromi":     "https://beachcam.co.il/dromi2.html",
  "Maagan_Michael":     "https://beachcam.co.il/maagan.html",
  "Haifa_Nirvana":      "https://beachcam.co.il/testcam1.html",
  "Haifa_Meridian":     "https://beachcam.co.il/meridian.html",
  "Haifa_BatGalim":     "https://beachcam.co.il/backdoor.html",
  "Krayot_MagicBoards": "https://beachcam.co.il/krayot.html",
  // Herzliya_Marina removed — page redirects to MyBeachCam.app paywall
  // Beit_Yanai uses kookint/Surfline — different embed, add later
};

const BEACH_COORDINATES = {
  "Haifa_BatGalim": [32.833767, 34.973001],
  "Haifa_Nirvana": [32.800532, 34.956114],
  "Haifa_Meridian": [32.807972, 34.955192],
  "Krayot_MagicBoards": [32.849163, 35.059862],
  "Maagan_Michael": [32.5593, 34.9048],
  "Beit_Yanai": [32.387333, 34.862500],
  "Herzliya_Marina": [32.165986, 34.795504],
  "Herzliya_Dromi": [32.156685, 34.793401],
  "TLV_Dolphinarium": [32.070084, 34.761568],
  "Ma'aravi_tel_aviv": [32.0591, 34.756515],
  "TLV_Hilton": [32.091237, 34.769357],
};

export default function HomeScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBeach, setSelectedBeach] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showBeachSelector, setShowBeachSelector] = useState(false);
  const [selectedMapMarker, setSelectedMapMarker] = useState(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackPhone, setFeedbackPhone] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedbackName || !feedbackEmail) {
      alert("נא למלא שם ומייל");
      return;
    }
    setSendingFeedback(true);
    try {
      const payload = {
        name: feedbackName,
        email: feedbackEmail,
        phone: feedbackPhone,
        feedback: feedbackDescription,
      };
      await fetch("https://script.google.com/macros/s/AKfycbyHaxbaGvgC1jThx2K_KwQrCgk0tD6eo0ARNPORZd0LJpz9LZzcgJW2eD2Hram6Usv2/exec", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setFeedbackSent(true);
    } catch (e) {
      alert("אירעה שגיאה. נסה שוב.");
    } finally {
      setSendingFeedback(false);
    }
  };


  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const fetchData = async () => {
    try {
      const { data: measurements, error } = await supabase
        .from('measurements_israel_time')
        .select('*')
        .order('id', { ascending: false })
        .limit(3000);

      if (error) throw error;
      const cleanData = measurements.filter(row => row.beach_name);
      setData(cleanData);
      if (!selectedBeach && cleanData.length > 0) {
        setSelectedBeach(cleanData[0].beach_name);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const availableBeaches = useMemo(() => {
    return Object.keys(BEACH_TRANSLATIONS);
  }, []);

  const beachData = useMemo(() => {
    if (!selectedBeach) return [];
    return data
      .filter(row => row.beach_name === selectedBeach)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data, selectedBeach]);

  const currentStatus = beachData.length > 0 ? beachData[beachData.length - 1] : null;

  // --- פונקציה לחישוב טווח גולשים ---
  const getSurferRange = (count) => {
    const safeCount = count || 0;
    const lower = Math.floor(safeCount / 5) * 5;
    const upper = lower + 5;
    return `${lower}-${upper}`;
  };

  // --- ציון התאמה לגלישה (0-100) ---
  // משקל: גולשים 50% | גובה גל 35% | רוח 15%
  const getSurfScore = (surferCount, waveHeight, windSpeed) => {
    const surfers = surferCount || 0;
    const wave    = waveHeight  || 0;
    const wind    = windSpeed   || 0;

    // ציון גולשים — פחות עמוס = עדיף
    let surferScore;
    if      (surfers <= 5)  surferScore = 100;
    else if (surfers <= 15) surferScore = 75;
    else if (surfers <= 25) surferScore = 45;
    else                    surferScore = 15;

    // ציון גלים — גלים בינוניים עדיפים
    let waveScore;
    if      (wave < 0.4)  waveScore = 20;   // ים שטוח
    else if (wave < 0.8)  waveScore = 60;
    else if (wave < 1.8)  waveScore = 100;  // אידיאלי
    else if (wave < 2.5)  waveScore = 65;
    else                  waveScore = 25;   // גלים גדולים מדי

    // ציון רוח — פחות רוח = עדיף
    let windScore;
    if      (wind < 15) windScore = 100;
    else if (wind < 25) windScore = 65;
    else if (wind < 35) windScore = 35;
    else                windScore = 10;

    return Math.round((surferScore * 0.50) + (waveScore * 0.35) + (windScore * 0.15));
  };

  // --- צבע פין לפי ציון ---
  const getPinColor = (score) => {
    if (score === null || score === undefined) return '#94a3b8'; // אפור — אין נתונים
    if (score >= 70) return '#22c55e';  // ירוק  — תנאים טובים
    if (score >= 40) return '#f97316';  // כתום — בינוני
    return '#ef4444';                   // אדום  — עמוס / לא מומלץ
  };

  const getScoreLabel = (score) => {
    if (score === null || score === undefined) return 'אין נתונים';
    if (score >= 70) return 'מעולה 🟢';
    if (score >= 40) return 'בסדר 🟠';
    return 'עמוס 🔴';
  };
  // ----------------------------------------

  const ResponsiveContainer = ({ children }) => (
    <View style={isDesktop ? styles.desktopContainer : styles.mobileContainer}>
      {children}
    </View>
  );

  const renderHome = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <ResponsiveContainer>


        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>בחר חוף לצפייה:</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowBeachSelector(true)}
          >
            <Text style={styles.selectorText}>
              {selectedBeach ? (BEACH_TRANSLATIONS[selectedBeach] || selectedBeach) : "טוען..."}
            </Text>
            <ChevronDown color="#94a3b8" size={20} />
          </TouchableOpacity>
        </View>

        <Modal
          transparent={true}
          visible={showBeachSelector}
          animationType="fade"
          onRequestClose={() => setShowBeachSelector(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowBeachSelector(false)}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, isDesktop && { width: '40%', maxHeight: '70%' }]}>
                <Text style={styles.modalTitle}>בחר חוף</Text>
                <ScrollView style={styles.modalScrollView} contentContainerStyle={{ flexGrow: 1 }}>
                  {availableBeaches.map(beach => (
                    <TouchableOpacity
                      key={beach}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedBeach(beach);
                        setShowBeachSelector(false);
                      }}
                    >
                      <Text style={styles.modalText}>{BEACH_TRANSLATIONS[beach] || beach}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        {currentStatus ? (
          <>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.lastUpdateTitle}>עדכון אחרון</Text>
                <Text style={styles.lastUpdateTime}>
                  {new Date(currentStatus.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <View style={[styles.statsGrid, isDesktop && { justifyContent: 'space-between' }]}>
              <View style={[styles.statCard, isDesktop && { flex: 1, marginHorizontal: 5 }]}>
                <Users color="#38bdf8" size={32} />
                <Text style={styles.statValue}>{getSurferRange(currentStatus.surfer_count)}</Text>
                <Text style={styles.statLabel}>גולשים</Text>
              </View>
              <View style={[styles.statCard, isDesktop && { flex: 1, marginHorizontal: 5 }]}>
                <Waves color="#38bdf8" size={32} />
                <Text style={styles.statValue}>{currentStatus.wave_height}m</Text>
                <Text style={styles.statLabel}>גובה גל</Text>
              </View>
              <View style={[styles.statCard, isDesktop && { flex: 1, marginHorizontal: 5 }]}>
                <Wind color="#38bdf8" size={32} />
                <Text style={styles.statValue}>{currentStatus.wind_speed}</Text>
                <Text style={styles.statLabel}>קמ"ש רוח</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, height: 500, backgroundColor: '#ffffff', borderRadius: 16 }} />
        )}

        {/* ── Live Stream Block (Option A: embed beachcam.co.il page) ── */}
        {(() => {
          const camUrl = BEACH_CAM_URLS[selectedBeach];
          return (
            <View style={styles.streamCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }}>
                <Text style={styles.streamTitle}>📹 שידור חי</Text>
                {camUrl && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' }} />
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>LIVE</Text>
                  </View>
                )}
              </View>
              {camUrl ? (
                <View style={styles.streamWrapper}>
                  {/* Clip window — landscape ratio matches camera (800×434), no empty space */}
                  <View style={{ width: '100%', aspectRatio: 800 / 434, overflow: 'hidden', borderRadius: 10, backgroundColor: '#000' }}>
                    <iframe
                      key={camUrl}
                      src={camUrl}
                      style={{
                        width: '100%',
                        height: 900,
                        border: 'none',
                        display: 'block',
                        marginTop: -320,
                      }}
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                      frameBorder="0"
                      scrolling="no"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.noStreamBox}>
                  <Text style={styles.noStreamIcon}>🎥</Text>
                  <Text style={styles.noStreamText}>מצלמה לא זמינה</Text>
                </View>
              )}
            </View>
          );
        })()}


        {!loading && (
          <>


            <View style={{ marginTop: 16, alignItems: 'center', paddingBottom: 20 }}>
              <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', fontWeight: '600' }}>
                💡 טיפ: לחוויה אידיאלית ומסך מלא
              </Text>
              <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                מומלץ להוסיף את האפליקציה למסך הבית
              </Text>
              <Text style={{ color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                (אייפון: שתף ⭠ הוסף למסך הבית | אנדרואיד: תפריט ⭠ התקן אפליקציה)
              </Text>

              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={() => setShowFeedbackModal(true)}
              >
                <Text style={styles.feedbackButtonText}>זיהית באג? נשמח למשוב שלך!</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/terms')} style={{ marginTop: 15 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' }}>
                  תנאי שימוש ונגישות
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}


      </ResponsiveContainer>
    </ScrollView>
  );

  const renderStats = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ResponsiveContainer>
        <Text style={styles.pageTitle}>תחזית חכמה</Text>
        <CrowdForecast />
      </ResponsiveContainer>
    </ScrollView>
  );

  const renderMap = () => {
    const beachStatuses = {}
    if (data && Array.isArray(data)) {
      data.forEach(measurement => {
        if (measurement && measurement.beach_name) {
          const beach = measurement.beach_name
          if (!beachStatuses[beach] || new Date(measurement.timestamp) > new Date(beachStatuses[beach].timestamp)) {
            beachStatuses[beach] = measurement
          }
        }
      })
    }

    const selectedStatus = selectedMapMarker ? beachStatuses[selectedMapMarker] : null;

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 32.165986,
            longitude: 34.795504,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onPress={() => setSelectedMapMarker(null)}
        >
          {Object.entries(BEACH_COORDINATES).map(([beachKey, coords]) => {
            const status = beachStatuses[beachKey];
            const score  = status
              ? getSurfScore(status.surfer_count, status.wave_height, status.wind_speed)
              : null;
            const pinColor = getPinColor(score);
            return (
              <Marker
                key={beachKey}
                coordinate={{ latitude: coords[0], longitude: coords[1] }}
                pinColor={pinColor}
                onPress={() => {
                  setSelectedMapMarker(beachKey);
                }}
              />
            )
          })}
        </MapView>

        {selectedMapMarker && (
          <View style={[styles.floatingCard, isDesktop && { width: 350, left: 20, right: 'auto' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>
                {BEACH_TRANSLATIONS[selectedMapMarker]}
              </Text>
              <TouchableOpacity onPress={() => setSelectedMapMarker(null)} style={{ padding: 5 }}>
                <Text style={{ fontSize: 18, color: '#94a3b8', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedStatus ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Users color="#38bdf8" size={24} />
                  <Text style={{ fontWeight: 'bold', marginTop: 4, fontSize: 16 }}>{getSurferRange(selectedStatus.surfer_count)}</Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>גולשים</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1, borderRightWidth: 1, borderLeftWidth: 1, borderColor: '#e2e8f0' }}>
                  <Waves color="#38bdf8" size={24} />
                  <Text style={{ fontWeight: 'bold', marginTop: 4, fontSize: 16 }}>{selectedStatus.wave_height}m</Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>גל</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Wind color="#38bdf8" size={24} />
                  <Text style={{ fontWeight: 'bold', marginTop: 4, fontSize: 16 }}>{selectedStatus.wind_speed}</Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>קמ"ש</Text>
                </View>
              </View>
            ) : (
              <Text style={{ textAlign: 'center', color: 'gray', paddingVertical: 10 }}>אין נתונים זמינים כרגע</Text>
            )}

            {selectedStatus && (() => {
              const score = getSurfScore(selectedStatus.surfer_count, selectedStatus.wave_height, selectedStatus.wind_speed);
              const pinColor = getPinColor(score);
              return (
                <>
                  <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 4 }}>
                    <View style={{
                      backgroundColor: pinColor,
                      borderRadius: 20,
                      paddingHorizontal: 18,
                      paddingVertical: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
                        ציון: {score}
                      </Text>
                      <Text style={{ color: 'white', fontSize: 13 }}>
                        {getScoreLabel(score)}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                    עדכון אחרון: {new Date(selectedStatus.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </>
              );
            })()}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.fullScreenBackground} />

      <Head>
        <title>WAVEZ PRO</title>
        <meta name="description" content="WAVEZ PRO - Surf Forecast" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.appHeader}>
          <Text style={styles.logoText}>WAVEZ <Text style={{ color: '#38bdf8' }}>PRO</Text></Text>
        </View>
        <View style={styles.mainContent}>
          {activeTab === 'home' && renderHome()}
          {activeTab === 'map' && renderMap()}
          {activeTab === 'stats' && renderStats()}
        </View>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]} onPress={() => setActiveTab('home')}>
            <Home color={activeTab === 'home' ? '#38bdf8' : '#64748b'} size={20} />
            <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>ראשי</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, activeTab === 'map' && styles.activeNavItem]} onPress={() => setActiveTab('map')}>
            <MapPin color={activeTab === 'map' ? '#38bdf8' : '#64748b'} size={20} />
            <Text style={[styles.navText, activeTab === 'map' && styles.activeNavText]}>מפה</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, activeTab === 'stats' && styles.activeNavItem]} onPress={() => setActiveTab('stats')}>
            <TrendingUp color={activeTab === 'stats' ? '#38bdf8' : '#64748b'} size={20} />
            <Text style={[styles.navText, activeTab === 'stats' && styles.activeNavText]}>תחזית</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Modal */}
        <Modal
          transparent={true}
          visible={showFeedbackModal}
          animationType="fade"
          onRequestClose={() => setShowFeedbackModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowFeedbackModal(false)}
            >
              <TouchableWithoutFeedback>
                <View style={[styles.feedbackModalContent, isDesktop && { width: 500 }]}>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => {
                      setShowFeedbackModal(false);
                      setTimeout(() => {
                        setFeedbackSent(false);
                        setFeedbackName('');
                        setFeedbackEmail('');
                        setFeedbackPhone('');
                        setFeedbackDescription('');
                      }, 500); // reset after closing
                    }}
                  >
                    <X color="#94a3b8" size={24} />
                  </TouchableOpacity>

                  {feedbackSent ? (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>תודה על המשוב!</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.modalTitle, { color: 'white', marginBottom: 20 }]}>ראית משהו לשיפור?</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="שם (חובה)"
                        placeholderTextColor="#64748b"
                        value={feedbackName}
                        onChangeText={setFeedbackName}
                      />
                      <TextInput
                        style={styles.inputField}
                        placeholder="מייל (חובה)"
                        placeholderTextColor="#64748b"
                        keyboardType="email-address"
                        value={feedbackEmail}
                        onChangeText={setFeedbackEmail}
                      />
                      <TextInput
                        style={styles.inputField}
                        placeholder="טלפון (אופציונלי)"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={feedbackPhone}
                        onChangeText={setFeedbackPhone}
                      />
                      <TextInput
                        style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]}
                        placeholder="תיאור הפנייה"
                        placeholderTextColor="#64748b"
                        multiline
                        value={feedbackDescription}
                        onChangeText={setFeedbackDescription}
                      />
                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSendFeedback}
                        disabled={sendingFeedback}
                      >
                        {sendingFeedback ? (
                          <ActivityIndicator color="#0f172a" />
                        ) : (
                          <Text style={styles.submitButtonText}>שלח</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  mobileContainer: {
    width: '100%',
  },

  container: { flex: 1 },
  fullScreenBackground: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },

  appHeader: { padding: 20, paddingTop: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  logoText: { fontSize: 24, fontWeight: 'bold', color: 'white', letterSpacing: 2 },

  mainContent: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },

  sectionTitle: { color: '#94a3b8', marginBottom: 8, fontSize: 14, textAlign: 'right', width: '100%' },

  selectorButton: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155'
  },
  selectorText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: 16, width: '85%', maxHeight: '60%', padding: 20,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 15 },
  modalScrollView: { width: '100%' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', width: '100%', alignItems: 'flex-start' },
  modalText: { fontSize: 18, color: '#334155', textAlign: 'right' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center', backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8', marginRight: 6 },
  liveText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 12 },

  lastUpdateTitle: { color: '#64748b', fontSize: 12, textAlign: 'right' },
  lastUpdateTime: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'right' },

  statsGrid: {
    flexDirection: 'row',
    gap: 12, marginBottom: 20
  },
  statCard: {
    flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.6)', padding: 16, borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155'
  },
  statValue: { color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 2 },

  pageTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },

  streamCard:    { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 20 },
  streamTitle:   { color: '#38bdf8', fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  streamWrapper: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
  noStreamBox:   { height: 160, borderRadius: 10, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  noStreamIcon:  { fontSize: 36, marginBottom: 8 },
  noStreamText:  { color: '#64748b', fontSize: 15, fontWeight: '600' },
  streamOpenBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  streamOpenBtnText: { color: '#38bdf8', fontSize: 13, textDecorationLine: 'underline' },

  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155'
  },
  rank: { color: '#64748b', width: 30, textAlign: 'center' },
  rowName: { color: 'white', flex: 1, textAlign: 'right', fontWeight: 'bold' },
  rowValue: { color: '#38bdf8', fontWeight: 'bold' },

  bottomNav: {
    flexDirection: 'row', backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b',
    paddingVertical: 10, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between'
  },
  navItem: { alignItems: 'center', flex: 1, paddingVertical: 8, minHeight: 50, justifyContent: 'center' },
  activeNavItem: {},
  navText: { color: '#64748b', fontSize: 10, marginTop: 4 },
  activeNavText: { color: '#38bdf8', fontWeight: 'bold' },
  loadingText: { color: 'white', textAlign: 'center', marginTop: 50 },

  floatingCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  feedbackButton: {
    marginTop: 20,
    marginBottom: 5,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  feedbackButtonText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  feedbackModalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: '90%',
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  closeModalButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  inputField: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: 'white',
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});