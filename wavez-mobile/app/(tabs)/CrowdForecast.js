import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { supabase } from '../../supabase';
import { LineChart } from "react-native-chart-kit";

// חישוב רוחב מסך
const SCREEN_WIDTH = Dimensions.get("window").width;

const BEACH_TRANSLATIONS = {
  "Haifa_BatGalim": "חיפה - בת גלים",
  "Haifa_Nirvana": "חיפה - נירוונה",
  "Haifa_Meridian": "חיפה - מרידיאן",
  "Krayot_MagicBoards": "קריות - מג'יק",
  "Maagan_Michael": "מעגן מיכאל",
  "Herzliya_Marina": "הרצליה - מרינה",
  "Herzliya_Dromi": "הרצליה - דרומי",
  "TLV_Dolphinarium": "תל אביב - דולפינריום",
  "Ma'aravi_tel_aviv": "תל אביב - מערבי",
  "TLV_Hilton": "תל אביב - הילטון'",
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

  // --- לוגיקה ---
  const fetchHistoricalData = async (targetDate, beach) => {
    try {
      setLoading(true);
      const dayOfWeek = targetDate.getDay();
      const { data: measurements, error } = await supabase
        .from('measurements_israel_time')
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

      result.push({
        hour,
        predictedCrowd
      });
    }
    return result;
  }, [historicalData, waveForecast]);

  useEffect(() => {
    fetchHistoricalData(selectedDate, selectedBeach);
    fetchWaveForecast(selectedDate);
  }, [selectedDate, selectedBeach]);

  const formatDate = (date) => {
    const dayName = date.toLocaleDateString('he-IL', { weekday: 'short' });
    const dayMonth = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
    return `${dayName} ${dayMonth}`;
  };

  const chartData = {
    labels: predictions.map((p, i) => (i % 3 === 0 ? `${p.hour}:00` : '')),
    datasets: [
      {
        data: predictions.length > 0 ? predictions.map(p => p.predictedCrowd) : [0],
        color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
        strokeWidth: 3
      }
    ],
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
              <ScrollView style={styles.modalScrollView} contentContainerStyle={{ flexGrow: 1 }}>
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
              <ScrollView style={styles.modalScrollView} contentContainerStyle={{ flexGrow: 1 }}>
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
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>מגמת עומס יומית</Text>

          {predictions.length > 0 ? (
            // 👇 כאן השינוי: עטפנו את הגרף ב-View שדוחף אותו שמאלה
            <View style={{ paddingRight: 25 }}>
              <LineChart
                data={chartData}
                width={SCREEN_WIDTH - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                yAxisInterval={1}
                fromZero={true}
                renderDotContent={({ x, y, index, indexData }) => {
                  if (indexData === 0) return null;

                  return (
                    <View
                      key={index}
                      style={{
                        position: 'absolute',
                        top: y - 20,
                        left: x - 10,
                        width: 20,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ fontSize: 10, color: '#38bdf8', fontWeight: 'bold' }}>
                        {Math.round(indexData)}
                      </Text>
                    </View>
                  );
                }}
                chartConfig={{
                  backgroundColor: "transparent",
                  backgroundGradientFrom: "transparent",
                  backgroundGradientTo: "transparent",
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                  style: {
                    borderRadius: 16,
                    paddingRight: 0,
                    paddingLeft: 0
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#0f172a"
                  },
                  propsForBackgroundLines: {
                    stroke: "#334155",
                    strokeWidth: 0.5,
                    strokeDasharray: ""
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                  // הסרנו מכאן את marginRight כדי למנוע את השגיאה
                }}
                withInnerLines={true}
                withOuterLines={false}
              />
            </View>
          ) : (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.noDataText}>אין נתונים ליום זה</Text>
            </View>
          )}

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              * המספרים על הגרף מייצגים כמות גולשים משוערת
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, paddingHorizontal: 20 },

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

  chartWrapper: {
    marginBottom: 30,
    marginTop: 10,
    alignItems: 'center',
    width: '100%'
  },

  chartTitle: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    width: '100%'
  },

  noDataText: {
    color: 'white',
    textAlign: 'center'
  },
  summaryContainer: {
    marginTop: 10,
    paddingHorizontal: 10
  },
  summaryText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center'
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: 16, width: '85%', maxHeight: '60%', padding: 20,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 15 },
  modalScrollView: { width: '100%' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'flex-start' },
  modalText: { fontSize: 18, color: '#334155', textAlign: 'right' },
});

export default CrowdForecast;