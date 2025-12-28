import React from 'react';
import { MapContainer, TileLayer, Marker as LeafletMarker } from 'react-leaflet';
import L from 'leaflet';

// --- הגדרת אייקונים (כדי למנוע סימני שאלה) ---
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
// ---------------------------------------------

const MapView = (props) => {
  const { latitude, longitude } = props.initialRegion;

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}>
       <MapContainer
          center={[latitude, longitude]}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          whenReady={(mapInstance) => {
             setTimeout(() => {
                mapInstance.target.invalidateSize();
             }, 100);
             
             // לחיצה על המפה עצמה (רקע) - סוגרת את הכרטיס
             mapInstance.target.on('click', (e) => {
               if (props.onPress) props.onPress(e);
             });
          }}
       >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {props.children}
      </MapContainer>
    </div>
  );
};

export const Marker = (props) => {
  const position = [props.coordinate.latitude, props.coordinate.longitude];
  
  return (
    <LeafletMarker
        position={position}
        eventHandlers={{
            click: (e) => {
                // --- התיקון הגדול ---
                // 1. עוצרים את האירוע מלהגיע למפה (Leaflet way)
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                
                // 2. קוראים לפונקציה של ריאקט
                if (props.onPress) {
                    props.onPress(); // לא שולחים את ה-e כדי למנוע בלבול בקובץ הראשי
                }
            },
        }}
    />
  );
};

export const Callout = () => null;
export default MapView;