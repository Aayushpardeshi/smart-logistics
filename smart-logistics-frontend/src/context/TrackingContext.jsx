import { createContext, useContext, useState, useEffect, useRef } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const TrackingContext = createContext(null);

export function TrackingProvider({ children }) {
  const { user } = useAuth();
  const [tripId, setTripId] = useState(null);
  const [status, setStatus] = useState("Not connected");
  const [connected, setConnected] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  const startTracking = (newTripId) => {
    if (socketRef.current) {
      if (tripId === newTripId) return; // already tracking this trip
      stopTracking();
    }
    
    setTripId(newTripId);
    setStatus("Connecting...");
    const token = localStorage.getItem("token");
    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (user?.role === "business") {
        socket.emit("business:join_trip_room", { tripId: newTripId });
      } else if (user?.role === "driver") {
        socket.emit("driver:start_trip", { tripId: newTripId });
        startGeolocation(newTripId);
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
        setCurrentLocation({ lat: data.currentLocation.lat, lng: data.currentLocation.lng });
      }
    });

    // Shared
    socket.on("location:update", (data) => {
      setCurrentLocation({ lat: data.lat, lng: data.lng });
      setStatus(`Live Location: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
    });

    socket.on("trip:ended", () => {
      setStatus("Delivered - Tracking ended");
      stopTracking();
    });
  };

  const startGeolocation = (currentTripId) => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (socketRef.current) {
            socketRef.current.emit("driver:location_update", {
            tripId: currentTripId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            accuracy: pos.coords.accuracy,
            });
        }
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => setStatus("GPS Error: Please enable location permissions"),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

  const confirmDelivery = () => {
    if (socketRef.current && tripId) {
      socketRef.current.emit("business:confirm_delivery", { tripId });
    }
  };

  const stopTracking = () => {
    setTrackingActive(false);
    setConnected(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    disconnectSocket();
    socketRef.current = null;
    setTripId(null);
  };

  // Cleanup on user logout
  useEffect(() => {
    if (!user) {
      stopTracking();
    }
  }, [user]);

  return (
    <TrackingContext.Provider value={{
      tripId, status, connected, trackingActive, currentLocation,
      startTracking, stopTracking, confirmDelivery
    }}>
      {children}
    </TrackingContext.Provider>
  );
}

export const useTracking = () => useContext(TrackingContext);
