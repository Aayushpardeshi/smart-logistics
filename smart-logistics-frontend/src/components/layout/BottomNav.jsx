import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, MapPin, User, Truck } from "lucide-react";

export default function BottomNav() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (!user) return null;

  // On mobile, keep it concise (max 5 items)
  const links = {
    driver: [
      { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      { to: "/loads", label: t("nav.loads") || "Marketplace", icon: Package },
      { to: "/bids", label: "My Bids", icon: Package }, // Reusing Package icon for now
      { to: "/tracking", label: "Tracking", icon: MapPin },
      { to: "/profile", label: t("nav.profile"), icon: User },
    ],
    business: [
      { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      { to: "/loads", label: t("nav.loads") || "Loads", icon: Package },
      { to: "/bids", label: "Bids", icon: Package },
      { to: "/tracking", label: "Tracking", icon: MapPin },
      { to: "/profile", label: t("nav.profile"), icon: User },
    ],
    admin: [
      { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    ]
  };

  const navLinks = links[user.role] || [];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 pb-safe z-50">
      {navLinks.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname.startsWith(link.to);
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-none truncate max-w-[72px]">
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
