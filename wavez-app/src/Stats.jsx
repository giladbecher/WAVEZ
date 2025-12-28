import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, BarChart3, Users, Sparkles, Calendar, Waves } from 'lucide-react'

// Supabase configuration
const SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co"
const SUPABASE_KEY = "sb_publishable_3n-9eFTLx35UCwSOukmPgA_ztCsNINC"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Beach translations (same as App.jsx)
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
}

// Beach to GPS coordinates mapping
const getBeachCoordinates = (beachName) => {
  // North Zone (Haifa, Krayot, Maagan)
  if (beachName.includes('Haifa') || beachName.includes('Krayot') || beachName.includes('Maagan')) {
    return { latitude: 32.8368, longitude: 34.9663, zone: 'צפון' }
  }
  // Sharon Zone (Herzliya, Netanya, Manau)
  if (beachName.includes('Herzliya') || beachName.includes('Netanya') || beachName.includes('Manau')) {
    return { latitude: 32.3294, longitude: 34.8565, zone: 'שרון' }
  }
  // TLV Zone (Default - all others)
  return { latitude: 32.0853, longitude: 34.7818, zone: 'תל אביב' }
}

// Fetch wave forecast from Open-Meteo
const fetchWaveForecast = async (latitude, longitude, date) => {
  try {
    const startDate = date
    const endDate = date // Single day forecast

    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&hourly=wave_height&start_date=${startDate}&end_date=${endDate}&timezone=auto`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.hourly || !data.hourly.wave_height) {
      throw new Error('Invalid API response format')
    }

    // Extract wave heights for daylight hours (roughly 6 AM to 8 PM)
    const waveHeights = data.hourly.wave_height.filter((height, index) => {
      const hour = data.hourly.time[index].slice(11, 13) // Extract hour from ISO string
      const hourNum = parseInt(hour)
      return hourNum >= 6 && hourNum <= 20 // Daylight hours
    }).filter(height => height !== null && !isNaN(height))

    if (waveHeights.length === 0) {
      throw new Error('No valid wave height data available for this date')
    }

    // Return the maximum wave height for the day
    const maxWaveHeight = Math.max(...waveHeights)
    const avgWaveHeight = waveHeights.reduce((sum, height) => sum + height, 0) / waveHeights.length

    return {
      maxWaveHeight: Math.round(maxWaveHeight * 10) / 10, // Round to 1 decimal
      avgWaveHeight: Math.round(avgWaveHeight * 10) / 10,
      sampleCount: waveHeights.length,
      rawData: waveHeights
    }
  } catch (error) {
    console.error('Error fetching wave forecast:', error)
    throw error
  }
}

function Stats({ selectedBeach, onBeachSelect }) {
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [availableBeaches, setAvailableBeaches] = useState([])

  // Prediction state
  const [selectedPredictionDay, setSelectedPredictionDay] = useState('')
  const [waveForecast, setWaveForecast] = useState(null)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [forecastError, setForecastError] = useState(null)

  // Fetch data for the selected beach
  useEffect(() => {
    if (selectedBeach) {
      fetchBeachData()
    }
  }, [selectedBeach])

  // Fetch available beaches on component mount
  useEffect(() => {
    fetchAvailableBeaches()
  }, [])

  // Auto-select first beach if available and none selected
  useEffect(() => {
    if (!selectedBeach && availableBeaches.length > 0) {
      onBeachSelect(availableBeaches[0])
    }
  }, [selectedBeach, availableBeaches, onBeachSelect])

  async function fetchAvailableBeaches() {
    try {
      const { data, error } = await supabase
        .from('measurements')
        .select('beach_name')
        .limit(1000)

      if (error) throw error

      const uniqueBeaches = [...new Set(data.map(item => item.beach_name))]
        .filter(beach => beach && beach !== 'Haifa_Backdoor')
        .sort()

      setAvailableBeaches(uniqueBeaches)

      // Set default beach if not set
      if (!selectedBeach && uniqueBeaches.length > 0) {
        onBeachSelect(uniqueBeaches[0])
      }
    } catch (err) {
      console.error("Error fetching available beaches:", err)
    }
  }

  async function fetchBeachData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('beach_name', selectedBeach)
        .order('id', { ascending: false })
        .limit(1000)

      if (error) throw error

      setMeasurements(data || [])
    } catch (err) {
      console.error("Error fetching beach data:", err)
      setMeasurements([])
    } finally {
      setLoading(false)
    }
  }

  // Process data for correlation chart
  const correlationData = useMemo(() => {
    if (!measurements.length) return []

    // Group by wave height (rounded to nearest 0.5m)
    const grouped = measurements.reduce((acc, row) => {
      // Parse wave_height to float, handle null/0 values
      const waveHeightRaw = parseFloat(row.wave_height)
      if (isNaN(waveHeightRaw) || waveHeightRaw <= 0) return acc

      // Round to nearest 0.5m
      const waveHeight = Math.round(waveHeightRaw * 2) / 2

      // Parse surfer_count to int
      const surferCount = parseInt(row.surfer_count) || 0

      if (!acc[waveHeight]) {
        acc[waveHeight] = { totalSurfers: 0, count: 0 }
      }

      acc[waveHeight].totalSurfers += surferCount
      acc[waveHeight].count += 1

      return acc
    }, {})

    // Convert to array and calculate averages
    return Object.entries(grouped)
      .map(([waveHeight, data]) => ({
        waveHeight: parseFloat(waveHeight),
        avgSurfers: Math.round(data.totalSurfers / data.count),
        sampleCount: data.count
      }))
      .filter(item => item.avgSurfers > 0) // Remove groups with no surfers
      .sort((a, b) => a.waveHeight - b.waveHeight) // Sort by wave height ascending
  }, [measurements])

  // Fetch wave forecast when date is selected
  useEffect(() => {
    if (selectedPredictionDay && selectedBeach) {
      fetchForecastForDate()
    } else {
      setWaveForecast(null)
      setForecastError(null)
    }
  }, [selectedPredictionDay, selectedBeach])

  const fetchForecastForDate = async () => {
    if (!selectedBeach || !selectedPredictionDay) return

    try {
      setForecastLoading(true)
      setForecastError(null)

      const coordinates = getBeachCoordinates(selectedBeach)
      const forecast = await fetchWaveForecast(
        coordinates.latitude,
        coordinates.longitude,
        selectedPredictionDay
      )

      setWaveForecast({ ...forecast, coordinates })
    } catch (error) {
      setForecastError(error.message)
      setWaveForecast(null)
    } finally {
      setForecastLoading(false)
    }
  }

  // Prediction logic using linear interpolation
  const predictSurfers = useMemo(() => {
    if (!correlationData.length || !waveForecast) return null

    const waveHeight = waveForecast.maxWaveHeight
    if (isNaN(waveHeight) || waveHeight <= 0) return null

    // Find exact match
    const exactMatch = correlationData.find(d => d.waveHeight === waveHeight)
    if (exactMatch) {
      return {
        surfers: exactMatch.avgSurfers,
        confidence: 'גבוהה',
        method: 'נתונים מדויקים',
        similarDataPoints: 1
      }
    }

    // Linear interpolation between two closest points
    const sortedData = [...correlationData].sort((a, b) => a.waveHeight - b.waveHeight)

    // Find points above and below
    const lowerPoint = sortedData.filter(d => d.waveHeight <= waveHeight).pop()
    const upperPoint = sortedData.filter(d => d.waveHeight >= waveHeight)[0]

    if (lowerPoint && upperPoint) {
      // Linear interpolation
      const ratio = (waveHeight - lowerPoint.waveHeight) / (upperPoint.waveHeight - lowerPoint.waveHeight)
      const interpolatedSurfers = Math.round(lowerPoint.avgSurfers + ratio * (upperPoint.avgSurfers - lowerPoint.avgSurfers))

      return {
        surfers: interpolatedSurfers,
        confidence: 'בינונית',
        method: 'אינטרפולציה לינארית',
        similarDataPoints: 2,
        range: `${lowerPoint.avgSurfers}-${upperPoint.avgSurfers}`
      }
    }

    // Extrapolation if outside range
    if (lowerPoint) {
      // Extrapolate above
      const slope = sortedData.length > 1 ?
        (sortedData[sortedData.length - 1].avgSurfers - sortedData[0].avgSurfers) /
        (sortedData[sortedData.length - 1].waveHeight - sortedData[0].waveHeight) : 0

      const extrapolated = Math.max(0, Math.round(lowerPoint.avgSurfers + slope * (waveHeight - lowerPoint.waveHeight)))
      return {
        surfers: extrapolated,
        confidence: 'נמוכה',
        method: 'אקסטרפולציה',
        similarDataPoints: 1,
        note: 'מחוץ לטווח הנתונים'
      }
    }

    if (upperPoint) {
      // Extrapolate below
      const slope = sortedData.length > 1 ?
        (sortedData[sortedData.length - 1].avgSurfers - sortedData[0].avgSurfers) /
        (sortedData[sortedData.length - 1].waveHeight - sortedData[0].waveHeight) : 0

      const extrapolated = Math.max(0, Math.round(upperPoint.avgSurfers - slope * (upperPoint.waveHeight - waveHeight)))
      return {
        surfers: extrapolated,
        confidence: 'נמוכה',
        method: 'אקסטרפולציה',
        similarDataPoints: 1,
        note: 'מחוץ לטווח הנתונים'
      }
    }

    return null
  }, [correlationData, waveForecast])

  // Generate next week's dates
  const nextWeekDates = useMemo(() => {
    const dates = []
    const today = new Date()

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
      const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
                         'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

      dates.push({
        value: date.toISOString().split('T')[0],
        label: `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`,
        dayName: dayNames[date.getDay()],
        fullDate: date
      })
    }

    return dates
  }, [])

  // Custom tooltip for the bar chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '12px',
          color: '#fff',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
            גובה גל: {label}m
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            ממוצע גולשים: {data.avgSurfers}
          </p>
          <p style={{ margin: '0', color: '#94a3b8' }}>
            דגימות: {data.sampleCount}
          </p>
        </div>
      )
    }
    return null
  }

  // Calculate bar colors based on intensity
  const getBarColor = (avgSurfers, maxSurfers) => {
    const intensity = avgSurfers / maxSurfers
    // Cyan to blue gradient based on intensity
    const r = Math.round(0 + (intensity * 212))  // 0 to 212 (cyan has 0 red)
    const g = Math.round(212 - (intensity * 100)) // 212 to 112 (cyan to blue)
    const b = Math.round(255 - (intensity * 43))  // 255 to 212 (cyan to blue)
    return `rgb(${r}, ${g}, ${b})`
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#64748b'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
        <h2>טוען נתוני סטטיסטיקה...</h2>
        <p>מנתח קורלציה בין גובה גל לעומס בחוף</p>
      </div>
    )
  }

  if (!selectedBeach) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#64748b'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏄‍♂️</div>
        {availableBeaches.length === 0 ? (
          <>
            <h2>טוען חופים...</h2>
            <p>אנא המתן בזמן שאנחנו טוענים את רשימת החופים</p>
          </>
        ) : (
          <>
            <h2>אנא בחר חוף מהתפריט</h2>
            <p>כדי להציג ניתוח קורלציה</p>
            <div style={{ marginTop: '20px' }}>
              <p style={{ marginBottom: '10px' }}>חופים זמינים:</p>
              <select
                value=""
                onChange={(e) => onBeachSelect(e.target.value)}
                style={{
                  backgroundColor: '#1e293b',
                  color: 'white',
                  border: '1px solid #334155',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="">בחר חוף...</option>
                {availableBeaches.map(beach => (
                  <option key={beach} value={beach}>
                    {BEACH_TRANSLATIONS[beach] || beach}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    )
  }

  const maxSurfers = Math.max(...correlationData.map(d => d.avgSurfers), 1)


  return (
    <div>
      <header style={{marginBottom:'30px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h1 style={{margin:0}}>
            <TrendingUp size={24} style={{marginLeft: '10px'}} />
            ניתוח קורלציה
          </h1>
          <div style={{color:'#00d4ff', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem'}}>
            <BarChart3 size={16} />
            גובה גל לעומס בחוף
          </div>
        </div>
        <div style={{textAlign:'left'}}>
          <div style={{fontSize:'0.9rem', color:'#94a3b8'}}>בחר חוף:</div>
          <select
            value={selectedBeach || ""}
            onChange={(e) => onBeachSelect(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: 'white',
              border: '1px solid #334155',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              minWidth: '200px'
            }}
          >
            {availableBeaches.map(beach => (
              <option key={beach} value={beach}>
                {BEACH_TRANSLATIONS[beach] || beach}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Correlation Chart */}
      <div className="glass-card" style={{height: '500px'}}>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px'}}>
          <BarChart3 size={20} color="#00d4ff" style={{marginLeft: '10px'}} />
          <h3 style={{margin: 0, fontSize: '1.2rem', color: '#f8fafc'}}>
            קורלציה: גובה גל לעומס גולשים
          </h3>
        </div>

        <div style={{marginBottom: '15px', fontSize: '0.9rem', color: '#94a3b8'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
            <Users size={16} />
            <span>חוף: {BEACH_TRANSLATIONS[selectedBeach] || selectedBeach}</span>
          </div>
          <div>נתונים מ-{measurements.length} מדידות אחרונות</div>
        </div>

        {correlationData.length > 0 ? (
          <ResponsiveContainer width="100%" height="75%">
            <BarChart
              data={correlationData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barCategoryGap="10%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="waveHeight"
                stroke="#64748b"
                tick={{fill: '#94a3b8', fontSize: 12}}
                label={{
                  value: 'גובה גל (מ)',
                  position: 'insideBottom',
                  offset: -10,
                  style: { textAnchor: 'middle', fill: '#94a3b8' }
                }}
              />
              <YAxis
                stroke="#64748b"
                tick={{fill: '#94a3b8', fontSize: 12}}
                label={{
                  value: 'ממוצע גולשים',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#94a3b8' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="avgSurfers"
                radius={[4, 4, 0, 0]}
                name="ממוצע גולשים"
              >
                {correlationData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.avgSurfers, maxSurfers)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📈</div>
            <h3>אין נתונים זמינים</h3>
            <p>לא נמצאו מדידות תקינות עבור חוף זה</p>
            <small>ודא שיש נתוני wave_height ו-surfer_count תקינים בבסיס הנתונים</small>
          </div>
        )}
      </div>

      {/* Insights */}
      {correlationData.length > 0 && (
        <div className="glass-card" style={{marginTop: '20px', padding: '20px'}}>
          <h3 style={{margin: '0 0 15px 0', fontSize: '1.1rem', color: '#00d4ff'}}>
            📊 תובנות מהנתונים
          </h3>
          <div style={{display: 'grid', gap: '10px', fontSize: '0.9rem', color: '#94a3b8'}}>
            {correlationData.length > 0 && (
              <div>
                <strong style={{color: '#f8fafc'}}>גובה הגל הפופולרי:</strong>{' '}
                <span style={{color: '#00d4ff'}}>
                  {correlationData.reduce((max, curr) =>
                    curr.avgSurfers > max.avgSurfers ? curr : max
                  ).waveHeight}m
                </span>
                {' '}עם ממוצע של{' '}
                <span style={{color: '#00d4ff'}}>
                  {correlationData.reduce((max, curr) =>
                    curr.avgSurfers > max.avgSurfers ? curr : max
                  ).avgSurfers}
                </span>
                {' '}גולשים.
              </div>
            )}
            {correlationData.length > 1 && (
              <div>
                <strong style={{color: '#f8fafc'}}>טווח גלים:</strong>{' '}
                מ-{correlationData[0].waveHeight}m עד {correlationData[correlationData.length - 1].waveHeight}m
              </div>
            )}
            <div style={{fontStyle: 'italic', marginTop: '10px'}}>
              💡 ככל שהגל גבוה יותר, ככה יש יותר גולשים בחוף? בדוק את הגרף כדי לראות את הקורלציה.
            </div>
          </div>
        </div>
      )}

      {/* Prediction Feature */}
      {correlationData.length > 0 && (
        <div className="glass-card" style={{marginTop: '20px', padding: '20px'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px'}}>
            <Sparkles size={20} color="#00d4ff" style={{marginLeft: '10px'}} />
            <h3 style={{margin: 0, fontSize: '1.2rem', color: '#f8fafc'}}>
              🔮 חיזוי עומס גולשים
            </h3>
          </div>

          <p style={{fontSize: '0.9rem', color: '#94a3b8', marginBottom: '20px'}}>
            בחר יום וקבל תחזית אוטומטית של גובה הגל וצפיפות הגולשים
          </p>

          {/* Prediction Inputs */}
          <div style={{marginBottom: '20px'}}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: '#94a3b8',
              marginBottom: '10px',
              fontWeight: '500'
            }}>
              <Calendar size={14} style={{marginLeft: '5px'}} />
              בחר יום לתחזית
            </label>
            <select
              value={selectedPredictionDay}
              onChange={(e) => setSelectedPredictionDay(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#1e293b',
                color: 'white',
                border: '1px solid #334155',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">בחר יום...</option>
              {nextWeekDates.map(date => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
          </div>

          {/* Wave Forecast Display */}
          {selectedPredictionDay && (
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                <Waves size={16} color="#00d4ff" style={{marginLeft: '8px'}} />
                <span style={{fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500'}}>
                  תחזית גלים ליום {nextWeekDates.find(d => d.value === selectedPredictionDay)?.label}
                </span>
              </div>

              {forecastLoading && (
                <div style={{color: '#94a3b8', fontSize: '0.9rem'}}>
                  טוען תחזית גלים...
                </div>
              )}

              {forecastError && (
                <div style={{color: '#ef4444', fontSize: '0.9rem'}}>
                  שגיאה בטעינת תחזית: {forecastError}
                </div>
              )}

              {waveForecast && !forecastLoading && (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px'}}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#00d4ff',
                      marginBottom: '2px'
                    }}>
                      {waveForecast.maxWaveHeight}m
                    </div>
                    <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>
                      גל מקסימלי
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#00d4ff',
                      marginBottom: '2px'
                    }}>
                      {waveForecast.avgWaveHeight}m
                    </div>
                    <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>
                      גל ממוצע
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#00d4ff',
                      marginBottom: '2px'
                    }}>
                      {waveForecast.coordinates.zone}
                    </div>
                    <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>
                      אזור
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prediction Result */}
          {predictSurfers && selectedPredictionDay && waveForecast && !forecastLoading && (
            <div style={{
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '15px'
            }}>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px'}}>
                <div style={{
                  fontSize: '36px',
                  marginLeft: '15px',
                  color: '#00d4ff'
                }}>
                  🏄‍♂️
                </div>
                <div>
                  <h4 style={{
                    margin: '0 0 5px 0',
                    fontSize: '1.1rem',
                    color: '#00d4ff'
                  }}>
                    תחזית ליום {nextWeekDates.find(d => d.value === selectedPredictionDay)?.label}
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: '#94a3b8'
                  }}>
                    חוף: {BEACH_TRANSLATIONS[selectedBeach] || selectedBeach}
                  </p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div style={{textAlign: 'center'}}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#00d4ff',
                    marginBottom: '5px'
                  }}>
                    {predictSurfers.surfers}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#94a3b8'
                  }}>
                    גולשים צפויים
                  </div>
                </div>

                <div style={{textAlign: 'center'}}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#f8fafc',
                    marginBottom: '5px'
                  }}>
                    {waveForecast.maxWaveHeight}m
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#94a3b8'
                  }}>
                    גל מקסימלי
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#94a3b8'
              }}>
                <div style={{marginBottom: '5px'}}>
                  <strong style={{color: '#f8fafc'}}>שיטת חיזוי:</strong> {predictSurfers.method}
                </div>
                <div style={{marginBottom: '5px'}}>
                  <strong style={{color: '#f8fafc'}}>רמת וודאות:</strong>{' '}
                  <span style={{
                    color: predictSurfers.confidence === 'גבוהה' ? '#10b981' :
                           predictSurfers.confidence === 'בינונית' ? '#f59e0b' : '#ef4444'
                  }}>
                    {predictSurfers.confidence}
                  </span>
                </div>
                {predictSurfers.range && (
                  <div style={{marginBottom: '5px'}}>
                    <strong style={{color: '#f8fafc'}}>טווח נתונים:</strong> {predictSurfers.range} גולשים
                  </div>
                )}
                {predictSurfers.note && (
                  <div style={{
                    color: '#f59e0b',
                    fontStyle: 'italic',
                    marginTop: '8px'
                  }}>
                    ⚠️ {predictSurfers.note} - החיזוי פחות מדויק
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No prediction state */}
          {(!predictSurfers || !selectedPredictionDay || forecastLoading) && (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              color: '#64748b'
            }}>
              <div style={{fontSize: '48px', marginBottom: '15px'}}>🔮</div>
              <p>בחר יום וגובה גל כדי לקבל תחזית מדויקת</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Stats