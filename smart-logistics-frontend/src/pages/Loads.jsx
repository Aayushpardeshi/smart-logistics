import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Loader2, Search, PlusCircle, Package, ArrowRight, X } from "lucide-react";

export default function Loads() {
  const { user } = useAuth();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // Form states for Business (Create Load)
  const [newLoad, setNewLoad] = useState({
    sourceAddress: "",
    destinationAddress: "",
    cargoType: "",
    cargoWeight: "",
    vehicleType: "",
    pickupDate: "",
    deliveryDate: "",
    budget: ""
  });

  // Form states for Driver (Place Bid)
  const [bidData, setBidData] = useState({
    amount: "",
    estimatedDelivery: "",
    message: ""
  });
  const [selectedLoadId, setSelectedLoadId] = useState(null);

  useEffect(() => {
    fetchLoads();
  }, [user]);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const res = user.role === 'business' 
        ? await api.get("/business/loads") 
        : await api.get("/driver/loads/open");
      setLoads(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch loads.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoad = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/business/loads", {
        source: { address: newLoad.sourceAddress },
        destination: { address: newLoad.destinationAddress },
        cargoType: newLoad.cargoType,
        cargoWeight: Number(newLoad.cargoWeight),
        vehicleType: newLoad.vehicleType,
        pickupDate: newLoad.pickupDate,
        deliveryDate: newLoad.deliveryDate,
        budget: Number(newLoad.budget)
      });
      setShowModal(false);
      fetchLoads();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create load");
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post(`/driver/loads/${selectedLoadId}/bids`, {
        amount: Number(bidData.amount),
        estimatedDelivery: bidData.estimatedDelivery,
        message: bidData.message
      });
      setShowModal(false);
      alert("Bid placed successfully!");
      fetchLoads(); // Refresh to remove or update status
    } catch (err) {
      alert(err.response?.data?.message || "Failed to place bid");
      setLoading(false);
    }
  };

  if (loading && loads.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-secondary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            {user.role === 'business' ? 'My Loads' : 'Load Marketplace'}
          </h1>
          <p className="text-slate-500 mt-1">
            {user.role === 'business' ? 'Manage your posted shipments and track their status.' : 'Find available loads and place competitive bids.'}
          </p>
        </div>
        {user.role === 'business' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-secondary hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center"
          >
            <PlusCircle size={18} className="mr-2" /> Post New Load
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-danger p-4 rounded-xl border border-red-100 mb-6">
          {error}
        </div>
      )}

      {/* Load List */}
      <div className="bg-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Budget</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {loads.map((load) => (
                  <tr key={load._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary truncate max-w-[200px]" title={load.source?.address}>{load.source?.address}</span>
                        <span className="text-slate-400 text-xs my-1 flex items-center"><ArrowRight size={12} className="mx-1" /></span>
                        <span className="font-bold text-primary truncate max-w-[200px]" title={load.destination?.address}>{load.destination?.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {load.cargoType} <br/>
                      <span className="text-slate-400 font-normal">{load.cargoWeight} Tons - {load.vehicleType}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      Pickup: {new Date(load.pickupDate).toLocaleDateString()}<br/>
                      Delivery: {new Date(load.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-secondary">
                      ₹{load.budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'business' ? (
                         <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                           {load.status}
                         </span>
                      ) : (
                         <button 
                           onClick={() => { setSelectedLoadId(load._id); setShowModal(true); }}
                           className="bg-accent hover:bg-cyan-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                         >
                           Place Bid
                         </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500">
            <Package size={60} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-700 mb-2">No loads found</p>
            <p>Check back later or adjust your filters.</p>
          </div>
        )}
      </div>

      {/* Modal for Creating Load or Placing Bid */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-xl rounded-3xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-primary">
                {user.role === 'business' ? 'Post a New Load' : 'Submit Your Bid'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-danger transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {user.role === 'business' ? (
                // Business Form
                <form onSubmit={handleCreateLoad} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Source Address</label>
                      <input type="text" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" 
                        value={newLoad.sourceAddress} onChange={e => setNewLoad({...newLoad, sourceAddress: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Destination Address</label>
                      <input type="text" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" 
                        value={newLoad.destinationAddress} onChange={e => setNewLoad({...newLoad, destinationAddress: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo Type</label>
                      <input type="text" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" 
                        value={newLoad.cargoType} onChange={e => setNewLoad({...newLoad, cargoType: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Weight (Tons)</label>
                      <input type="number" required min="1" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" 
                        value={newLoad.cargoWeight} onChange={e => setNewLoad({...newLoad, cargoWeight: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Vehicle Type</label>
                      <input type="text" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" 
                        value={newLoad.vehicleType} onChange={e => setNewLoad({...newLoad, vehicleType: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Pickup Date</label>
                      <input type="date" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" 
                        value={newLoad.pickupDate} onChange={e => setNewLoad({...newLoad, pickupDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Date</label>
                      <input type="date" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" 
                        value={newLoad.deliveryDate} onChange={e => setNewLoad({...newLoad, deliveryDate: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Budget (₹)</label>
                    <input type="number" required min="100" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" 
                      value={newLoad.budget} onChange={e => setNewLoad({...newLoad, budget: e.target.value})} />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-xl mr-2">Cancel</button>
                    <button type="submit" disabled={loading} className="bg-secondary hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center disabled:opacity-50">
                      {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Post Load'}
                    </button>
                  </div>
                </form>
              ) : (
                // Driver Form
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bid Amount (₹)</label>
                    <input type="number" required min="100" placeholder="e.g. 15000" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none" 
                      value={bidData.amount} onChange={e => setBidData({...bidData, amount: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Estimated Delivery Date</label>
                    <input type="date" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none" 
                      value={bidData.estimatedDelivery} onChange={e => setBidData({...bidData, estimatedDelivery: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Message (Optional)</label>
                    <textarea rows="3" placeholder="Any details for the business..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none" 
                      value={bidData.message} onChange={e => setBidData({...bidData, message: e.target.value})}></textarea>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-xl mr-2">Cancel</button>
                    <button type="submit" disabled={loading} className="bg-accent hover:bg-cyan-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center disabled:opacity-50">
                      {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Submit Bid'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
