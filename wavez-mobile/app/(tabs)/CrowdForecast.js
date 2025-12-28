import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TouchableWithoutFeedback, I18nManager } from 'react-native';
import { supabase } from '../../supabase'; 
import { LinearGradient } from 'expo-linear-gradient';

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

const AVAILABLE_BEACHES = Object.keys(BEACH_TRANSLATIONS);

const CrowdForecast = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBeach, setSelectedBeach] = useState('TLV_Dolphinarium');
  const [historicalData, setHistoricalData] = useState({});
  const [waveForecast, setWaveForecast] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showBeachSelector, setShowBeachSelector] = useState(false);

  const dateOptions = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  const fetchHistoricalData = async (targetDate, beach) => {
    try {
      setLoading(true);
      const dayOfWeek = targetDate.getDay();
      const { data: measurements, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('beach_name', beach)
        .order('timestamp', { ascending: false })
        .limit(5000);

      if (error) throw error;

      const hourlyData = {};
      measurements.forEach(measurement => {
        const measurementDate = new Date(measurement.timestamp);
        if (measurementDate.getDay() === dayOfWeek) {
          const hour = measurementDate.getHours();
          if (hour >= 6 && hour <= 19) {
            if (!hourlyData[hour]) hourlyData[hour] = [];
            hourlyData[hour].push(measurement.surfer_count);
          }
        }
      });

      const averages = {};
      Object.keys(hourlyData).forEach(hour => {
        const counts = hourlyData[hour];
        averages[hour] = counts.length > 0 ? counts.reduce((sum, count) => sum + count, 0) / counts.length : 0;
      });

      setHistoricalData(averages);
    } catch (error) {
      console.error("Error fetching historical data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaveForecast = async (targetDate) => {
    try {
      const dateStr = targetDate.toISOString().split('T')[0];
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=32.0853&longitude=34.7818&hourly=wave_height&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;
      const response = await fetch(url);
      const data = await response.json();
      const hourlyWaves = {};
      if (data.hourly && data.hourly.time && data.hourly.wave_height) {
        data.hourly.time.forEach((timeStr, index) => {
          const hour = new Date(timeStr).getHours();
          if (hour >= 6 && hour <= 19) {
            hourlyWaves[hour] = data.hourly.wave_height[index];
          }
        });
      }
      setWaveForecast(hourlyWaves);
    } catch (error) {
      console.error("Error fetching wave forecast:", error);
    }
  };

  const predictions = useMemo(() => {
    const result = [];
    for (let hour = 6; hour <= 19; hour++) {
      const historicalAvg = historicalData[hour] || 0;
      const waveHeight = waveForecast[hour] || 0;
      let waveFactor = 1.0;
      if (waveHeight > 1.2) waveFactor = 1.5;
      else if (waveHeight < 0.4) waveFactor = 0.5;

      let predictedCrowd = Math.round(historicalAvg * waveFactor);
      if (predictedCrowd === 0 && waveHeight >= 1.0) {
        predictedCrowd = Math.max(3, Math.round(waveHeight * 2));
      }

      let loadLevel = 'low';
      let loadColor = '#22c55e';
      if (predictedCrowd > 25) {
        loadLevel = 'high';
        loadColor = '#ef4444';
      } else if (predictedCrowd > 15) {
        loadLevel = 'medium';
        loadColor = '#f97316';
      }

      result.push({
        hour,
        waveHeight: waveHeight.toFixed(1),
        predictedCrowd,
        loadColor,
        loadLevel
      });
    }
    return result;
  }, [historicalData, waveForecast]);

  useEffect(() => {
    fetchHistoricalData(selectedDate, selectedBeach);
    fetchWaveForecast(selectedDate);
  }, [selectedDate, selectedBeach]);

  const formatHour = (hour) => `${hour.toString().padStart(2, '0')}:00`;
  const formatDate = (date) => {
    const dayName = date.toLocaleDateString('he-IL', { weekday: 'short' });
    const dayMonth = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
    return `${dayName} ${dayMonth}`;
  };

  return (
    <View style={styles.container}>
      {/* Beach Selector */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.selectorLabel}>בחר חוף:</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowBeachSelector(true)}
        >
          <Text style={styles.selectorText}>
            {BEACH_TRANSLATIONS[selectedBeach] || selectedBeach}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
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
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>בחר חוף</Text>
              <ScrollView style={styles.modalScrollView} contentContainerStyle={{flexGrow: 1}}>
                {AVAILABLE_BEACHES.map((beach, index) => (
                  <TouchableOpacity
                    key={index}
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

      {/* Date Selector */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.selectorLabel}>בחר תאריך:</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowDateSelector(true)}
        >
          <Text style={styles.selectorText}>{formatDate(selectedDate)}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={showDateSelector}
        animationType="fade"
        onRequestClose={() => setShowDateSelector(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDateSelector(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>בחר תאריך</Text>
              <ScrollView style={styles.modalScrollView} contentContainerStyle={{flexGrow: 1}}>
                {dateOptions.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedDate(date);
                      setShowDateSelector(false);
                    }}
                  >
                    <Text style={styles.modalText}>{formatDate(date)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>טוען תחזית...</Text>
        </View>
      ) : (
        <ScrollView style={styles.hourlyContainer} nestedScrollEnabled={true}>
          {predictions.map((prediction, index) => (
            <View key={index} style={styles.hourRow}>
              {/* צד ימין: שעה וגובה גל */}
              <View style={styles.hourInfo}>
                <Text style={styles.hourText}>{formatHour(prediction.hour)}</Text>
                <Text style={styles.waveText}>{prediction.waveHeight}m</Text>
              </View>
              
              {/* צד שמאל: בר עומס */}
              <View style={styles.loadContainer}>
                <View style={styles.loadBar}>
                  <LinearGradient
                    colors={[prediction.loadColor, prediction.loadColor + '80']}
                    style={[styles.loadFill, { width: `${Math.min((prediction.predictedCrowd / 30) * 100, 100)}%` }]}
                  />
                </View>
                <Text style={styles.crowdText}>{prediction.predictedCrowd}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>שקט</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f97316' }]} />
          <Text style={styles.legendText}>בינוני</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>עמוס</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, paddingHorizontal: 20 },
  
  // תיקון: יישור לימין במפורש
  selectorLabel: { color: '#94a3b8', marginBottom: 8, fontSize: 14, textAlign: 'right' },
  
  selectorButton: {
    backgroundColor: '#1e293b', 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155',
  },
  selectorText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  dropdownArrow: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  
  loadingContainer: { alignItems: 'center', paddingVertical: 30 },
  loadingText: { color: '#94a3b8', marginTop: 10, fontSize: 14 },
  
  hourlyContainer: { maxHeight: 300 },
  hourRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1e293b', padding: 15, marginBottom: 8, borderRadius: 12,
    borderWidth: 1, borderColor: '#334155',
  },
  
  hourInfo: { alignItems: 'flex-start' }, 
  hourText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  waveText: { color: '#38bdf8', fontSize: 14, marginTop: 2 },
  
  loadContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 15 },
  loadBar: { flex: 1, height: 20, backgroundColor: '#334155', borderRadius: 10, overflow: 'hidden', marginRight: 10 }, 
  loadFill: { height: '100%', borderRadius: 10 },
  crowdText: { color: 'white', fontSize: 14, fontWeight: 'bold', minWidth: 30, textAlign: 'center' },
  
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 15, gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginLeft: 6 },
  legendText: { color: '#94a3b8', fontSize: 12 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: 16, width: '85%', maxHeight: '60%', padding: 20,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 15 },
  modalScrollView: { width: '100%' },
  // תיקון: יישור התחלה (ימין ב-RTL)
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'flex-start' }, 
  modalText: { fontSize: 18, color: '#334155', textAlign: 'right' },
});

export default CrowdForecast;