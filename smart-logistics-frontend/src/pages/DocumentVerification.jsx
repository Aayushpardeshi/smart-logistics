import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  ShieldCheck, 
  Truck as TruckIcon, 
  CreditCard, 
  FileCheck,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  PlusCircle
} from "lucide-react";

export default function DocumentVerification() {
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "vehicle"
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [profile, setProfile] = useState({});

  const showModal = (title, message, type = "success") => {
    const text = title ? `${title}: ${message}` : message;
    if (type === "success") toast.success(text);
    else if (type === "error") toast.error(text);
    else if (type === "warning") toast.warning(text);
    else toast.info(text);
  };

  // Form states for Driving License (DL)
  const [licenseFront, setLicenseFront] = useState(null);
  const [licenseBack, setLicenseBack] = useState(null);
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const [licenseResult, setLicenseResult] = useState(null);

  // Form states for Aadhaar
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);
  const [aadhaarResult, setAadhaarResult] = useState(null);

  // Form states for Vehicle Docs (RC, PUC, Insurance, Permit)
  const [rcFile, setRcFile] = useState(null);
  const [pucFile, setPucFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [permitFile, setPermitFile] = useState(null);

  const [verifyingDoc, setVerifyingDoc] = useState(null); // "rc" | "puc" | "insurance" | "permit"
  const [docResults, setDocResults] = useState({});

  // Inline Truck Add Form state
  const [showAddTruckModal, setShowAddTruckModal] = useState(false);
  const [addingTruck, setAddingTruck] = useState(false);
  const [newTruck, setNewTruck] = useState({
    truckNumber: "",
    truckType: "medium",
    capacityTons: "10"
  });

  const handleAddTruck = async (e) => {
    e.preventDefault();
    if (!newTruck.truckNumber || !newTruck.capacityTons) {
      showModal("Incomplete Form", "Please fill in truck number and capacity in tons.", "warning");
      return;
    }
    try {
      setAddingTruck(true);
      const res = await api.post("/driver/trucks", {
        truckNumber: newTruck.truckNumber.trim().toUpperCase(),
        truckType: newTruck.truckType,
        capacityTons: Number(newTruck.capacityTons)
      });
      showModal("Vehicle Registered", "New vehicle registered in your fleet successfully!", "success");
      setShowAddTruckModal(false);
      setNewTruck({ truckNumber: "", truckType: "medium", capacityTons: "10" });
      
      // Refresh fleet list and select the newly registered truck
      const trucksRes = await api.get("/driver/trucks");
      const loaded = trucksRes.data.data || [];
      setTrucks(loaded);
      const createdId = res.data.data?._id || (loaded.length > 0 ? loaded[loaded.length - 1]._id : "");
      if (createdId) setSelectedTruckId(createdId);
    } catch (err) {
      showModal("Registration Failed", err.response?.data?.message || err.response?.data?.error || "Failed to register vehicle", "error");
    } finally {
      setAddingTruck(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, trucksRes] = await Promise.all([
        api.get("/driver/profile"),
        api.get("/driver/trucks")
      ]);
      setProfile(profileRes.data.data || {});
      const loadedTrucks = trucksRes.data.data || [];
      setTrucks(loadedTrucks);
      if (loadedTrucks.length > 0) {
        setSelectedTruckId(loadedTrucks[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLicense = async (e) => {
    e.preventDefault();
    if (!licenseFront || !licenseBack) {
      showModal("Missing Document Images", "Please select both Front and Back images of your Driving License before verifying.", "warning");
      return;
    }
    try {
      setVerifyingLicense(true);
      setLicenseResult(null);
      const formData = new FormData();
      formData.append("front", licenseFront);
      formData.append("back", licenseBack);

      const res = await api.post("/driver/verify-license", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setLicenseResult(res.data.data || res.data);
      showModal("Verification Completed", "Driving License verification completed successfully!", "success");
      fetchData();
    } catch (err) {
      showModal("Verification Failed", err.response?.data?.message || err.response?.data?.error || "Driving License verification failed", "error");
    } finally {
      setVerifyingLicense(false);
    }
  };

  const handleVerifyAadhaar = async (e) => {
    e.preventDefault();
    if (!aadhaarFront || !aadhaarBack) {
      showModal("Missing Document Images", "Please select both Front and Back images of your Aadhaar card before verifying.", "warning");
      return;
    }
    try {
      setVerifyingAadhaar(true);
      setAadhaarResult(null);
      const formData = new FormData();
      formData.append("front", aadhaarFront);
      formData.append("back", aadhaarBack);

      const res = await api.post("/driver/verify-aadhaar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAadhaarResult(res.data.data || res.data);
      showModal("Verification Completed", "Aadhaar Card verification completed successfully!", "success");
      fetchData();
    } catch (err) {
      showModal("Verification Failed", err.response?.data?.message || err.response?.data?.error || "Aadhaar Card verification failed", "error");
    } finally {
      setVerifyingAadhaar(false);
    }
  };

  const handleVerifyVehicleDoc = async (type, file) => {
    if (!selectedTruckId) {
      showModal("No Vehicle Selected", "Please select a vehicle from your fleet first.", "warning");
      return;
    }
    if (!file) {
      showModal("Missing Document Image", `Please select an image file for ${type.toUpperCase()} before verifying.`, "warning");
      return;
    }
    try {
      setVerifyingDoc(type);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(`/driver/trucks/${selectedTruckId}/verify-${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDocResults(prev => ({ ...prev, [type]: res.data }));
      showModal("Verification Completed", `${type.toUpperCase()} document verification completed successfully!`, "success");
      fetchData();
    } catch (err) {
      showModal("Verification Failed", err.response?.data?.message || err.response?.data?.error || `${type.toUpperCase()} verification failed`, "error");
    } finally {
      setVerifyingDoc(null);
    }
  };

  const getStatusBadge = (status, isVerifying = false) => {
    if (isVerifying) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
          <Loader2 size={14} className="mr-1 text-blue-600 animate-spin" /> Verifying OCR...
        </span>
      );
    }
    switch (status?.toLowerCase()) {
      case "verified":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle size={14} className="mr-1 text-emerald-600" /> Verified
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <XCircle size={14} className="mr-1 text-red-600" /> Verification Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Clock size={14} className="mr-1 text-amber-600" /> Pending Upload
          </span>
        );
    }
  };

  const selectedTruck = trucks.find(t => t._id === selectedTruckId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-secondary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight flex items-center">
            <ShieldCheck size={32} className="mr-3 text-secondary" /> Automated AI Document Verification
          </h1>
          <p className="text-slate-500 mt-1">
            Official automated AI OCR verification for <strong>Driving License (DL), Aadhaar Card, Vehicle RC, PUC, Insurance, and Permit</strong>.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 space-x-6">
        <button
          onClick={() => setActiveTab("personal")}
          className={`pb-4 px-2 font-bold text-sm flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "personal"
              ? "border-secondary text-secondary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <CreditCard size={18} />
          <span>Primary Verification (DL, Aadhaar & RC)</span>
        </button>

        <button
          onClick={() => setActiveTab("vehicle")}
          className={`pb-4 px-2 font-bold text-sm flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "vehicle"
              ? "border-secondary text-secondary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <TruckIcon size={18} />
          <span>Additional Vehicle Docs (PUC, Insurance, Permit)</span>
        </button>
      </div>

      {/* TAB 1: Primary Verification (Driving License, Aadhaar & RC) */}
      {activeTab === "personal" && (
        <div className="space-y-8">
          
          {/* SECTION 1: Driving License (DL) */}
          <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-primary flex items-center">
                  <UserCheck size={22} className="mr-2 text-secondary" /> Driving License (DL) Verification
                </h2>
                <p className="text-sm text-slate-500">Upload Front and Back side images of your official Driving License.</p>
              </div>
              <div>{getStatusBadge(verifyingLicense ? "verifying" : (profile.verificationStatus || "pending"), verifyingLicense)}</div>
            </div>

            <form onSubmit={handleVerifyLicense} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DL Front File */}
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors text-center">
                  <Upload size={32} className="mx-auto text-secondary mb-3" />
                  <label className="block text-sm font-semibold text-slate-700 mb-1 cursor-pointer">
                    DL Front Image
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required
                    onChange={(e) => { setLicenseFront(e.target.files[0]); setLicenseResult(null); }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer"
                  />
                  {licenseFront && (
                    <p className="text-xs font-medium text-emerald-600 mt-2 truncate">
                      Selected: {licenseFront.name}
                    </p>
                  )}
                </div>

                {/* DL Back File */}
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors text-center">
                  <Upload size={32} className="mx-auto text-secondary mb-3" />
                  <label className="block text-sm font-semibold text-slate-700 mb-1 cursor-pointer">
                    DL Back Image
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required
                    onChange={(e) => { setLicenseBack(e.target.files[0]); setLicenseResult(null); }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer"
                  />
                  {licenseBack && (
                    <p className="text-xs font-medium text-emerald-600 mt-2 truncate">
                      Selected: {licenseBack.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={verifyingLicense}
                  className="bg-secondary hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center disabled:opacity-50 cursor-pointer"
                >
                  {verifyingLicense ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} /> Processing DL OCR...
                    </>
                  ) : (
                    <>
                      <FileCheck size={18} className="mr-2" /> Verify Driving License
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* DL Results */}
            {!verifyingLicense && (licenseResult || (profile.licenseDetails && !licenseFront && !licenseBack)) && (
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-primary mb-3 flex items-center">
                  <CheckCircle size={18} className="text-emerald-500 mr-2" /> Extracted Driving License Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">DL Number</span>
                    <span className="font-bold text-slate-800">{licenseResult?.front?.licence_number || profile.licenseNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Driver Name</span>
                    <span className="font-bold text-slate-800">{licenseResult?.front?.name || profile.licenseDetails?.front?.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">DOB / Validity</span>
                    <span className="font-bold text-slate-800">
                      {licenseResult?.front?.date_of_birth || profile.licenseDetails?.front?.date_of_birth || "N/A"} / {licenseResult?.front?.validity_nt || profile.licenseDetails?.front?.validity_nt || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Aadhaar Card */}
          <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-primary flex items-center">
                  <CreditCard size={22} className="mr-2 text-secondary" /> Aadhaar Card Verification
                </h2>
                <p className="text-sm text-slate-500">Upload Front and Back side images of your Aadhaar card.</p>
              </div>
              <div>{getStatusBadge(verifyingAadhaar ? "verifying" : (profile.aadhaarStatus || "pending"), verifyingAadhaar)}</div>
            </div>

            <form onSubmit={handleVerifyAadhaar} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front File */}
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors text-center">
                  <Upload size={32} className="mx-auto text-secondary mb-3" />
                  <label className="block text-sm font-semibold text-slate-700 mb-1 cursor-pointer">
                    Aadhaar Front Image
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required
                    onChange={(e) => { setAadhaarFront(e.target.files[0]); setAadhaarResult(null); }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer"
                  />
                  {aadhaarFront && (
                    <p className="text-xs font-medium text-emerald-600 mt-2 truncate">
                      Selected: {aadhaarFront.name}
                    </p>
                  )}
                </div>

                {/* Back File */}
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors text-center">
                  <Upload size={32} className="mx-auto text-secondary mb-3" />
                  <label className="block text-sm font-semibold text-slate-700 mb-1 cursor-pointer">
                    Aadhaar Back Image
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required
                    onChange={(e) => { setAadhaarBack(e.target.files[0]); setAadhaarResult(null); }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer"
                  />
                  {aadhaarBack && (
                    <p className="text-xs font-medium text-emerald-600 mt-2 truncate">
                      Selected: {aadhaarBack.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={verifyingAadhaar}
                  className="bg-secondary hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center disabled:opacity-50 cursor-pointer"
                >
                  {verifyingAadhaar ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} /> Processing Aadhaar OCR...
                    </>
                  ) : (
                    <>
                      <FileCheck size={18} className="mr-2" /> Verify Aadhaar Card
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Aadhaar Results */}
            {!verifyingAadhaar && (aadhaarResult || (profile.aadhaarDetails && !aadhaarFront && !aadhaarBack)) && (
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-primary mb-3 flex items-center">
                  <CheckCircle size={18} className="text-emerald-500 mr-2" /> Extracted Aadhaar Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Aadhaar Number</span>
                    <span className="font-bold text-slate-800">{aadhaarResult?.front?.aadhaar_number || profile.aadhaarNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Holder Name</span>
                    <span className="font-bold text-slate-800">{aadhaarResult?.front?.name || profile.aadhaarDetails?.front?.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Pincode / Gender</span>
                    <span className="font-bold text-slate-800">
                      {aadhaarResult?.back?.pincode || profile.aadhaarDetails?.back?.pincode || "N/A"} / {aadhaarResult?.front?.gender || profile.aadhaarDetails?.front?.gender || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Vehicle RC (Registration Certificate) */}
          <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-primary flex items-center">
                  <FileText size={22} className="mr-2 text-secondary" /> Vehicle Registration Certificate (RC) Verification
                </h2>
                <p className="text-sm text-slate-500">Upload official RC document image for your registered vehicle.</p>
              </div>
              <div>{getStatusBadge(verifyingDoc === "rc" ? "verifying" : (selectedTruck?.rcStatus || "pending"), verifyingDoc === "rc")}</div>
            </div>

            {trucks.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
                <TruckIcon size={44} className="mx-auto mb-3 text-secondary/60" />
                <h3 className="font-bold text-slate-800 text-lg">No vehicles registered in your fleet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Register your vehicle details now to start uploading and verifying RC documents immediately without leaving this page.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddTruckModal(true)}
                  className="inline-flex items-center mt-4 px-6 py-3 bg-secondary hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <PlusCircle size={16} className="mr-1.5" /> Register Vehicle Now
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Truck Selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block uppercase">Select Fleet Vehicle</span>
                    <span className="text-sm text-slate-700 font-semibold">Choose the truck to associate with this RC document</span>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                      value={selectedTruckId}
                      onChange={(e) => setSelectedTruckId(e.target.value)}
                      className="w-full md:w-64 p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer text-sm"
                    >
                      {trucks.map(truck => (
                        <option key={truck._id} value={truck._id}>
                          {truck.truckNumber} ({truck.truckType.toUpperCase()} - {truck.capacityTons}T)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddTruckModal(true)}
                      className="bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center shrink-0 transition-colors cursor-pointer"
                      title="Register another vehicle"
                    >
                      <PlusCircle size={15} className="mr-1" /> Add Truck
                    </button>
                  </div>
                </div>

                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors text-center">
                  <Upload size={32} className="mx-auto text-secondary mb-3" />
                  <label className="block text-sm font-semibold text-slate-700 mb-1 cursor-pointer">
                    Vehicle RC Document Image
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required
                    onChange={(e) => { setRcFile(e.target.files[0]); setDocResults(prev => ({ ...prev, rc: null })); }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer"
                  />
                  {rcFile && (
                    <p className="text-xs font-medium text-emerald-600 mt-2 truncate">
                      Selected: {rcFile.name}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleVerifyVehicleDoc("rc", rcFile)}
                    disabled={verifyingDoc === "rc"}
                    className="bg-secondary hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center disabled:opacity-50 cursor-pointer"
                  >
                    {verifyingDoc === "rc" ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} /> Processing RC OCR...
                      </>
                    ) : (
                      <>
                        <FileCheck size={18} className="mr-2" /> Verify Vehicle RC
                      </>
                    )}
                  </button>
                </div>

                {/* RC Results */}
                {verifyingDoc !== "rc" && (docResults.rc || (selectedTruck?.rcDetails && !rcFile)) && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-primary mb-3 flex items-center">
                      <CheckCircle size={18} className="text-emerald-500 mr-2" /> Extracted RC Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400 block text-xs">Registration Number</span>
                        <span className="font-bold text-slate-800">{docResults.rc?.data?.rc_fields?.registration_number || selectedTruck?.rcDetails?.registration_number || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-xs">Owner Name</span>
                        <span className="font-bold text-slate-800">{docResults.rc?.data?.rc_fields?.owner_name || selectedTruck?.rcDetails?.owner_name || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-xs">Vehicle Class / Expiry</span>
                        <span className="font-bold text-slate-800">
                          {docResults.rc?.data?.rc_fields?.vehicle_class || selectedTruck?.rcDetails?.vehicle_class || "N/A"} / {docResults.rc?.data?.rc_fields?.fitness_upto || selectedTruck?.rcDetails?.fitness_upto || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM CTA: Continue to Additional Vehicle Documents */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl mt-10 gap-4">
            <div>
              <h3 className="font-bold text-xl flex items-center">
                <TruckIcon size={24} className="text-secondary mr-2" /> Fleet Vehicle Documents Next
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Proceed to the next page to complete verification for <strong>PUC, Vehicle Insurance, and Goods/National Permit</strong>.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("vehicle")}
              className="w-full md:w-auto bg-secondary hover:bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center cursor-pointer whitespace-nowrap"
            >
              <span>Continue to Additional Vehicle Documents</span>
              <ArrowRight size={20} className="ml-2" />
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: Additional Vehicle Documents (PUC, Insurance, Permit) */}
      {activeTab === "vehicle" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top Bar Navigation */}
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => setActiveTab("personal")}
              className="inline-flex items-center text-sm font-bold text-slate-600 hover:text-secondary transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl"
            >
              <ArrowLeft size={16} className="mr-1.5" /> Back to Primary Verification (DL, Aadhaar & RC)
            </button>
          </div>

          {/* Truck Selector */}
          <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary flex items-center">
                <TruckIcon size={22} className="mr-2 text-secondary" /> Fleet Vehicle Documents (PUC, Insurance, Permit)
              </h2>
              <p className="text-xs text-slate-500 mt-1">Select a truck from your fleet to upload its PUC, Insurance, and Permit certificates.</p>
            </div>
            {trucks.length > 0 && (
              <div className="w-full md:w-72">
                <select
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
                >
                  {trucks.map(truck => (
                    <option key={truck._id} value={truck._id}>
                      {truck.truckNumber} ({truck.truckType.toUpperCase()} - {truck.capacityTons}T)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {trucks.length === 0 ? (
            <div className="bg-card rounded-3xl border border-slate-100 p-12 text-center text-slate-500">
              <TruckIcon size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700">No trucks registered in your profile.</p>
              <p className="text-xs mt-1">Please add a vehicle first under Profile/Fleet to enable vehicle document verification.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* CARD 1: PUC */}
              <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-primary text-lg flex items-center">
                      <FileText size={20} className="mr-2 text-secondary" /> PUC (Pollution)
                    </h3>
                    {getStatusBadge(verifyingDoc === "puc" ? "verifying" : selectedTruck?.pucStatus, verifyingDoc === "puc")}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Upload Pollution Under Control Certificate image.</p>
                  
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 mb-4">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setPucFile(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary cursor-pointer"
                    />
                  </div>

                  {selectedTruck?.pucDetails && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1 mb-4">
                      <p><span className="text-slate-400">Cert No:</span> <strong className="text-slate-700">{selectedTruck.pucDetails.puc_certificate_number || "N/A"}</strong></p>
                      <p><span className="text-slate-400">Valid Upto:</span> <strong className="text-slate-700">{selectedTruck.pucDetails.valid_upto || "N/A"}</strong></p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleVerifyVehicleDoc("puc", pucFile)}
                  disabled={verifyingDoc === "puc"}
                  className="w-full bg-secondary hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm flex justify-center items-center disabled:opacity-50 cursor-pointer text-sm"
                >
                  {verifyingDoc === "puc" ? <Loader2 className="animate-spin mr-2" size={16} /> : <FileCheck size={16} className="mr-2" />} Verify PUC
                </button>
              </div>

              {/* CARD 2: Insurance */}
              <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-primary text-lg flex items-center">
                      <FileText size={20} className="mr-2 text-secondary" /> Vehicle Insurance
                    </h3>
                    {getStatusBadge(verifyingDoc === "insurance" ? "verifying" : selectedTruck?.insuranceStatus, verifyingDoc === "insurance")}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Upload Insurance Policy document image.</p>
                  
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 mb-4">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setInsuranceFile(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary cursor-pointer"
                    />
                  </div>

                  {selectedTruck?.insuranceDetails && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1 mb-4">
                      <p><span className="text-slate-400">Policy No:</span> <strong className="text-slate-700">{selectedTruck.insuranceDetails.policy_number || "N/A"}</strong></p>
                      <p><span className="text-slate-400">Valid Until:</span> <strong className="text-slate-700">{selectedTruck.insuranceDetails.valid_until || "N/A"}</strong></p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleVerifyVehicleDoc("insurance", insuranceFile)}
                  disabled={verifyingDoc === "insurance"}
                  className="w-full bg-secondary hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm flex justify-center items-center disabled:opacity-50 cursor-pointer text-sm"
                >
                  {verifyingDoc === "insurance" ? <Loader2 className="animate-spin mr-2" size={16} /> : <FileCheck size={16} className="mr-2" />} Verify Insurance
                </button>
              </div>

              {/* CARD 3: Permit */}
              <div className="bg-card rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-primary text-lg flex items-center">
                      <FileText size={20} className="mr-2 text-secondary" /> Vehicle Permit
                    </h3>
                    {getStatusBadge(verifyingDoc === "permit" ? "verifying" : selectedTruck?.permitStatus, verifyingDoc === "permit")}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Upload Goods / National Permit document image.</p>
                  
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 mb-4">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setPermitFile(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary cursor-pointer"
                    />
                  </div>

                  {selectedTruck?.permitDetails && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1 mb-4">
                      <p><span className="text-slate-400">Permit No:</span> <strong className="text-slate-700">{selectedTruck.permitDetails.permit_number || "N/A"}</strong></p>
                      <p><span className="text-slate-400">Type:</span> <strong className="text-slate-700">{selectedTruck.permitDetails.permit_type || "N/A"}</strong></p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleVerifyVehicleDoc("permit", permitFile)}
                  disabled={verifyingDoc === "permit"}
                  className="w-full bg-secondary hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm flex justify-center items-center disabled:opacity-50 cursor-pointer text-sm"
                >
                  {verifyingDoc === "permit" ? <Loader2 className="animate-spin mr-2" size={16} /> : <FileCheck size={16} className="mr-2" />} Verify Permit
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Inline Vehicle Registration Modal Overlay */}
      {showAddTruckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <TruckIcon size={22} className="mr-2 text-secondary" /> Register Fleet Vehicle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTruckModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTruck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Vehicle / Truck Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH14 AB 1234"
                  value={newTruck.truckNumber}
                  onChange={(e) => setNewTruck({ ...newTruck, truckNumber: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-secondary focus:bg-white outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Truck Type *
                  </label>
                  <select
                    value={newTruck.truckType}
                    onChange={(e) => setNewTruck({ ...newTruck, truckType: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-secondary focus:bg-white outline-none text-sm cursor-pointer"
                  >
                    <option value="mini">Mini (1-3T)</option>
                    <option value="medium">Medium (3-10T)</option>
                    <option value="heavy">Heavy (10-25T)</option>
                    <option value="trailer">Trailer (25T+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Capacity (Tons) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newTruck.capacityTons}
                    onChange={(e) => setNewTruck({ ...newTruck, capacityTons: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-secondary focus:bg-white outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddTruckModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingTruck}
                  className="px-6 py-2.5 bg-secondary hover:bg-blue-700 text-white rounded-xl font-bold shadow-md text-sm flex items-center cursor-pointer disabled:opacity-50"
                >
                  {addingTruck ? <Loader2 className="animate-spin mr-2" size={16} /> : <PlusCircle className="mr-1.5" size={16} />} Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
