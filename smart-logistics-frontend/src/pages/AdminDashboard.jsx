import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-toastify";
import { 
  Users, Truck, Package, Activity, Shield, CheckCircle, 
  AlertTriangle, FileText, XCircle, Check, X, Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("overview"); // overview | users | docs
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Image Viewer
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "overview") {
        const res = await api.get("/admin/stats");
        const documentsRes = await api.get("/admin/documents/pending");
        setStats({
          ...res.data.data,
          pendingVerifications: documentsRes.data.data.length
        });
      } else if (activeTab === "users") {
        const res = await api.get("/admin/users");
        setUsers(res.data.data);
      } else if (activeTab === "docs") {
        const res = await api.get("/admin/documents/pending");
        setPendingDocs(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch admin data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (truckId, docType, action) => {
    try {
      await api.put(`/admin/documents/verify/${truckId}`, { docType, action });
      toast.success(`Document ${action}d successfully`);
      fetchData(); // Refresh queue
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification action failed");
    }
  };

  if (loading && !stats && !users.length && !pendingDocs.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-secondary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Admin Console</h1>
          <p className="text-slate-500 mt-1">Platform overview and system management.</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border border-green-200 bg-green-50 shadow-sm">
          <Shield size={18} className="text-success" />
          <span className="font-semibold text-sm text-success">Super Admin Access</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-4 px-2 font-bold text-sm flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === "overview" ? "border-secondary text-secondary" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Activity size={18} />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-4 px-2 font-bold text-sm flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === "users" ? "border-secondary text-secondary" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users size={18} />
          <span>Users</span>
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`pb-4 px-2 font-bold text-sm flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === "docs" ? "border-secondary text-secondary" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText size={18} />
          <span>Pending Verifications {stats?.pendingVerifications > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{stats.pendingVerifications}</span>}</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
              <Users size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2.5 rounded-xl text-secondary">
                <Users size={20} />
              </div>
              <h3 className="font-semibold text-slate-700">Total Users</h3>
            </div>
            <div className="text-4xl font-black text-primary">{stats.totalUsers}</div>
            <div className="text-sm text-slate-500 mt-2 flex justify-between">
              <span>Drivers: {stats.drivers}</span>
              <span>Biz: {stats.businesses}</span>
            </div>
          </div>

          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
              <Truck size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-warning/20 p-2.5 rounded-xl text-warning">
                <Truck size={20} />
              </div>
              <h3 className="font-semibold text-slate-700">Active Trips</h3>
            </div>
            <div className="text-4xl font-black text-primary">{stats.activeTrips}</div>
            <div className="text-sm text-success font-medium mt-2 flex items-center">
              <Activity size={14} className="mr-1" /> Live tracking active
            </div>
          </div>

          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer hover:border-red-200" onClick={() => setActiveTab("docs")}>
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
              <AlertTriangle size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2.5 rounded-xl text-danger">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-semibold text-slate-700">Pending Docs</h3>
            </div>
            <div className="text-4xl font-black text-primary">{stats.pendingVerifications}</div>
            <div className="text-sm text-danger font-medium mt-2 flex items-center">
              Requires manual approval
            </div>
          </div>

          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
              <Package size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2.5 rounded-xl text-success">
                <Package size={20} />
              </div>
              <h3 className="font-semibold text-slate-700">Open Loads</h3>
            </div>
            <div className="text-4xl font-black text-success mt-2">{stats.activeLoads}</div>
            <div className="text-sm text-slate-500 mt-2">Awaiting bids</div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="bg-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{u.name}</td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4 text-slate-600">{u.phone}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'driver' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-success font-medium flex items-center"><CheckCircle size={14} className="mr-1"/> Active</span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCS TAB */}
      {activeTab === "docs" && (
        <div className="space-y-6">
          {pendingDocs.length === 0 ? (
            <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-500">
              <CheckCircle size={48} className="mx-auto mb-3 text-emerald-300" />
              <h3 className="text-xl font-bold text-slate-800">All Caught Up!</h3>
              <p className="mt-2">There are no pending documents awaiting manual verification.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingDocs.map(truck => {
                const docsToVerify = [];
                if (truck.pucStatus === "uploaded") docsToVerify.push({ type: 'puc', label: 'PUC Certificate', url: truck.pucDocUrl });
                if (truck.insuranceStatus === "uploaded") docsToVerify.push({ type: 'insurance', label: 'Insurance Policy', url: truck.insuranceDocUrl });
                if (truck.permitStatus === "uploaded") docsToVerify.push({ type: 'permit', label: 'Vehicle Permit', url: truck.permitDocUrl });

                return docsToVerify.map(doc => (
                  <div key={`${truck._id}-${doc.type}`} className="bg-card rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{doc.label}</h4>
                        <p className="text-xs text-slate-500">Truck: {truck.truckNumber}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Pending</span>
                    </div>
                    
                    <div 
                      className="h-48 bg-slate-900 relative group cursor-pointer flex items-center justify-center overflow-hidden"
                      onClick={() => setSelectedImage(doc.url)}
                    >
                      <img src={doc.url} alt={doc.label} className="h-full object-contain group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Click to Expand</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white mt-auto">
                      <p className="text-xs text-slate-600 mb-3 flex items-center">
                        <Users size={14} className="mr-1.5 text-slate-400" />
                        Driver: <span className="font-semibold text-slate-800 ml-1">{truck.driver?.name || "Unknown"}</span>
                      </p>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleVerify(truck._id, doc.type, 'approve')}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white font-bold py-2 rounded-xl text-sm transition-colors flex justify-center items-center"
                        >
                          <Check size={16} className="mr-1" /> Approve
                        </button>
                        <button 
                          onClick={() => handleVerify(truck._id, doc.type, 'reject')}
                          className="flex-1 bg-red-50 hover:bg-red-500 text-red-700 hover:text-white font-bold py-2 rounded-xl text-sm transition-colors flex justify-center items-center"
                        >
                          <X size={16} className="mr-1" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <XCircle size={36} />
          </button>
          <img 
            src={selectedImage} 
            alt="Expanded Document" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          />
        </div>
      )}

    </div>
  );
}
