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

// Build a colored SVG drop-pin icon from a hex color string
const makeColoredIcon = (color) => {
  const hex = color || '#3b82f6'; // default blue if no color given
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 26 14 26S28 23.625 28 14C28 6.27 21.73 0 14 0z"
            fill="${hex}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="5.5" fill="white" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    iconSize:   [28, 40],
    iconAnchor: [14, 40],
    popupAnchor:[0, -40],
    className: '',   // removes Leaflet's default white box background
  });
};

export const Marker = (props) => {
  const position = [props.coordinate.latitude, props.coordinate.longitude];
  const icon = makeColoredIcon(props.pinColor);

  return (
    <LeafletMarker
        position={position}
        icon={icon}
        eventHandlers={{
            click: (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                if (props.onPress) {
                    props.onPress();
                }
            },
        }}
    />
  );
};

export const Callout = () => null;
export default MapView;