import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { connectSocket, disconnectSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

export default function Tracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipmentId, setShipmentId] = useState("");
  const [status, setStatus] = useState("Not connected");
  const [connected, setConnected] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    mapRef.current = L.map("map").setView([18.52, 73.85], 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      disconnectSocket();
    };
  }, []);

  const handleConnect = () => {
    const token = localStorage.getItem("token");
    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setStatus("Connected");
    });

    socket.on("connect_error", (err) => setStatus("Error: " + err.message));

    socket.on("trip:started", () => setStatus("Trip started - sharing location"));

    socket.on("room:joined", (data) => {
      setStatus("Tracking active");
      if (data.lastLocation?.lat) {
        updateMarker(data.lastLocation.lat, data.lastLocation.lng);
      }
    });

    socket.on("location:update", (data) => {
      updateMarker(data.lat, data.lng);
      setStatus(`Updated: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
    });

    socket.on("trip:ended", () => {
      setStatus("Delivered - tracking ended");
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    });

    socket.on("error:tracking", (e) => setStatus("Error: " + e.message));
  };

  const updateMarker = (lat, lng) => {
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapRef.current.panTo([lat, lng]);
  };

  const handleStartTrip = () => {
    if (!shipmentId) return;
    socketRef.current.emit("driver:start_trip", { shipmentId });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        socketRef.current.emit("driver:location_update", {
          shipmentId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => setStatus("GPS error: " + err.message),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

  const handleJoinRoom = () => {
    if (!shipmentId) return;
    socketRef.current.emit("business:join_shipment_room", { shipmentId });
  };

  const handleConfirmDelivery = () => {
    if (!shipmentId) return;
    socketRef.current.emit("business:confirm_delivery", { shipmentId });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-primary">Live Tracking</h2>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-gray-500">
            Back
          </button>
        </div>

        <input
          type="text"
          placeholder="Shipment ID"
          value={shipmentId}
          onChange={(e) => setShipmentId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <div className="flex gap-2 flex-wrap">
          {!connected && (
            <button
              onClick={handleConnect}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Connect
            </button>
          )}

          {connected && user?.role === "driver" && (
            <button
              onClick={handleStartTrip}
              className="bg-orange-100 text-primary px-4 py-2 rounded-lg text-sm font-medium border border-primary"
            >
              Start Trip
            </button>
          )}

          {connected && user?.role === "business" && (
            <>
              <button
                onClick={handleJoinRoom}
                className="bg-orange-100 text-primary px-4 py-2 rounded-lg text-sm font-medium border border-primary"
              >
                Join Tracking Room
              </button>
              <button
                onClick={handleConfirmDelivery}
                className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium border border-green-600"
              >
                Confirm Delivery
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-2">{status}</p>
      </div>

      <div id="map" className="flex-1"></div>
    </div>
  );
}