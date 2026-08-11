import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverDashboard from "./pages/DriverDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Tracking from "./pages/Tracking";
import Loads from "./pages/Loads";
import Bids from "./pages/Bids";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <AppLayout>{children}</AppLayout>;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'driver') return <DriverDashboard />;
  if (user?.role === 'business') return <BusinessDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  return <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/tracking" element={<PrivateRoute><Tracking /></PrivateRoute>} />
      <Route path="/loads" element={<PrivateRoute><Loads /></PrivateRoute>} />
      <Route path="/bids" element={<PrivateRoute><Bids /></PrivateRoute>} />
      <Route path="/loads/create" element={<Navigate to="/loads" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;