import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  Building2, MapPin, Package, List, ArrowRight, Loader2, 
  Clock, CheckCircle2, XCircle, Search, FileText, Truck, Map, PlusCircle, AlertCircle
} from "lucide-react";

export default function BusinessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loads, setLoads] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [profileRes, loadsRes, tripsRes] = await Promise.all([
          api.get("/business/profile"),
          api.get("/business/loads"),
          api.get("/business/trips")
        ]);

        setProfile(profileRes.data.data);
        setLoads(loadsRes.data.data || []);
        setTrips(tripsRes.data.data || []);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-secondary" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-danger p-4 rounded-xl border border-red-100 flex items-center justify-between">
        <p className="font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm underline">Retry</button>
      </div>
    );
  }

  const activeLoads = loads.filter(l => ["OPEN", "BIDDING"].includes(l.status));
  const activeTrips = trips.filter(t => ["ASSIGNED", "READY", "IN_TRANSIT"].includes(t.status));
  const completedTrips = trips.filter(t => t.status === "COMPLETED" || t.status === "DELIVERED");
  
  const recentLoads = loads.slice(0, 5); // Take top 5 recent loads
  const currentTrip = activeTrips.length > 0 ? activeTrips[0] : null;

  const getLoadStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-secondary';
      case 'BIDDING': return 'bg-purple-100 text-purple-700';
      case 'ASSIGNED':
      case 'IN_TRANSIT': return 'bg-yellow-100 text-warning';
      case 'DELIVERED':
      case 'COMPLETED': return 'bg-green-100 text-success';
      case 'CANCELLED': return 'bg-red-100 text-danger';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Business Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.name}. Manage your shipments and operations.</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm">
          <Building2 size={18} className="text-secondary" />
          <span className="font-semibold text-sm text-slate-700">{profile?.companyName || 'Company Profile Pending'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Trip Banner */}
          {currentTrip ? (
            <div className="bg-gradient-to-br from-slate-800 to-primary rounded-3xl p-8 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Truck size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-warning/20 text-warning px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-warning/30">
                    Active Trip
                  </span>
                  <span className="text-sm font-medium text-slate-300 flex items-center bg-white/10 px-3 py-1 rounded-full">
                    <MapPin size={14} className="mr-1" /> {currentTrip.status}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-8">
                  <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Origin</p>
                    <p className="text-xl font-bold">{currentTrip.source.address}</p>
                  </div>
                  <div className="hidden md:block flex-1 border-t-2 border-dashed border-slate-500 relative">
                    <ArrowRight size={24} className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-warning bg-slate-800 px-1" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Destination</p>
                    <p className="text-xl font-bold">{currentTrip.destination.address}</p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/tracking', { state: { tripId: currentTrip._id } })} 
                  className="bg-warning hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center group/btn"
                >
                  Live GPS Tracking <Map size={18} className="ml-2 group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
             <div className="bg-card rounded-3xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Truck size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">No Active Trips</h3>
                <p className="text-slate-500 mb-6 max-w-md">You don't have any shipments in transit right now. Create a new load to get started.</p>
                <button 
                  onClick={() => navigate('/loads/create')}
                  className="bg-primary hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium transition-colors inline-flex items-center"
                >
                  <PlusCircle size={18} className="mr-2" /> Post New Load
                </button>
             </div>
          )}

          {/* Recent Loads Table */}
          <div className="bg-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-primary flex items-center">
                <Package size={22} className="mr-2 text-secondary" /> Recent Loads
              </h2>
              <button onClick={() => navigate('/loads')} className="text-sm font-medium text-secondary hover:text-blue-700 hover:underline">
                View All
              </button>
            </div>
            
            {recentLoads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Destination</th>
                      <th className="px-6 py-4">Cargo</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {recentLoads.map((load) => (
                      <tr key={load._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 truncate max-w-[200px]" title={load.destination?.address}>
                          {load.destination?.address || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          {load.cargoType} <span className="text-slate-400 font-normal">({load.cargoWeight}T)</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getLoadStatusColor(load.status)}`}>
                            {load.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(load.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500">
                <Package size={40} className="mx-auto mb-3 text-slate-300" />
                <p>You haven't posted any loads yet.</p>
              </div>
            )}
          </div>
          
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                <Package size={80} />
              </div>
              <div className="text-slate-500 text-sm font-semibold mb-1">Active Loads</div>
              <div className="text-3xl font-black text-primary">{activeLoads.length}</div>
            </div>
            
            <div className="bg-card p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                <Truck size={80} />
              </div>
              <div className="text-slate-500 text-sm font-semibold mb-1">In Transit</div>
              <div className="text-3xl font-black text-primary">{activeTrips.length}</div>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-slate-100 shadow-sm col-span-2 flex items-center justify-between group">
              <div>
                <div className="text-slate-500 text-sm font-semibold mb-1">Completed Shipments</div>
                <div className="text-3xl font-black text-primary">{completedTrips.length}</div>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-primary mb-4 text-lg">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/loads/create')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-secondary hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex items-center text-slate-700 font-medium group-hover:text-secondary transition-colors">
                  <div className="bg-blue-100 p-2 rounded-lg text-secondary mr-3">
                    <PlusCircle size={18} />
                  </div>
                  Post New Load
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/loads')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-accent hover:bg-cyan-50/50 transition-all group"
              >
                <div className="flex items-center text-slate-700 font-medium group-hover:text-accent transition-colors">
                  <div className="bg-cyan-100 p-2 rounded-lg text-accent mr-3">
                    <List size={18} />
                  </div>
                  Manage Loads & Bids
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-warning hover:bg-orange-50/50 transition-all group"
              >
                <div className="flex items-center text-slate-700 font-medium group-hover:text-warning transition-colors">
                  <div className="bg-orange-100 p-2 rounded-lg text-warning mr-3">
                    <Building2 size={18} />
                  </div>
                  Company Profile
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-warning group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
