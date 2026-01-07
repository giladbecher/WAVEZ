// @ts-nocheck
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, StatusBar, TouchableOpacity, Modal, TouchableWithoutFeedback, I18nManager, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { Waves, Wind, Users, MapPin, Home, TrendingUp, ChevronDown, MessageCircle, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Head from 'expo-router/head';
import MapView, { Marker } from '../../components/AppMap'; 
import CrowdForecast from './CrowdForecast';
import FeedbackModal from '@/components/FeedbackModal';

// מוודא כפיית RTL
try {
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
} catch (e) {}

const BEACH_TRANSLATIONS = {
  "Haifa_BatGalim": "חיפה - בת גלים",
  "Haifa_Nirvana": "חיפה - נירוונה",
  "Haifa_Meridian": "חיפה - מרידיאן",
  "Krayot_MagicBoards": "קריות - מג'יק",
  "Maagan_Michael": "מעגן מיכאל",
  "Manau_neurim_netanya": "נתניה - נעורים",
  "Netanya_Poleg": "נתניה - פולג",
  "Herzliya_Marina": "הרצליה - מרינה",
  "Herzliya_Zvulun": "הרצליה - זבולון",
  "Herzliya_Dromi": "הרצליה - דרומי",
  "TLV_Dolphinarium": "תל אביב - דולפינריום",
  "Ma'aravi_tel_aviv": "תל אביב - מערבי",
  "TLV_Hilton_B": "תל אביב - הילטון ב'",
  "TLV_Hilton_A": "תל אביב - הילטון א'",
  "TLV_Hilton_A_Lefts": "תל אביב - הילטון שמאל"
};

const BEACH_COORDINATES = {
  "Haifa_BatGalim": [32.833767, 34.973001],
  "Haifa_Nirvana": [32.800532, 34.956114],
  "Haifa_Meridian": [32.807972, 34.955192],
  "Krayot_MagicBoards": [32.849163, 35.059862],
  "Maagan_Michael": [32.5593, 34.9048],
  "Manau_neurim_netanya": [32.37496, 34.858718],
  "Netanya_Poleg": [32.2747, 34.8329],
  "Herzliya_Marina": [32.165986, 34.795504],
  "Herzliya_Zvulun": [32.172525, 34.798293],
  "Herzliya_Dromi": [32.156685, 34.793401],
  "TLV_Dolphinarium": [32.070084, 34.761568],
  "Ma'aravi_tel_aviv": [32.0591, 34.756515],
  "TLV_Hilton_B": [32.091237, 34.769357],
  "TLV_Hilton_A": [32.089638, 34.768735],
  "TLV_Hilton_A_Lefts": [32.08752, 34.768016]
};

export default function HomeScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBeach, setSelectedBeach] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showBeachSelector, setShowBeachSelector] = useState(false);
  const [selectedMapMarker, setSelectedMapMarker] = useState(null);
  const [isFeedbackVisible, setFeedbackVisible] = useState(false);

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
      const cleanData = measurements.filter(row => row.beach_name && row.beach_name !== 'Haifa_Backdoor');
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
    const uniqueNames = [...new Set(data.map(item => item.beach_name))];
    return uniqueNames.sort();
  }, [data]);

  const beachData = useMemo(() => {
    if (!selectedBeach) return [];
    return data
      .filter(row => row.beach_name === selectedBeach)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data, selectedBeach]);

  const currentStatus = beachData.length > 0 ? beachData[beachData.length - 1] : null;

  // --- 👇 פונקציה לחישוב טווח גולשים ---
  const getSurferRange = (count) => {
    const safeCount = count || 0;
    const lower = Math.floor(safeCount / 5) * 5;
    const upper = lower + 5;
    return `${lower}-${upper}`;
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
        {/* 👇 כפתור התנתקות זמני לבדיקות */}
        <TouchableOpacity 
            onPress={async () => {
                await supabase.auth.signOut();
                // אין צורך באלרט, ה-_layout יזהה את הניתוק ויעביר אותך למסך כניסה
            }}
            style={{ 
                backgroundColor: '#ef4444', 
                padding: 10, 
                borderRadius: 8, 
                alignSelf: 'center', 
                marginBottom: 15,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8
            }}
        >
            <LogOut color="white" size={18} />
            <Text style={{ color: 'white', fontWeight: 'bold' }}>התנתק (לבדיקה)</Text>
        </TouchableOpacity>
        {/* 👆 סוף כפתור התנתקות */}

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
                    <ScrollView style={styles.modalScrollView} contentContainerStyle={{flexGrow: 1}}>
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

        {data.length > 0 && (
            <View style={styles.leaderboardCard}>
            <Text style={styles.leaderboardTitle}>👥 החופים העמוסים ביותר</Text>
            {availableBeaches.map(beach => {
                const beachReadings = data.filter(r => r.beach_name === beach);
                const lastReading = beachReadings[0]; 
                return lastReading ? { ...lastReading, name: beach } : null;
            }).filter(Boolean)
                .sort((a, b) => b.surfer_count - a.surfer_count)
                .slice(0, 5)
                .map((beach, index) => (
                <View key={beach.name} style={styles.leaderboardRow}>
                    <Text style={styles.rank}>#{index + 1}</Text>
                    <Text style={styles.rowName}>{BEACH_TRANSLATIONS[beach.name] || beach.name}</Text>
                    <Text style={styles.rowValue}>{getSurferRange(beach.surfer_count)} גולשים</Text>
                </View>
                ))}
            </View>
        )}

        {!loading && (
            <>
                <TouchableOpacity 
                style={{
                    marginTop: 20,
                    backgroundColor: '#1e293b',
                    padding: 15,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#334155',
                    gap: 15
                }}
                onPress={() => setFeedbackVisible(true)}
                >
                <MessageCircle size={20} color="#3b82f6" />
                <Text style={{ color: '#f8fafc', fontWeight: 'bold' }}>יש לך רעיון לשיפור? לחץ כאן</Text>
                </TouchableOpacity>

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
                </View>
            </>
        )}

        <FeedbackModal 
            visible={isFeedbackVisible} 
            onClose={() => setFeedbackVisible(false)} 
        />
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
            return (
              <Marker
                key={beachKey}
                coordinate={{ latitude: coords[0], longitude: coords[1] }}
                onPress={() => {
                   setSelectedMapMarker(beachKey);
                }} 
              />
            )
          })}
        </MapView>

        {selectedMapMarker && (
          <View style={[styles.floatingCard, isDesktop && { width: 350, left: 20, right: 'auto' }]}>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                <Text style={{fontSize: 18, fontWeight: 'bold', color: '#1e293b'}}>
                  {BEACH_TRANSLATIONS[selectedMapMarker]}
                </Text>
                <TouchableOpacity onPress={() => setSelectedMapMarker(null)} style={{padding: 5}}>
                  <Text style={{fontSize: 18, color: '#94a3b8', fontWeight: 'bold'}}>✕</Text>
                </TouchableOpacity>
             </View>

             {selectedStatus ? (
               <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <View style={{alignItems: 'center', flex: 1}}>
                      <Users color="#38bdf8" size={24} />
                      <Text style={{fontWeight: 'bold', marginTop: 4, fontSize: 16}}>{getSurferRange(selectedStatus.surfer_count)}</Text>
                      <Text style={{fontSize: 12, color: '#64748b'}}>גולשים</Text>
                  </View>
                  <View style={{alignItems: 'center', flex: 1, borderRightWidth: 1, borderLeftWidth: 1, borderColor: '#e2e8f0'}}>
                      <Waves color="#38bdf8" size={24} />
                      <Text style={{fontWeight: 'bold', marginTop: 4, fontSize: 16}}>{selectedStatus.wave_height}m</Text>
                      <Text style={{fontSize: 12, color: '#64748b'}}>גל</Text>
                  </View>
                  <View style={{alignItems: 'center', flex: 1}}>
                      <Wind color="#38bdf8" size={24} />
                      <Text style={{fontWeight: 'bold', marginTop: 4, fontSize: 16}}>{selectedStatus.wind_speed}</Text>
                      <Text style={{fontSize: 12, color: '#64748b'}}>קמ"ש</Text>
                  </View>
               </View>
             ) : (
               <Text style={{textAlign: 'center', color: 'gray', paddingVertical: 10}}>אין נתונים זמינים כרגע</Text>
             )}
             
             {selectedStatus && (
               <Text style={{textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 12}}>
                 עדכון אחרון: {new Date(selectedStatus.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
               </Text>
             )}
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
  
  leaderboardCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 20 },
  leaderboardTitle: { color: '#38bdf8', fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'right' },
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
  activeNavItem: { },
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
});