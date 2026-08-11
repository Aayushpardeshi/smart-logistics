import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { connectSocket, disconnectSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { MapPin, Navigation, CheckCircle, AlertTriangle, Play, Loader2 } from "lucide-react";

export default function Tracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract tripId from URL if passed via state, or let user input it
  const [tripId, setTripId] = useState(location.state?.tripId || "");
  const [status, setStatus] = useState("Not connected");
  const [connected, setConnected] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    mapRef.current = L.map("map", { zoomControl: false }).setView([20.5937, 78.9629], 5); // India center
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    }).addTo(mapRef.current);
    
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      disconnectSocket();
    };
  }, []);

  const handleConnectAndJoin = () => {
    if (!tripId) {
      setStatus("Please enter a valid Trip ID");
      return;
    }

    setStatus("Connecting...");
    const token = localStorage.getItem("token");
    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (user.role === 'business') {
        socket.emit("business:join_trip_room", { tripId });
      }
    });

    socket.on("connect_error", (err) => setStatus("Connection Error: " + err.message));
    
    socket.on("error:tracking", (e) => setStatus("Error: " + e.message));

    // Driver specific
    socket.on("trip:started", () => {
      setStatus("Trip started - Sharing location live");
      setTrackingActive(true);
    });

    // Business specific
    socket.on("room:joined", (data) => {
      setStatus("Tracking active - Waiting for location updates");
      setTrackingActive(true);
      if (data.currentLocation?.lat) {
        updateMarker(data.currentLocation.lat, data.currentLocation.lng);
      }
    });

    // Shared
    socket.on("location:update", (data) => {
      updateMarker(data.lat, data.lng);
      setStatus(`Live Location: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
    });

    socket.on("trip:ended", (data) => {
      setStatus("Delivered - Tracking ended");
      setTrackingActive(false);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    });
  };

  const updateMarker = (lat, lng) => {
    if (!markerRef.current) {
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #2563EB; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapRef.current.flyTo([lat, lng], 14, { animate: true, duration: 1 });
  };

  const handleStartTrip = () => {
    if (!tripId || !connected) return;
    socketRef.current.emit("driver:start_trip", { tripId });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        socketRef.current.emit("driver:location_update", {
          tripId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => setStatus("GPS Error: Please enable location permissions"),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

  const handleConfirmDelivery = () => {
    if (!tripId || !connected) return;
    if (window.confirm("Are you sure you want to mark this trip as delivered? This will end tracking.")) {
      socketRef.current.emit("business:confirm_delivery", { tripId });
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] flex flex-col md:flex-row max-w-7xl mx-auto overflow-hidden rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-500 bg-card m-4">
      
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-white p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col z-10 shadow-lg">
        <h2 className="text-2xl font-bold text-primary mb-2 flex items-center">
          <Navigation size={24} className="mr-2 text-secondary" /> Live GPS
        </h2>
        <p className="text-sm text-slate-500 mb-6">Real-time trip tracking.</p>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Trip ID</label>
          <input
            type="text"
            placeholder="Enter Trip ID..."
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            disabled={connected}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-slate-50 disabled:opacity-60"
          />
        </div>

        <div className="space-y-3 flex-1">
          {!connected ? (
            <button
              onClick={handleConnectAndJoin}
              disabled={!tripId}
              className="w-full bg-primary hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              Connect to Tracking
            </button>
          ) : (
            <>
              {user?.role === "driver" && !trackingActive && (
                <button
                  onClick={handleStartTrip}
                  className="w-full bg-accent hover:bg-cyan-600 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] flex justify-center items-center"
                >
                  <Play size={18} className="mr-2 fill-current" /> Start Trip & Share Location
                </button>
              )}

              {user?.role === "business" && trackingActive && (
                <button
                  onClick={handleConfirmDelivery}
                  className="w-full bg-success hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold transition-colors flex justify-center items-center mt-auto shadow-[0_0_15px_rgba(22,163,74,0.3)]"
                >
                  <CheckCircle size={18} className="mr-2" /> Confirm Delivery
                </button>
              )}
            </>
          )}
        </div>

        <div className={`mt-6 p-4 rounded-xl border ${status.includes('Error') ? 'bg-red-50 border-red-200 text-danger' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
          <div className="flex items-start">
            {status.includes('Error') ? <AlertTriangle size={16} className="mt-0.5 mr-2 flex-shrink-0" /> : <MapPin size={16} className="mt-0.5 mr-2 flex-shrink-0 text-secondary" />}
            <span className="text-sm font-medium leading-tight">{status}</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div id="map" className="flex-1 min-h-[400px] z-0 relative">
        {!connected && (
           <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[400] flex items-center justify-center pointer-events-none">
              <div className="bg-white px-6 py-4 rounded-2xl shadow-xl font-bold text-slate-600 flex items-center">
                <MapPin size={24} className="text-slate-300 mr-2" />
                Connect to a trip to view live map
              </div>
           </div>
        )}
      </div>
    </div>
  );
}