import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// போட் கஸ்டம் ஐகான் செட்டப்
const boatIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/933/933454.png",
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

export default function LiveVesselMap() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [vesselPosition, setVesselPosition] = useState([22.5726, 88.3639]); // Haldia Port start
  const [routeHistory, setRouteHistory] = useState([
    [21.0, 87.0],
    [21.8, 87.8],
    [22.5726, 88.3639]
  ]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // லைவ் மூவ்மென்ட் மற்றும் டைமிங் அப்டேட்
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      setVesselPosition((prev) => {
        const newLat = prev[0] + (Math.random() - 0.5) * 0.2;
        const newLng = prev[1] + (Math.random() - 0.5) * 0.2;
        const updatedPos = [newLat, newLng];
        setRouteHistory((history) => [...history, updatedPos]);
        return updatedPos;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-sky-100 relative">
      {/* ஹெட்டர் மற்றும் பட்டன் */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold font-mono text-sky-900">Live Vessel Tracker</h3>
        <button 
          onClick={() => setIsFullScreen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
        >
          🌍 Live Vessel Map (Full World)
        </button>
      </div>

      {/* டேஷ்போர்டில் உள்ள சிறிய மேப் */}
      <div className="h-80 w-full rounded-xl overflow-hidden">
        <MapContainer center={vesselPosition} zoom={5} style={{ height: "100%", width: "100%", borderRadius: "12px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={routeHistory} color="#0284c7" weight={3} dashArray="4, 4" />
          <Marker position={vesselPosition} icon={boatIcon}>
            <Popup>
              <div className="text-xs font-semibold">
                🚢 Haldia Port - Vessel Waiting<br/>
                <span className="text-slate-500 font-normal">Live Time: {currentTime}</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* 'Live Vessel Map' பட்டனை அழுத்தினால் திறக்கும் முழு உலக வரைபடம் (Full World Map Modal) */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col p-4 md:p-6 backdrop-blur-sm">
          <div className="bg-white p-4 rounded-t-2xl flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-800">🌍 Global AIS Live Vessel Map - World View</h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full animate-pulse">
                LIVE | {currentTime}
              </span>
            </div>
            <button 
              onClick={() => setIsFullScreen(false)}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              ✕ Close Map
            </button>
          </div>

          <div className="flex-1 w-full bg-white rounded-b-2xl overflow-hidden shadow-2xl">
            <MapContainer center={vesselPosition} zoom={5} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline positions={routeHistory} color="#2563eb" weight={5} />
              <Marker position={vesselPosition} icon={boatIcon}>
                <Popup>
                  <div className="text-sm font-semibold text-sky-900">
                    🚢 Navi-Steel Active Carrier<br />
                    <span className="text-xs text-slate-600 font-normal">Current Ping: {currentTime}</span>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}