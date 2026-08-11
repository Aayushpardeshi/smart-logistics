import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Users, Truck, Package, Activity, Shield, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Mock data for admin dashboard since we haven't built admin backend APIs yet
  const [stats] = useState({
    totalUsers: 1245,
    activeDrivers: 856,
    activeBusinesses: 389,
    ongoingTrips: 42,
    pendingVerifications: 18,
    systemHealth: 'Optimal'
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Admin Console</h1>
          <p className="text-slate-500 mt-1">Platform overview and system health.</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border border-green-200 bg-green-50 shadow-sm">
          <Shield size={18} className="text-success" />
          <span className="font-semibold text-sm text-success">Super Admin Access</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Quick Stats */}
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
            <span>Drivers: {stats.activeDrivers}</span>
            <span>Biz: {stats.activeBusinesses}</span>
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
            <h3 className="font-semibold text-slate-700">Ongoing Trips</h3>
          </div>
          <div className="text-4xl font-black text-primary">{stats.ongoingTrips}</div>
          <div className="text-sm text-success font-medium mt-2 flex items-center">
            <Activity size={14} className="mr-1" /> Live tracking active
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <AlertTriangle size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2.5 rounded-xl text-danger">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-semibold text-slate-700">Pending Verification</h3>
          </div>
          <div className="text-4xl font-black text-primary">{stats.pendingVerifications}</div>
          <div className="text-sm text-danger font-medium mt-2 flex items-center">
            Requires attention
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <Activity size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2.5 rounded-xl text-success">
              <CheckCircle size={20} />
            </div>
            <h3 className="font-semibold text-slate-700">System Health</h3>
          </div>
          <div className="text-3xl font-black text-success mt-2">{stats.systemHealth}</div>
          <div className="text-sm text-slate-500 mt-2">All services operational</div>
        </div>
        
      </div>
      
      {/* Admin Actions */}
      <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-xl font-bold text-primary mb-6">Management Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <button className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-secondary hover:bg-blue-50/50 transition-all group">
             <div className="flex flex-col text-left">
               <span className="font-bold text-slate-800 text-lg group-hover:text-secondary transition-colors">User Management</span>
               <span className="text-sm text-slate-500 mt-1">Review accounts, roles, and ban lists</span>
             </div>
             <ArrowRight className="text-slate-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
           </button>

           <button className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-accent hover:bg-cyan-50/50 transition-all group">
             <div className="flex flex-col text-left">
               <span className="font-bold text-slate-800 text-lg group-hover:text-accent transition-colors">Document Verification</span>
               <span className="text-sm text-slate-500 mt-1">Review flagged AI document rejections</span>
             </div>
             <ArrowRight className="text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
           </button>

           <button className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-warning hover:bg-orange-50/50 transition-all group">
             <div className="flex flex-col text-left">
               <span className="font-bold text-slate-800 text-lg group-hover:text-warning transition-colors">Dispute Resolution</span>
               <span className="text-sm text-slate-500 mt-1">Manage conflicts between drivers and businesses</span>
             </div>
             <ArrowRight className="text-slate-300 group-hover:text-warning group-hover:translate-x-1 transition-all" />
           </button>

           <button className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-purple-400 hover:bg-purple-50/50 transition-all group">
             <div className="flex flex-col text-left">
               <span className="font-bold text-slate-800 text-lg group-hover:text-purple-600 transition-colors">Platform Settings</span>
               <span className="text-sm text-slate-500 mt-1">Configure global variables and fees</span>
             </div>
             <ArrowRight className="text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
           </button>
        </div>
      </div>

    </div>
  );
}
