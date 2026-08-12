import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  ShieldAlert, ShieldCheck, Shield, MapPin, Package, List, ArrowRight, Loader2, 
  Clock, CheckCircle2, XCircle, Search, FileText, Truck, Map 
} from "lucide-react";

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [openLoads, setOpenLoads] = useState([]);
  const [activeBids, setActiveBids] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [stats, setStats] = useState({ completedTrips: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all required data concurrently
        const [profileRes, loadsRes, bidsRes, tripsRes] = await Promise.all([
          api.get("/driver/profile"),
          api.get("/driver/loads/open"),
          api.get("/driver/bids"),
          api.get("/driver/trips")
        ]);

        setProfile(profileRes.data.data);
        
        // Take top 3 open loads for preview
        setOpenLoads(loadsRes.data.data || []);
        
        const allBids = bidsRes.data.data || [];
        setActiveBids(allBids);

        const allTrips = tripsRes.data.data || [];
        const currentTrip = allTrips.find(t => ["ASSIGNED", "READY", "IN_TRANSIT"].includes(t.status));
        setActiveTrip(currentTrip || null);
        
        // Mock stats based on real trip count
        const completed = allTrips.filter(t => t.status === "COMPLETED").length;
        setStats({
          completedTrips: completed,
          totalEarnings: completed * 15000 // Mock earning per trip
        });

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

  // Determine Verification Status styling
  const status = profile?.verificationStatus || "pending";
  let StatusIcon = Shield;
  let statusColor = "text-slate-500 bg-slate-100 border-slate-200";
  let statusText = "Unknown Status";

  if (status === "verified") {
    StatusIcon = ShieldCheck;
    statusColor = "text-success bg-green-50 border-green-200";
    statusText = "Verified Driver";
  } else if (status === "rejected") {
    StatusIcon = ShieldAlert;
    statusColor = "text-danger bg-red-50 border-red-200";
    statusText = "Verification Rejected";
  } else {
    StatusIcon = ShieldAlert;
    statusColor = "text-warning bg-yellow-50 border-yellow-200";
    statusText = "Pending Verification";
  }

  const recentBids = activeBids.slice(0, 5); // Take top 5 recent bids

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-success';
      case 'REJECTED': return 'bg-red-100 text-danger';
      default: return 'bg-yellow-100 text-warning';
    }
  };

  const getBidStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle2 size={16} className="mr-1 inline" />;
      case 'REJECTED': return <XCircle size={16} className="mr-1 inline" />;
      default: return <Clock size={16} className="mr-1 inline" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.name}. Here's your logistics overview.</p>
        </div>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${statusColor} shadow-sm`}>
          <StatusIcon size={18} />
          <span className="font-semibold text-sm">{statusText}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Trip Banner */}
          {activeTrip ? (
            <div className="bg-gradient-to-br from-primary to-slate-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Map size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-accent/30">
                    Active Trip
                  </span>
                  <span className="text-sm font-medium text-slate-300 flex items-center bg-white/10 px-3 py-1 rounded-full">
                    <MapPin size={14} className="mr-1" /> {activeTrip.status}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-8">
                  <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">From</p>
                    <p className="text-xl font-bold">{activeTrip.source.address}</p>
                  </div>
                  <div className="hidden md:block flex-1 border-t-2 border-dashed border-slate-500 relative">
                    <Truck size={24} className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-accent bg-slate-800 px-1" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">To</p>
                    <p className="text-xl font-bold">{activeTrip.destination.address}</p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/tracking', { state: { tripId: activeTrip._id } })} 
                  className="bg-warning hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center group/btn"
                >
                  Live GPS Tracking <Map size={18} className="ml-2 group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
             <div className="bg-card rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">No Active Trip</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">You don't have any trips in progress right now. Find a load and start your next journey.</p>
                <button 
                  onClick={() => navigate('/loads')}
                  className="bg-primary hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium transition-colors inline-flex items-center"
                >
                  <Search size={18} className="mr-2" /> Find Loads
                </button>
             </div>
          )}

          {/* Recent Bids Table */}
          <div className="bg-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-primary flex items-center">
                <List size={22} className="mr-2 text-secondary" /> Recent Bids
              </h2>
              <button onClick={() => navigate('/bids')} className="text-sm font-medium text-secondary hover:text-blue-700 hover:underline">
                View All
              </button>
            </div>
            
            {recentBids.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Destination</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {recentBids.map((bid) => (
                      <tr key={bid._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 truncate max-w-[200px]" title={bid.loadId?.destination?.address}>
                          {bid.loadId?.destination?.address || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">₹{bid.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getBidStatusColor(bid.status)}`}>
                            {getBidStatusIcon(bid.status)}
                            {bid.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(bid.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500">
                <List size={40} className="mx-auto mb-3 text-slate-300" />
                <p>You haven't placed any bids yet.</p>
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
              <div className="text-slate-500 text-sm font-semibold mb-1">Open Loads</div>
              <div className="text-3xl font-black text-primary">{openLoads.length}</div>
            </div>
            
            <div className="bg-card p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                <List size={80} />
              </div>
              <div className="text-slate-500 text-sm font-semibold mb-1">Active Bids</div>
              <div className="text-3xl font-black text-primary">{activeBids.filter(b => b.status === "PENDING" || b.status === "ACCEPTED").length}</div>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-slate-100 shadow-sm col-span-2 flex items-center justify-between group">
              <div>
                <div className="text-slate-500 text-sm font-semibold mb-1">Completed Trips</div>
                <div className="text-3xl font-black text-primary">{stats.completedTrips}</div>
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
                onClick={() => navigate('/loads')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-secondary hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex items-center text-slate-700 font-medium group-hover:text-secondary transition-colors">
                  <div className="bg-blue-100 p-2 rounded-lg text-secondary mr-3">
                    <Search size={18} />
                  </div>
                  Find New Loads
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-accent hover:bg-cyan-50/50 transition-all group"
              >
                <div className="flex items-center text-slate-700 font-medium group-hover:text-accent transition-colors">
                  <div className="bg-cyan-100 p-2 rounded-lg text-accent mr-3">
                    <Truck size={18} />
                  </div>
                  Manage Vehicles
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/documents')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-warning hover:bg-orange-50/50 transition-all group"
              >
                <div className="flex items-center text-slate-700 font-medium group-hover:text-warning transition-colors">
                  <div className="bg-orange-100 p-2 rounded-lg text-warning mr-3">
                    <FileText size={18} />
                  </div>
                  Verify Documents (AI OCR)
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

