import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  List, 
  MapPin, 
  User, 
  Truck, 
  FileText 
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (!user) return null;

  const links = {
    driver: [
      { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      { to: "/loads", label: t("nav.loads") || "Marketplace", icon: Package },
      { to: "/bids", label: t("nav.bids") || "My Bids", icon: List },
      { to: "/documents", label: "Verify Documents", icon: FileText },
      { to: "/tracking", label: "Live Tracking", icon: MapPin },
      { to: "/profile", label: t("nav.profile"), icon: User },
    ],
    business: [
      { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      { to: "/loads", label: t("nav.loads") || "Loads", icon: Package },
      { to: "/bids", label: "Manage Bids", icon: List },
      { to: "/tracking", label: "Live Tracking", icon: MapPin },
      { to: "/profile", label: t("nav.profile"), icon: User },
    ],
    admin: [
      { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    ]
  };

  const navLinks = links[user.role] || [];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-wider">SMART LOGISTICS</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
