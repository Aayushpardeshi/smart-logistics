import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Truck, Building, ShieldCheck, ArrowLeft, LogIn } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.data.user.role !== selectedRole) {
         setError(`You are not registered as a ${selectedRole}.`);
         setLoading(false);
         return;
      }
      login(res.data.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background font-sans">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-3 tracking-tight">Welcome to Smart Logistics</h1>
            <p className="text-slate-500 text-lg">Select your portal to continue</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <button 
              onClick={() => setSelectedRole("driver")} 
              className="bg-card p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center cursor-pointer border border-slate-100 hover:border-secondary group"
            >
              <div className="bg-blue-50 p-4 rounded-full mb-5 group-hover:bg-secondary group-hover:text-white transition-colors text-secondary">
                <Truck size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">Truck Driver</h2>
              <p className="text-sm text-slate-500 text-center">Find loads, manage trips, and track your earnings.</p>
            </button>

            <button 
              onClick={() => setSelectedRole("business")} 
              className="bg-card p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center cursor-pointer border border-slate-100 hover:border-secondary group"
            >
              <div className="bg-blue-50 p-4 rounded-full mb-5 group-hover:bg-secondary group-hover:text-white transition-colors text-secondary">
                <Building size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">Business Owner</h2>
              <p className="text-sm text-slate-500 text-center">Post loads, review bids, and track shipments live.</p>
            </button>

            <button 
              onClick={() => setSelectedRole("admin")} 
              className="bg-card p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center cursor-pointer border border-slate-100 hover:border-primary group"
            >
              <div className="bg-slate-100 p-4 rounded-full mb-5 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <ShieldCheck size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">Administrator</h2>
              <p className="text-sm text-slate-500 text-center">Manage users, documents, and platform settings.</p>
            </button>
          </div>
          
          <p className="text-center mt-12 text-slate-600 font-medium">
            New to Smart Logistics? <Link to="/register" className="text-secondary hover:text-blue-700 transition-colors">Create an account</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background font-sans">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-sm border border-slate-100 p-8">
        <button 
          type="button" 
          onClick={() => setSelectedRole(null)} 
          className="text-sm text-slate-500 hover:text-primary mb-6 flex items-center transition-colors font-medium"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to roles
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary capitalize mb-2">{selectedRole} Login</h1>
          <p className="text-sm text-slate-500">Enter your credentials to access your portal</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-100 mb-6 flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-slate-900" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-slate-900" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-secondary text-white font-semibold py-2.5 rounded-lg active:scale-[0.98] transition-all hover:bg-blue-700 disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center mt-2"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center">
                Sign In <LogIn size={16} className="ml-2" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}