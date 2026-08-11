import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Truck, Building, ArrowLeft, UserPlus } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form, role: selectedRole };
      const res = await api.post("/auth/register", payload);
      login(res.data.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background font-sans">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-3 tracking-tight">Create an Account</h1>
            <p className="text-slate-500 text-lg">Choose your account type to get started</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <button 
              onClick={() => setSelectedRole("driver")} 
              className="bg-card p-10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center cursor-pointer border border-slate-100 hover:border-secondary group"
            >
              <div className="bg-blue-50 p-5 rounded-full mb-6 group-hover:bg-secondary group-hover:text-white transition-colors text-secondary">
                <Truck size={48} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-3">Truck Driver</h2>
              <p className="text-sm text-slate-500 text-center leading-relaxed">
                Join our network to find high-paying loads, place bids, and track your trips and earnings in one place.
              </p>
            </button>

            <button 
              onClick={() => setSelectedRole("business")} 
              className="bg-card p-10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center cursor-pointer border border-slate-100 hover:border-secondary group"
            >
              <div className="bg-blue-50 p-5 rounded-full mb-6 group-hover:bg-secondary group-hover:text-white transition-colors text-secondary">
                <Building size={48} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-3">Business Owner</h2>
              <p className="text-sm text-slate-500 text-center leading-relaxed">
                Post your shipping requirements, receive competitive bids from verified drivers, and track your cargo live.
              </p>
            </button>
          </div>
          
          <p className="text-center mt-12 text-slate-600 font-medium">
            Already have an account? <Link to="/login" className="text-secondary hover:text-blue-700 transition-colors">Sign in here</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background font-sans">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-sm border border-slate-100 p-8">
        <button 
          type="button" 
          onClick={() => setSelectedRole(null)} 
          className="text-sm text-slate-500 hover:text-primary mb-6 flex items-center transition-colors font-medium"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to roles
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary capitalize mb-2">{selectedRole} Registration</h1>
          <p className="text-sm text-slate-500">Fill in your details to create your account</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-100 mb-6 flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {selectedRole === 'business' ? 'Company Name' : 'Full Name'}
            </label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
              placeholder={selectedRole === 'business' ? 'Logistics Corp' : 'John Doe'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-slate-900" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              required 
              placeholder="you@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-slate-900" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
            <input 
              type="tel"
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              required 
              placeholder="+91 9876543210"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-slate-900" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input 
              type="password" 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              required 
              placeholder="••••••••"
              minLength={6}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-slate-900" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-secondary text-white font-semibold py-2.5 rounded-lg active:scale-[0.98] transition-all hover:bg-blue-700 disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center mt-4"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                Create Account <UserPlus size={16} className="ml-2" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}