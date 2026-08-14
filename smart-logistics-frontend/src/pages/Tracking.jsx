import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";
import { useTracking } from "../context/TrackingContext";
import { MapPin, Navigation, CheckCircle, AlertTriangle, Play, Loader2 } from "lucide-react";

export default function Tracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    tripId: contextTripId,
    status,
    connected,
    trackingActive,
    currentLocation,
    startTracking,
    confirmDelivery
  } = useTracking();
  
  const [inputTripId, setInputTripId] = useState(location.state?.tripId || contextTripId || "");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Auto-start tracking if we navigated here with a tripId
  useEffect(() => {
    if (location.state?.tripId && location.state?.tripId !== contextTripId) {
      startTracking(location.state.tripId);
    }
  }, [location.state?.tripId, contextTripId, startTracking]);

  useEffect(() => {
    mapRef.current = L.map("map", { zoomControl: false }).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    }).addTo(mapRef.current);
    
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (currentLocation?.lat && mapRef.current) {
      if (!markerRef.current) {
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #2563EB; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        markerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: customIcon }).addTo(mapRef.current);
      } else {
        markerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
      }
      mapRef.current.flyTo([currentLocation.lat, currentLocation.lng], 14, { animate: true, duration: 1 });
    }
  }, [currentLocation]);

  const handleConnectAndJoin = () => {
    if (!inputTripId) return;
    startTracking(inputTripId);
  };

  const executeDeliveryConfirmation = () => {
    setShowConfirmModal(false);
    confirmDelivery();
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
            value={inputTripId}
            onChange={(e) => setInputTripId(e.target.value)}
            disabled={connected}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-slate-50 disabled:opacity-60"
          />
        </div>

        <div className="space-y-3 flex-1">
          {!connected ? (
            <button
              onClick={handleConnectAndJoin}
              disabled={!inputTripId}
              className="w-full bg-primary hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Connect to Tracking
            </button>
          ) : (
            <>
              {user?.role === "driver" && trackingActive && (
                <div className="w-full bg-accent/10 text-accent px-4 py-3 rounded-xl font-bold flex justify-center items-center">
                  <Play size={18} className="mr-2 fill-current" /> Tracking Active
                </div>
              )}

              {user?.role === "business" && trackingActive && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full bg-success hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold transition-colors flex justify-center items-center mt-auto shadow-[0_0_15px_rgba(22,163,74,0.3)] cursor-pointer"
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

      {/* Confirmation Modal for Delivery */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} />
            </div>
            
            <h3 className="text-xl font-bold text-primary mb-2">Confirm Order Delivery?</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Has this shipment been successfully delivered by the driver? Confirming delivery will finalize the order status and complete the trip.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={executeDeliveryConfirmation}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center cursor-pointer"
              >
                <CheckCircle size={18} className="mr-1.5" />
                Yes, Delivered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}