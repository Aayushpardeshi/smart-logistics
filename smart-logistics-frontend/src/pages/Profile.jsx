import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  Eye, 
  Download, 
  Truck as TruckIcon, 
  FileText, 
  CreditCard, 
  UserCheck, 
  X,
  FileCheck,
  Building,
  User,
  MapPin,
  ArrowLeft
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profileData, setProfileData] = useState({});
  const [trucks, setTrucks] = useState([]);
  
  // Image Lightbox Modal state
  const [previewDoc, setPreviewDoc] = useState(null); // { title, url, details }

  useEffect(() => {
    if (user?.role === 'admin') {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user.role === 'driver') {
        const [profileRes, trucksRes] = await Promise.all([
          api.get('/driver/profile'),
          api.get('/driver/trucks')
        ]);
        setProfileData(profileRes.data.data || {});
        setTrucks(trucksRes.data.data || []);
      } else {
        const res = await api.get('/business/profile');
        setProfileData(res.data.data || {});
      }
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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} className="mr-1 text-emerald-600" /> Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Clock size={12} className="mr-1 text-amber-600" /> Pending Upload
          </span>
        );
    }
  };

  if (user?.role === 'admin') {
    return <div className="p-8 text-center text-gray-500">Admins do not have a standard profile.</div>;
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in fade-in duration-300 pb-16">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Back */}
        <button 
          onClick={() => navigate("/dashboard")} 
          className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-1.5" /> Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="bg-card rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-2xl">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
                {user.name}
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-1 capitalize flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                Role: {user.role} | {user.email || user.phone}
              </p>
            </div>
          </div>
          {user.role === 'driver' && (
            <button
              onClick={() => navigate("/documents")}
              className="bg-secondary hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center cursor-pointer"
            >
              <FileCheck size={16} className="mr-1.5" /> Verify / Upload Documents
            </button>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-bold shadow-xs ${message.includes("success") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message}
          </div>
        )}

        {/* Profile Information Form */}
        <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
            <User size={22} className="mr-2 text-secondary" /> Account Details & Address
          </h2>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Registration Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                <input 
                  name="name" 
                  value={profileData.name || ''} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address (Registered)</label>
                <input 
                  name="email" 
                  value={profileData.email || ''} 
                  disabled 
                  className="w-full border border-slate-200 bg-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number *</label>
                <input 
                  name="phone" 
                  value={profileData.phone || ''} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary outline-none" 
                />
              </div>
            </div>

            {user.role === 'business' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company Name</label>
                  <input 
                    name="companyName" 
                    value={profileData.companyName || ''} 
                    onChange={handleChange} 
                    required 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">GST Number</label>
                  <input 
                    name="gstNumber" 
                    value={profileData.gstNumber || ''} 
                    onChange={handleChange} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary outline-none" 
                  />
                </div>
              </div>
            )}

            {user.role === 'driver' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Driving License Number</label>
                <input 
                  name="licenseNumber" 
                  value={profileData.licenseNumber || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. MH14 20230051191"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary outline-none" 
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Street Address</label>
              <input 
                name="address" 
                value={profileData.address || ''} 
                onChange={handleChange} 
                placeholder="Enter street address"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary outline-none" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">City</label>
                <input 
                  name="city" 
                  value={profileData.city || ''} 
                  onChange={handleChange} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">State</label>
                <input 
                  name="state" 
                  value={profileData.state || ''} 
                  onChange={handleChange} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-secondary outline-none" 
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={saving} 
                className="bg-secondary hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>

        {/* DRIVER DOCUMENT VAULT & IMAGE GALLERY */}
        {user.role === 'driver' && (
          <div className="space-y-8">
            
            {/* SECTION: Driver Personal Verified Documents */}
            <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-primary flex items-center">
                    <ShieldCheck size={22} className="mr-2 text-secondary" /> Personal Verified Document Gallery
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">View and access your official uploaded document photos stored in database</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* DL DOCUMENT CARD */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-800 text-sm flex items-center">
                        <UserCheck size={18} className="mr-1.5 text-secondary" /> Driving License (DL)
                      </span>
                      {getStatusBadge(profileData.verificationStatus)}
                    </div>
                    
                    <p className="text-xs text-slate-500 mb-1">
                      <span className="font-bold text-slate-700">DL Number:</span> {profileData.licenseNumber || "N/A"}
                    </p>
                    {profileData.licenseDetails?.front?.name && (
                      <p className="text-xs text-slate-500 mb-1">
                        <span className="font-bold text-slate-700">Holder:</span> {profileData.licenseDetails.front.name}
                      </p>
                    )}
                  </div>

                  {profileData.licenseDocUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img 
                        src={profileData.licenseDocUrl} 
                        alt="Driving License Document" 
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewDoc({
                            title: "Driving License Document Photo",
                            url: profileData.licenseDocUrl,
                            details: `DL No: ${profileData.licenseNumber || 'N/A'}`
                          })}
                          className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-md cursor-pointer hover:bg-slate-100"
                        >
                          <Eye size={14} className="mr-1" /> View Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center text-xs text-amber-700 font-medium">
                      No Driving License photo uploaded yet.
                    </div>
                  )}
                </div>

                {/* AADHAAR DOCUMENT CARD */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-800 text-sm flex items-center">
                        <CreditCard size={18} className="mr-1.5 text-secondary" /> Aadhaar Card
                      </span>
                      {getStatusBadge(profileData.aadhaarStatus)}
                    </div>
                    
                    <p className="text-xs text-slate-500 mb-1">
                      <span className="font-bold text-slate-700">Aadhaar Number:</span> {profileData.aadhaarNumber || "N/A"}
                    </p>
                    {profileData.aadhaarDetails?.front?.name && (
                      <p className="text-xs text-slate-500 mb-1">
                        <span className="font-bold text-slate-700">Holder:</span> {profileData.aadhaarDetails.front.name}
                      </p>
                    )}
                  </div>

                  {profileData.aadhaarDocUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img 
                        src={profileData.aadhaarDocUrl} 
                        alt="Aadhaar Card Document" 
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewDoc({
                            title: "Aadhaar Card Photo",
                            url: profileData.aadhaarDocUrl,
                            details: `Aadhaar No: ${profileData.aadhaarNumber || 'N/A'}`
                          })}
                          className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-md cursor-pointer hover:bg-slate-100"
                        >
                          <Eye size={14} className="mr-1" /> View Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center text-xs text-amber-700 font-medium">
                      No Aadhaar card photo uploaded yet.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* SECTION: Fleet Vehicle Uploaded Documents */}
            <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-primary flex items-center">
                    <TruckIcon size={22} className="mr-2 text-secondary" /> Fleet Vehicles Document Vault
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Photos of RC, PUC, Insurance, and Permit for all registered trucks</p>
                </div>
              </div>

              {trucks.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl text-center text-slate-500 border border-slate-200">
                  <TruckIcon size={40} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-700">No trucks registered in your profile.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {trucks.map((truck) => (
                    <div key={truck._id} className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                        <div>
                          <h3 className="font-bold text-slate-800 text-base flex items-center">
                            <TruckIcon size={18} className="mr-2 text-secondary" /> {truck.truckNumber}
                          </h3>
                          <p className="text-xs text-slate-500 uppercase font-semibold mt-0.5">
                            Type: {truck.truckType} | Capacity: {truck.capacityTons} Tons
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        
                        {/* RC */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">RC (Reg Cert)</span>
                            {getStatusBadge(truck.rcStatus)}
                          </div>
                          {truck.rcDocUrl ? (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                              <img src={truck.rcDocUrl} alt="RC Document" className="w-full h-24 object-cover" />
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => setPreviewDoc({
                                    title: `RC Document Photo (${truck.truckNumber})`,
                                    url: truck.rcDocUrl,
                                    details: `Owner: ${truck.rcDetails?.owner_name || 'N/A'}`
                                  })}
                                  className="bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded flex items-center cursor-pointer"
                                >
                                  <Eye size={12} className="mr-1" /> Preview
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No photo</span>
                          )}
                        </div>

                        {/* PUC */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">PUC (Pollution)</span>
                            {getStatusBadge(truck.pucStatus)}
                          </div>
                          {truck.pucDocUrl ? (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                              <img src={truck.pucDocUrl} alt="PUC Document" className="w-full h-24 object-cover" />
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => setPreviewDoc({
                                    title: `PUC Certificate Photo (${truck.truckNumber})`,
                                    url: truck.pucDocUrl,
                                    details: `Cert No: ${truck.pucDetails?.puc_certificate_number || 'N/A'}`
                                  })}
                                  className="bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded flex items-center cursor-pointer"
                                >
                                  <Eye size={12} className="mr-1" /> Preview
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No photo</span>
                          )}
                        </div>

                        {/* Insurance */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">Insurance Policy</span>
                            {getStatusBadge(truck.insuranceStatus)}
                          </div>
                          {truck.insuranceDocUrl ? (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                              <img src={truck.insuranceDocUrl} alt="Insurance Document" className="w-full h-24 object-cover" />
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => setPreviewDoc({
                                    title: `Insurance Policy Photo (${truck.truckNumber})`,
                                    url: truck.insuranceDocUrl,
                                    details: `Policy No: ${truck.insuranceDetails?.policy_number || 'N/A'}`
                                  })}
                                  className="bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded flex items-center cursor-pointer"
                                >
                                  <Eye size={12} className="mr-1" /> Preview
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No photo</span>
                          )}
                        </div>

                        {/* Permit */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">Permit</span>
                            {getStatusBadge(truck.permitStatus)}
                          </div>
                          {truck.permitDocUrl ? (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                              <img src={truck.permitDocUrl} alt="Permit Document" className="w-full h-24 object-cover" />
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => setPreviewDoc({
                                    title: `Permit Document Photo (${truck.truckNumber})`,
                                    url: truck.permitDocUrl,
                                    details: `Permit No: ${truck.permitDetails?.permit_number || 'N/A'}`
                                  })}
                                  className="bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded flex items-center cursor-pointer"
                                >
                                  <Eye size={12} className="mr-1" /> Preview
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No photo</span>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{previewDoc.title}</h3>
                {previewDoc.details && (
                  <p className="text-xs font-semibold text-slate-500">{previewDoc.details}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-[70vh] flex items-center justify-center bg-slate-900">
              <img 
                src={previewDoc.url} 
                alt={previewDoc.title} 
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>

            <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
              <a
                href={previewDoc.url}
                download="document_photo.jpg"
                className="inline-flex items-center text-xs font-bold text-secondary hover:underline cursor-pointer"
              >
                <Download size={14} className="mr-1" /> Download Document File
              </a>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
