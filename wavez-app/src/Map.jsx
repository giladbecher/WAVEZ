import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Waves } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Beach coordinates (precise locations for surf spots)
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
}

// Beach names mapping
const BEACH_NAMES = {
  "Haifa_BatGalim": "חיפה - בת גלים",
  "Haifa_Backdoor": "חיפה - בקדור",
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

const Map = ({ data, selectedBeach, onBeachSelect }) => {
  // Fallback: Simple static map display if react-leaflet fails
  const [mapError, setMapError] = useState(false)

  // Calculate current status for each beach
  const beachStatuses = {}

  // Group data by beach and get latest status
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

  // Fallback component if MapContainer fails
  const FallbackMap = () => (
    <div style={{
      height: '100%',
      width: '100%',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#64748b',
      padding: '20px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
      <h3>מפה זמנית לא זמינה</h3>
      <p style={{ textAlign: 'center', marginBottom: '20px' }}>
        המפה המלאה לא נטענה, אבל הנתונים זמינים:
      </p>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {Object.entries(BEACH_NAMES).map(([key, name]) => {
          const status = beachStatuses[key]
          const isSelected = selectedBeach === key
          return (
            <div
              key={key}
              onClick={() => onBeachSelect(key)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: isSelected ? '#00d4ff' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: isSelected ? '#1e293b' : '#f8fafc',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{name}</div>
              {status && (
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  גולשים: {status.surfer_count} | גל: {status.wave_height}m
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  // Try to render the full map, fallback on error
  if (mapError) {
    return <FallbackMap />
  }

  // Custom marker icon based on wave conditions and crowd factor
  const createMarkerIcon = (status) => {
    let color = '#64748b' // default gray

    if (status && status.wave_height && status.surfer_count !== undefined) {
      const waveHeight = parseFloat(status.wave_height)
      const surferCount = parseInt(status.surfer_count)

      // Grading system: Wave quality + Crowd factor
      if (waveHeight >= 2.0) {
        // Good waves
        if (surferCount <= 10) {
          color = '#22c55e' // Green: Excellent - Good waves, low crowd
        } else if (surferCount <= 25) {
          color = '#00d4ff' // Blue: Good - Good waves, medium crowd
        } else {
          color = '#fbbf24' // Yellow: Fair - Good waves, crowded
        }
      } else if (waveHeight >= 1.0) {
        // Medium waves
        if (surferCount <= 15) {
          color = '#fbbf24' // Yellow: Fair - Medium waves, manageable crowd
        } else {
          color = '#f97316' // Orange: Poor - Medium waves, crowded
        }
      } else {
        // Small waves
        color = '#ef4444' // Red: Bad - Small waves regardless of crowd
      }
    }

    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>`,
      className: 'custom-marker',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    })
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[32.5, 34.9]} // Center on Israel coast
        zoom={10}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {Object.entries(BEACH_COORDINATES).map(([beachKey, coords]) => {
          const status = beachStatuses[beachKey]
          const isSelected = selectedBeach === beachKey

          return (
            <Marker
              key={beachKey}
              position={coords}
              icon={createMarkerIcon(status)}
              eventHandlers={{
                click: () => onBeachSelect(beachKey)
              }}
            >
              <Popup>
                <div style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  color: '#1e293b'
                }}>
                  <div style={{
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <Waves size={16} color="#00d4ff" />
                    {BEACH_NAMES[beachKey]}
                  </div>

                  {status ? (
                    <div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>גולשים:</strong> {status.surfer_count}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>גובה גל:</strong> {status.wave_height}m
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>רוח:</strong> {status.wind_speed} קמ"ש
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        עדכון: {new Date(status.timestamp).toLocaleTimeString('he-IL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                      אין נתונים זמינים
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        zIndex: 999,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '180px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>דירוג חופים</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
          <span>מצוין (גלים טובים + מעט גולשים)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#00d4ff', borderRadius: '50%' }}></div>
          <span>טוב (גלים טובים)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#fbbf24', borderRadius: '50%' }}></div>
          <span>בינוני (גלים בינוניים או צפוף)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
          <span>גרוע (גלים קטנים)</span>
        </div>
      </div>
    </div>
  )
}

export default Map
