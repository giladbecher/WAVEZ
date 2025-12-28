import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wind, Waves, Users, Clock, MapPin, Home, TrendingUp } from 'lucide-react';
import Map from './Map'
import Stats from './Stats'
import './index.css'

// --- הגדרות SUPABASE ---
const SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co"
const SUPABASE_KEY = "sb_publishable_3n-9eFTLx35UCwSOukmPgA_ztCsNINC"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBeach, setSelectedBeach] = useState(null)
  const [activeTab, setActiveTab] = useState('home') // ניהול טאבים
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // ניהול תפריט מובייל

  // תאריך נוכחי בפורמט יפה
  const currentDate = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const { data: measurements, error } = await supabase
        .from('measurements')
        .select('*')
        .order('id', { ascending: false })
        .limit(3000)

      if (error) throw error

      const cleanData = measurements.filter(row => row.beach_name && row.beach_name !== 'Haifa_Backdoor');
      setData(cleanData)

      if (!selectedBeach && cleanData.length > 0) {
        setSelectedBeach(cleanData[0].beach_name)
      }

    } catch (err) {
      console.error("Error loading data:", err)
    } finally {
      setLoading(false)
    }
  }

  const availableBeaches = useMemo(() => {
    const uniqueNames = [...new Set(data.map(item => item.beach_name))];
    return uniqueNames.sort();
  }, [data]);

  const beachData = useMemo(() => {
    if (!selectedBeach) return [];
    return data
      .filter(row => row.beach_name === selectedBeach)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }, [data, selectedBeach])

  const currentStatus = beachData.length > 0 ? beachData[beachData.length - 1] : null

  const chartData = useMemo(() => {
    if (!beachData.length) return []
    const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000)
    return beachData
      .filter(row => new Date(row.timestamp).getTime() > oneDayAgo)
      .map(row => ({
        time: new Date(row.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        count: row.surfer_count
      }))
  }, [beachData])

  if (loading) return <div className="app-container" style={{justifyContent:'center', alignItems:'center'}}><h2>טוען נתונים... 🌊</h2></div>

  try {
    return (
      <div className="app-container">
      {/* כפתור תפריט מובייל */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 2000,
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          border: 'none',
          borderRadius: '8px',
          padding: '12px',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'none', // Hidden by default, shown on mobile via CSS
          backdropFilter: 'blur(10px)'
        }}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'none' // Hidden by default, shown on mobile via CSS
          }}
        />
      )}

      {/* סרגל צד */}
      <nav className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{marginBottom: '30px'}}>
            <h2 style={{color:'#00d4ff', margin:0}}>WAVEZ <span style={{fontSize:'0.8em', color:'#666'}}>PRO</span></h2>
            <p style={{fontSize:'0.8rem', color:'#64748b', marginTop:'5px'}}>{currentDate}</p>
        </div>
        
        <div className="menu-group">
          <label>בחר חוף:</label>
          <select 
            className="beach-select" // הוספתי קלאס לעיצוב כהה
            value={selectedBeach || ""}
            onChange={(e) => setSelectedBeach(e.target.value)}
            style={{
                backgroundColor: '#1e293b', 
                color: 'white', 
                border: '1px solid #334155',
                padding: '10px',
                borderRadius: '8px',
                width: '100%',
                marginTop: '5px',
                outline: 'none'
            }}
          >
            {availableBeaches.map(beach => (
              <option key={beach} value={beach}>
                {BEACH_TRANSLATIONS[beach] || beach}
              </option>
            ))}
          </select>
        </div>
        
        <div className="nav-buttons" style={{marginTop: '20px', display:'flex', flexDirection:'column', gap:'10px'}}>
            <button
                className={`menu-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('home')
                  setIsMobileMenuOpen(false) // Close mobile menu
                }}
                style={{display:'flex', alignItems:'center', gap:'10px', justifyContent:'flex-start'}}
            >
                <Home size={18} /> ראשי
            </button>
            <button
                className={`menu-item ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('map')
                  setIsMobileMenuOpen(false) // Close mobile menu
                }}
                style={{display:'flex', alignItems:'center', gap:'10px', justifyContent:'flex-start'}}
            >
                <MapPin size={18} /> מפה
            </button>
            <button
                className={`menu-item ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('stats')
                  setIsMobileMenuOpen(false) // Close mobile menu
                }}
                style={{display:'flex', alignItems:'center', gap:'10px', justifyContent:'flex-start'}}
            >
                <TrendingUp size={18} /> סטטיסטיקה
            </button>
        </div>

        <div style={{marginTop:'auto', fontSize:'0.8rem', color:'#666'}}>
          מחובר ל-Supabase 🟢
        </div>
      </nav>

      {/* תוכן ראשי */}
      <main className="main-content">
        {activeTab === 'home' ? (
          currentStatus ? (
            <>
              <header style={{marginBottom:'30px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <h1 style={{margin:0}}>{BEACH_TRANSLATIONS[selectedBeach] || selectedBeach}</h1>
                  <div style={{color:'#00d4ff', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem'}}>
                    <span className="status-dot" style={{height:'8px', width:'8px', background:'#00d4ff', borderRadius:'50%', display:'inline-block'}}></span>
                    שידור חי
                  </div>
                </div>
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:'0.9rem', color:'#94a3b8'}}>עדכון אחרון</div>
                  <div style={{fontSize:'1.2rem', fontWeight:'bold', fontFamily:'monospace'}}>
                    {new Date(currentStatus.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </header>

              {/* כרטיסי מידע (Grid) */}
              <div className="stats-grid">
                <div className="glass-card">
                  <div className="card-header"><Users size={20} color="#00d4ff"/> גולשים</div>
                  <div className="stat-value">{currentStatus.surfer_count}</div>
                </div>
                <div className="glass-card">
                  <div className="card-header"><Waves size={20} color="#00d4ff"/> גובה גל</div>
                  <div className="stat-value">{currentStatus.wave_height}m</div>
                </div>
                <div className="glass-card">
                  <div className="card-header"><Wind size={20} color="#00d4ff"/> רוח</div>
                  <div className="stat-value">{currentStatus.wind_speed}</div>
                  <div className="stat-unit">קמ"ש</div>
                </div>
              </div>

              {/* גרף */}
              <div className="glass-card mobile-chart" style={{height: '400px', marginTop:'20px'}}>
                <h3 style={{marginBottom:'20px', fontSize:'1.1rem', color:'#94a3b8'}}>מגמת עומס (24 שעות)</h3>
                <ResponsiveContainer width="100%" height="75%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} interval="preserveStartEnd" />
                    <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip
                      contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color:'#fff'}}
                    />
                    <Area type="monotone" dataKey="count" stroke="#00d4ff" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div style={{textAlign:'center', marginTop:'100px', color:'#64748b'}}>
              <h2>טוען נתוני חוף... 🌊</h2>
              <p>אנא בחר חוף מהתפריט</p>
            </div>
          )
        ) : activeTab === 'map' ? (
          <div style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
            <header style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <h1 style={{margin:0}}>מפת חופי הגלישה</h1>
                <div style={{color:'#00d4ff', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem'}}>
                  <MapPin size={16} />
                  לחץ על נקודה כדי לראות פרטים
                </div>
              </div>
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:'0.9rem', color:'#94a3b8'}}>חופים פעילים</div>
                <div style={{fontSize:'1.2rem', fontWeight:'bold', fontFamily:'monospace'}}>
                  {Object.keys(data.reduce((acc, item) => {
                    acc[item.beach_name] = true
                    return acc
                  }, {})).length}
                </div>
              </div>
            </header>
            <Map
              data={data}
              selectedBeach={selectedBeach}
              onBeachSelect={setSelectedBeach}
            />
          </div>
        ) : activeTab === 'stats' ? (
          <Stats
            selectedBeach={selectedBeach}
            onBeachSelect={setSelectedBeach}
          />
        ) : (
          <div style={{textAlign:'center', marginTop:'100px', color:'#64748b'}}>
            <h2>העמוד בבנייה 🚧</h2>
            <p>בקרוב נוסיף כאן מפה וסטטיסטיקה מתקדמת.</p>
          </div>
        )}

      </main>
    </div>
  )
  } catch (error) {
    console.error('WaveZ App: Render error:', error)
    return (
      <div className="app-container" style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #00d4ff, #0f172a)',
        color: 'white'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2>שגיאה בטעינת האפליקציה</h2>
        <p>אנא רענן את העמוד או נסה שוב מאוחר יותר</p>
        <small style={{ color: '#64748b', marginTop: '10px' }}>
          Error: {error.message}
        </small>
      </div>
    )
  }
}

export default App