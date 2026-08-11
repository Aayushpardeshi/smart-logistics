import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { LogOut, Globe } from "lucide-react";

export default function Topbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile Logo */}
        <h1 className="md:hidden text-lg font-bold text-slate-900 tracking-tight">SMART LOGISTICS</h1>
        {/* Desktop context */}
        <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
          {user?.role} Portal
        </span>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-6">
        <div className="flex items-center space-x-2 text-slate-600">
          <Globe size={18} />
          <select 
            value={i18n.language} 
            onChange={handleLanguageChange}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
            <option value="bn">বাংলা</option>
          </select>
        </div>

        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-900">{user?.name}</span>
        </div>

        <button 
          onClick={logout}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center"
          aria-label={t("common.logout")}
          title={t("common.logout")}
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
