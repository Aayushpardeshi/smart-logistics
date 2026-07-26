import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <div className="bg-white p-4 shadow-sm flex justify-between items-center">
        <h1 className="text-lg font-bold text-primary">Smart Logistics</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500">
          Logout
        </button>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-500 mb-4">
          Welcome, <span className="font-medium text-gray-800">{user?.name}</span>{" "}
          ({user?.role})
        </p>

        <div className="grid gap-3">
          <button
            onClick={() => navigate("/tracking")}
            className="bg-white rounded-xl p-4 text-left shadow-sm border active:scale-95 transition"
          >
            <p className="font-semibold text-gray-800">Live Tracking</p>
            <p className="text-xs text-gray-500">
              {user?.role === "driver"
                ? "Share your trip location"
                : "Track your shipment"}
            </p>
          </button>

          {user?.role === "driver" && (
            <>
              <div className="bg-white rounded-xl p-4 shadow-sm border opacity-60">
                <p className="font-semibold text-gray-800">Document Verification</p>
                <p className="text-xs text-gray-500">Coming next</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border opacity-60">
                <p className="font-semibold text-gray-800">My Trucks</p>
                <p className="text-xs text-gray-500">Coming next</p>
              </div>
            </>
          )}

          {user?.role === "business" && (
            <div className="bg-white rounded-xl p-4 shadow-sm border opacity-60">
              <p className="font-semibold text-gray-800">My Shipments</p>
              <p className="text-xs text-gray-500">Coming next</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}