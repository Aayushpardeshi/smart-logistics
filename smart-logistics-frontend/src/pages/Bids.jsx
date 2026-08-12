import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Loader2, List, CheckCircle, XCircle, ArrowRight, IndianRupee, MessageSquare, Phone } from "lucide-react";

function DriverMessageCell({ message }) {
  const [expanded, setExpanded] = useState(false);
  if (!message) {
    return <span className="text-slate-400 text-xs italic">No message</span>;
  }

  const isLong = message.length > 50;
  const displayMessage = expanded || !isLong 
    ? message 
    : message.slice(0, 50) + "...";

  return (
    <div className="bg-slate-100/80 border border-slate-200/60 rounded-xl p-2.5 text-xs text-slate-700 flex items-start space-x-2 min-w-0 transition-all">
      <MessageSquare size={14} className="text-secondary shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <span className="italic break-words [word-break:break-word] min-w-0">"{displayMessage}"</span>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-1.5 text-secondary hover:text-blue-700 font-bold hover:underline inline-block text-[11px] not-italic cursor-pointer"
          >
            {expanded ? "See Less" : "See More"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Bids() {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For business to select which load's bids to view, we'll fetch all their loads, then fetch bids for a selected load.
  // To keep this unified page simple, we'll assume the driver hits `/driver/bids` which returns all their bids.
  // For business, the endpoint is `/business/loads/:loadId/bids`. 
  // Let's adapt this page: If driver, just list my bids. If business, show a placeholder or we can list loads first.
  // Actually, business navigates here to see "Manage Loads & Bids". We can do a two-step if business.
  
  const [businessLoads, setBusinessLoads] = useState([]);
  const [selectedLoad, setSelectedLoad] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user.role === 'driver') {
        const res = await api.get("/driver/bids");
        setBids(res.data.data || []);
      } else if (user.role === 'business') {
        // Fetch all loads, let user select one to view bids
        const res = await api.get("/business/loads");
        setBusinessLoads(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBidsForLoad = async (loadId) => {
    try {
      setLoading(true);
      const res = await api.get(`/business/loads/${loadId}/bids`);
      setBids(res.data.data || []);
      setSelectedLoad(loadId);
    } catch (err) {
      toast.error("Failed to fetch bids for this load");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bidId, action) => {
    try {
      setLoading(true);
      await api.put(`/business/bids/${bidId}/${action}`);
      toast.success(`Bid ${action}ed successfully!`);
      // Refresh bids for current load
      fetchBidsForLoad(selectedLoad);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} bid`);
      setLoading(false);
    }
  };

  if (loading && bids.length === 0 && businessLoads.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-secondary" size={40} />
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-success';
      case 'REJECTED': return 'bg-red-100 text-danger';
      case 'PENDING': return 'bg-yellow-100 text-warning';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            {user.role === 'business' ? 'Manage Bids' : 'My Active Bids'}
          </h1>
          <p className="text-slate-500 mt-1">
            {user.role === 'business' ? 'Review offers from drivers and accept the best bid.' : 'Track the status of your offers on available loads.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-danger p-4 rounded-xl border border-red-100 mb-6">
          {error}
        </div>
      )}

      {user.role === 'business' && !selectedLoad && (
        <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-primary mb-4">Select a Load to View Bids</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businessLoads.filter(l => l.status === "OPEN" || l.status === "BIDDING").map(load => (
              <div key={load._id} onClick={() => fetchBidsForLoad(load._id)} 
                className="p-4 border border-slate-200 rounded-xl hover:border-secondary cursor-pointer transition-colors group">
                <p className="font-bold text-slate-700 group-hover:text-secondary">{load.source?.address} &rarr; {load.destination?.address}</p>
                <p className="text-sm text-slate-500 mt-2">Budget: ₹{load.budget}</p>
              </div>
            ))}
            {businessLoads.filter(l => l.status === "OPEN" || l.status === "BIDDING").length === 0 && (
              <p className="text-slate-500 col-span-full">You have no open loads currently accepting bids.</p>
            )}
          </div>
        </div>
      )}

      {(user.role === 'driver' || selectedLoad) && (
        <div className="bg-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          
          {user.role === 'business' && (
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
              <span className="font-semibold text-slate-700">Bids for selected load</span>
              <button onClick={() => setSelectedLoad(null)} className="text-sm text-secondary hover:underline">
                &larr; Back to Loads
              </button>
            </div>
          )}

          {bids.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                  <tr>
                    {user.role === 'driver' ? <th className="px-6 py-4">Destination</th> : <th className="px-6 py-4">Driver</th>}
                    <th className="px-6 py-4">Bid Amount</th>
                    <th className="px-6 py-4">Est. Delivery</th>
                    <th className="px-6 py-4">Driver Message</th>
                    <th className="px-6 py-4">Status</th>
                    {user.role === 'business' && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {bids.map((bid) => (
                    <tr key={bid._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 truncate max-w-[200px]">
                        {user.role === 'driver' ? (
                          bid.loadId?.destination?.address || 'Unknown'
                        ) : (
                          <div>
                            <div className="font-bold text-primary">{bid.driverId?.name || 'Unknown Driver'}</div>
                            {bid.driverId?.phone && (
                              <div className="text-xs text-slate-400 flex items-center mt-0.5 font-normal">
                                <Phone size={12} className="mr-1" /> {bid.driverId?.phone}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-primary flex items-center">
                        <IndianRupee size={14} className="mr-1 text-slate-400"/> {bid.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(bid.estimatedDelivery).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 max-w-[280px]">
                        <DriverMessageCell message={bid.message} />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(bid.status)}`}>
                          {bid.status}
                        </span>
                      </td>
                      {user.role === 'business' && (
                        <td className="px-6 py-4 text-right space-x-2">
                          {bid.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleAction(bid._id, 'accept')} className="bg-green-100 hover:bg-green-200 text-success p-2 rounded-lg transition-colors" title="Accept Bid">
                                <CheckCircle size={18} />
                              </button>
                              <button onClick={() => handleAction(bid._id, 'reject')} className="bg-red-100 hover:bg-red-200 text-danger p-2 rounded-lg transition-colors" title="Reject Bid">
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500">
              <List size={60} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-700 mb-2">No bids found</p>
              <p>There are no bids to display right now.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
