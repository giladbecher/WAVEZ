import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { supabase } from '../../supabase';
import { LineChart } from "react-native-chart-kit";
import { useLanguage } from '../../contexts/LanguageContext';
import { sanitizeData } from '../../utils/dataSanitation';

// Screen width for chart sizing
const SCREEN_WIDTH = Dimensions.get("window").width;

// Canonical beach key order — display names come from LanguageContext
const AVAILABLE_BEACHES = [
  "Haifa_BatGalim",
  "Haifa_Nirvana",
  "Haifa_Meridian",
  "Krayot_MagicBoards",
  "Maagan_Michael",
  "Beit_Yanai",
  "Herzliya_Marina",
  "Herzliya_Dromi",
  "TLV_Dolphinarium",
  "Ma'aravi_tel_aviv",
  "TLV_Hilton",
];

const CrowdForecast = () => {
  const { t, tBeach, dir, locale, getWaveSizeLabel } = useLanguage();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBeach, setSelectedBeach] = useState('TLV_Dolphinarium');
  const [historicalData, setHistoricalData] = useState({});
  const [waveForecast, setWaveForecast] = useState({});
  const [windForecast, setWindForecast] = useState({});
  const [windSpeedForecast, setWindSpeedForecast] = useState({});
  const [holidays, setHolidays] = useState(new Set());
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

  // ─── Data fetchers ───────────────────────────────────────────────
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

      const sanitizedMeasurements = sanitizeData(measurements);
      const hourlyData = {};
      sanitizedMeasurements.forEach(measurement => {
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
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=32.0853&longitude=34.7818&hourly=wave_height&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=32.0853&longitude=34.7818&hourly=wind_direction_10m,wind_speed_10m&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;

      const [marineRes, weatherRes] = await Promise.all([
        fetch(marineUrl),
        fetch(weatherUrl)
      ]);

      const marineData = await marineRes.json();
      const weatherData = await weatherRes.json();

      const hourlyWaves = {};
      const hourlyWind = {};
      const hourlyWindSpeed = {};

      if (marineData.hourly && marineData.hourly.time && marineData.hourly.wave_height) {
        marineData.hourly.time.forEach((timeStr, index) => {
          const hour = new Date(timeStr).getHours();
          if (hour >= 6 && hour <= 19) {
            hourlyWaves[hour] = marineData.hourly.wave_height[index];
          }
        });
      }

      if (weatherData.hourly && weatherData.hourly.time && weatherData.hourly.wind_direction_10m && weatherData.hourly.wind_speed_10m) {
        weatherData.hourly.time.forEach((timeStr, index) => {
          const hour = new Date(timeStr).getHours();
          if (hour >= 6 && hour <= 19) {
            hourlyWind[hour] = weatherData.hourly.wind_direction_10m[index];
            hourlyWindSpeed[hour] = weatherData.hourly.wind_speed_10m[index];
          }
        });
      }

      setWaveForecast(hourlyWaves);
      setWindForecast(hourlyWind);
      setWindSpeedForecast(hourlyWindSpeed);
    } catch (error) {
      console.error("Error fetching forecasts:", error);
    }
  };

  const predictions = useMemo(() => {
    const result = [];
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    
    const isHoliday = holidays.has(localDateStr);
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
    
    // Day factor: Holiday takes precedence over standard weekend
    const dayFactor = isHoliday ? 1.4 : (isWeekend ? 1.3 : 1.0);

    for (let hour = 6; hour <= 19; hour++) {
      const historicalAvg = historicalData[hour] || 0;
      const waveHeight    = waveForecast[hour]   || 0;
      const windDir       = windForecast[hour];

      // 1. Continuous Gaussian Wave Factor (peaks at 1.25m with amplitude 1.1, baseline 0.4)
      const peak = 1.25;
      const stdDev = 0.55;
      const amplitude = 1.1;
      const baseline = 0.4;
      const waveFactor = baseline + amplitude * Math.exp(-Math.pow(waveHeight - peak, 2) / (2 * Math.pow(stdDev, 2)));

      // 2. Wind Direction Factor (Offshore / Onshore)
      let windFactor = 1.0;
      if (windDir !== undefined && windDir !== null) {
        // Eastern wind (Offshore): 45 to 135 degrees
        if (windDir >= 45 && windDir <= 135) {
          windFactor = 1.2;
        }
        // Western wind (Onshore): 225 to 315 degrees
        else if (windDir >= 225 && windDir <= 315) {
          windFactor = 0.8;
        }
      }

      // 3. Combine all multipliers
      let predictedCrowd = Math.round(historicalAvg * waveFactor * windFactor * dayFactor);

      // 4. Fallback logic: show crowd for good wave heights even if no historical average is recorded
      if (predictedCrowd === 0 && waveHeight >= 1.0) {
        predictedCrowd = Math.max(3, Math.round(waveHeight * 2));
      }

      result.push({ hour, predictedCrowd });
    }
    return result;
  }, [historicalData, waveForecast, windForecast, holidays, selectedDate]);

  const seaConditions = useMemo(() => {
    const waveVals = Object.values(waveForecast);
    const windSpeedVals = Object.values(windSpeedForecast);
    const windDirVals = Object.values(windForecast);

    if (waveVals.length === 0) return null;

    const avgWave = waveVals.reduce((sum, v) => sum + v, 0) / waveVals.length;
    const avgWindSpeed = windSpeedVals.reduce((sum, v) => sum + v, 0) / windSpeedVals.length;
    
    let offshoreCount = 0;
    let onshoreCount = 0;
    let sideshoreCount = 0;

    windDirVals.forEach(windDir => {
      if (windDir >= 45 && windDir <= 135) {
        offshoreCount++;
      } else if (windDir >= 225 && windDir <= 315) {
        onshoreCount++;
      } else {
        sideshoreCount++;
      }
    });

    let windLabel = t('cfWindSideshore');
    if (offshoreCount > onshoreCount && offshoreCount > sideshoreCount) {
      windLabel = t('cfWindOffshore');
    } else if (onshoreCount > offshoreCount && onshoreCount > sideshoreCount) {
      windLabel = t('cfWindOnshore');
    }

    return {
      waveHeight: avgWave.toFixed(1),
      windSpeed: Math.round(avgWindSpeed),
      windLabel
    };
  }, [waveForecast, windForecast, windSpeedForecast, locale]);

  useEffect(() => {
    fetchHistoricalData(selectedDate, selectedBeach);
    fetchWaveForecast(selectedDate);
  }, [selectedDate, selectedBeach]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch("https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&i=on&year=now");
        const data = await response.json();
        if (data.items) {
          const holidayDates = new Set(data.items.map(item => item.date));
          setHolidays(holidayDates);
        }
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };
    fetchHolidays();
  }, []);

  // Locale-aware date formatter — switches between Hebrew and English
  const formatDate = (date) => {
    const dayName  = date.toLocaleDateString(locale, { weekday: 'short' });
    const dayMonth = date.toLocaleDateString(locale, { day: 'numeric', month: 'numeric' });
    return `${dayName} ${dayMonth}`;
  };

  const chartData = {
    labels: predictions.map((p, i) => (i % 3 === 0 ? `${p.hour}:00` : '')),
    datasets: [
      {
        data: predictions.length > 0 ? predictions.map(p => p.predictedCrowd) : [0],
        color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  return (
    <View style={styles.container}>

      {/* Beach selector */}
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.selectorLabel, { textAlign: dir }]}>{t('cfSelectBeach')}</Text>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setShowBeachSelector(true)}>
          <Text style={styles.selectorText}>{tBeach(selectedBeach)}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent={true} visible={showBeachSelector} animationType="fade" onRequestClose={() => setShowBeachSelector(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowBeachSelector(false)}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('cfSelectBeachModal')}</Text>
              <ScrollView style={styles.modalScrollView} contentContainerStyle={{ flexGrow: 1 }}>
                {AVAILABLE_BEACHES.map((beach, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => { setSelectedBeach(beach); setShowBeachSelector(false); }}
                  >
                    <Text style={[styles.modalText, { textAlign: dir }]}>{tBeach(beach)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Date selector */}
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.selectorLabel, { textAlign: dir }]}>{t('cfSelectDate')}</Text>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setShowDateSelector(true)}>
          <Text style={styles.selectorText}>{formatDate(selectedDate)}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent={true} visible={showDateSelector} animationType="fade" onRequestClose={() => setShowDateSelector(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDateSelector(false)}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('cfSelectDateModal')}</Text>
              <ScrollView style={styles.modalScrollView} contentContainerStyle={{ flexGrow: 1 }}>
                {dateOptions.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => { setSelectedDate(date); setShowDateSelector(false); }}
                  >
                    <Text style={styles.modalText}>{formatDate(date)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Sea conditions card */}
      {seaConditions && (
        <View style={styles.seaConditionsCard}>
          <Text style={[styles.seaConditionsTitle, { textAlign: dir }]}>
            {t('cfSeaConditions')}
          </Text>
          <View style={[styles.seaConditionsRow, { flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }]}>
            <View style={styles.seaConditionsItem}>
              <Text style={styles.seaConditionsValue}>{seaConditions.waveHeight}m</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: -2, marginBottom: 2 }}>
                ({getWaveSizeLabel(seaConditions.waveHeight)})
              </Text>
              <Text style={styles.seaConditionsLabel}>{t('waveHeight')}</Text>
            </View>
            <View style={styles.seaConditionsItem}>
              <Text style={styles.seaConditionsValue}>{seaConditions.windSpeed} km/h</Text>
              <Text style={styles.seaConditionsLabel}>{t('windKmh')}</Text>
            </View>
            <View style={styles.seaConditionsItem}>
              <Text style={styles.seaConditionsWindDirValue}>{seaConditions.windLabel}</Text>
              <Text style={styles.seaConditionsLabel}>{t('cfWindDirection')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Chart */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>{t('cfLoading')}</Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>{t('cfChartTitle')}</Text>
          {predictions.length > 0 ? (
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
                    <View key={index} style={{ position: 'absolute', top: y - 20, left: x - 10, width: 20, alignItems: 'center' }}>
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
                  style: { borderRadius: 16, paddingRight: 0, paddingLeft: 0 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#0f172a" },
                  propsForBackgroundLines: { stroke: "#334155", strokeWidth: 0.5, strokeDasharray: "" },
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
                withInnerLines={true}
                withOuterLines={false}
              />
            </View>
          ) : (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.noDataText}>{t('cfNoData')}</Text>
            </View>
          )}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{t('cfChartNote')}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, paddingHorizontal: 20 },

  selectorLabel: { color: '#94a3b8', marginBottom: 8, fontSize: 14 },
  selectorButton: { backgroundColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  selectorText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  dropdownArrow: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },

  loadingContainer: { alignItems: 'center', paddingVertical: 30 },
  loadingText: { color: '#94a3b8', marginTop: 10, fontSize: 14 },

  chartWrapper: { marginBottom: 30, marginTop: 10, alignItems: 'center', width: '100%' },
  chartTitle: { color: '#38bdf8', fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', width: '100%' },
  noDataText: { color: 'white', textAlign: 'center' },

  summaryContainer: { marginTop: 10, paddingHorizontal: 10 },
  summaryText: { color: '#64748b', fontSize: 12, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 16, width: '85%', maxHeight: '60%', padding: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 15 },
  modalScrollView: { width: '100%' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'flex-start' },
  modalText: { fontSize: 18, color: '#334155' },
  seaConditionsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  seaConditionsTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  seaConditionsRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  seaConditionsItem: {
    flex: 1,
    alignItems: 'center',
  },
  seaConditionsValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  seaConditionsWindDirValue: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  seaConditionsLabel: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default CrowdForecast;