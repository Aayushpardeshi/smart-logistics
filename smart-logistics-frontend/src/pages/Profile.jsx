import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profileData, setProfileData] = useState({});

  useEffect(() => {
    if (user?.role === 'admin') {
      setLoading(false); // Admins don't have this profile
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const endpoint = user.role === 'business' ? '/business/profile' : '/driver/profile';
      const res = await api.get(endpoint);
      setProfileData(res.data.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const endpoint = user.role === 'business' ? '/business/profile' : '/driver/profile';
      await api.put(endpoint, profileData);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role === 'admin') {
    return <div className="p-8 text-center text-gray-500">Admins do not have a standard profile.</div>;
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center">
          ← Back to Dashboard
        </button>
        
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</h1>
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {user.role === 'business' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input name="companyName" value={profileData.companyName || ''} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input name="gstNumber" value={profileData.gstNumber || ''} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
              </>
            )}

            {user.role === 'driver' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driving License Number</label>
                <input name="licenseNumber" value={profileData.licenseNumber || ''} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input name="address" value={profileData.address || ''} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input name="city" value={profileData.city || ''} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input name="state" value={profileData.state || ''} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={saving} className="w-full bg-primary text-white font-semibold py-3 rounded-lg active:scale-95 transition disabled:opacity-60 hover:bg-opacity-90">
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
