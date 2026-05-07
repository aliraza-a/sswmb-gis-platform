"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { LogOut, Loader2, PlayCircle, StopCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShiftCamera from "@/components/supervisor/ShiftCamera";
import ShiftTimer from "@/components/supervisor/ShiftTimer";
import VehicleInput from "@/components/supervisor/VehicleInput";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ActiveShift {
  id: string;
  start_time: string;
  vehicle: { reg_number: string };
  uc: { name: string, uc_number: string };
}

export default function ShiftApp() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeShifts, setActiveShifts] = useState<ActiveShift[]>([]);
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorUc, setSupervisorUc] = useState("");

  // Start Flow States
  const [isStartingNew, setIsStartingNew] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [regNumber, setRegNumber] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gpsLoc, setGpsLoc] = useState<{lat: number, lng: number} | null>(null);

  // End Flow States (mapped by shift_id)
  const [endingShifts, setEndingShifts] = useState<Record<string, { photo: File | null, regNumber: string, imageUrl: string, isProcessing: boolean }>>({});

  useEffect(() => {
    checkActiveShift();
  }, []);

  const checkActiveShift = async () => {
    try {
      const res = await fetch("/api/shift/active");
      if (res.status === 401) {
        router.push("/supervisor");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch shift data");
      
      const data = await res.json();
      setSupervisorName(data.supervisor.name);
      setSupervisorUc(`UC-${data.supervisor.uc_number} ${data.supervisor.uc_name}`);
      setActiveShifts(data.activeShifts || []);
      
      // Initialize endingShifts state for any active shifts
      const initialEnding: any = {};
      data.activeShifts?.forEach((s: any) => {
        initialEnding[s.id] = { photo: null, regNumber: "", imageUrl: "", isProcessing: false };
      });
      setEndingShifts(initialEnding);
    } catch (err) {
      console.error(err);
      toast.error("Error loading shift state");
    } finally {
      setLoading(false);
    }
  };

  const getGps = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleCapture = async (file: File, shiftId?: string) => {
    if (shiftId) {
      setEndingShifts(prev => ({ ...prev, [shiftId]: { ...prev[shiftId], isProcessing: true, photo: file } }));
    } else {
      setPhoto(file);
      setIsProcessing(true);
    }
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await fetch("/api/shift/ocr", { // Simplified upload route
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      if (shiftId) {
        setEndingShifts(prev => ({ ...prev, [shiftId]: { ...prev[shiftId], imageUrl: data.image_url, isProcessing: false } }));
      } else {
        setImageUrl(data.image_url || "");
        setIsProcessing(false);
      }
    } catch (err: any) {
      toast.error(err.message);
      if (shiftId) {
        setEndingShifts(prev => ({ ...prev, [shiftId]: { ...prev[shiftId], isProcessing: false } }));
      } else {
        setIsProcessing(false);
      }
    }
  };

  const handleStartShift = async () => {
    if (!regNumber) {
      toast.error("Please provide a registration number");
      return;
    }
    
    setIsProcessing(true);
    try {
      const gps = await getGps();
      setGpsLoc(gps);

      const res = await fetch("/api/shift/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reg_number: regNumber, 
          lat: gps.lat, 
          lng: gps.lng,
          image_url: imageUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.alert) {
        toast.warning(data.alert, { duration: 5000 });
      } else {
        toast.success("Shift started successfully");
      }
      
      setActiveShifts(prev => [data.shift, ...prev]);
      setEndingShifts(prev => ({ ...prev, [data.shift.id]: { photo: null, regNumber: "", imageUrl: "", isProcessing: false } }));
      resetFlow();
      setIsStartingNew(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // REVISED FLOW: Since prompt says "POST /api/shift/start -> upload image + OCR + create log", 
  // we won't call OCR separately. We capture, user clicks start, then it does everything.
  // BUT the prompt also says: "Shows extracted reg → editable input field in case wrong → Tap confirm".
  // This implies TWO API calls: 1 for OCR, 1 for Confirm.
  // I will stick to my `handleCapture` calling `/api/shift/ocr`, and `handleStartShift` calling `/api/shift/start`.

  const handleEndShift = async (shiftId: string) => {
    const endData = endingShifts[shiftId];
    if (!endData?.regNumber) {
      toast.error("Please confirm vehicle registration");
      return;
    }

    setEndingShifts(prev => ({ ...prev, [shiftId]: { ...prev[shiftId], isProcessing: true } }));
    try {
      const gps = await getGps();
      
      const res = await fetch("/api/shift/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: shiftId,
          reg_number: endData.regNumber,
          lat: gps.lat,
          lng: gps.lng,
          image_url: endData.imageUrl
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }

      toast.success("Shift completed!");
      setActiveShifts(prev => prev.filter(s => s.id !== shiftId));
      setEndingShifts(prev => {
        const next = { ...prev };
        delete next[shiftId];
        return next;
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEndingShifts(prev => ({ ...prev, [shiftId]: { ...prev[shiftId], isProcessing: false } }));
    }
  };

  const resetFlow = () => {
    setPhoto(null);
    setRegNumber("");
    setImageUrl("");
  };

  const logout = async () => {
    await fetch("/api/supervisor/login", { method: "DELETE" });
    router.push("/supervisor");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-safe">
      {/* Header */}
      <header className="bg-blue-600 px-6 py-5 rounded-b-3xl shadow-md text-white sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">Good morning, {supervisorName.split(' ')[0]}</h1>
          <div className="flex items-center gap-1.5 text-blue-100 text-sm mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{supervisorUc}</span>
            <span className="opacity-50">·</span>
            <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <button onClick={logout} className="p-2 bg-blue-700/50 rounded-full hover:bg-blue-700 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 px-5 py-6 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Vehicles</h2>
            <Badge className="bg-blue-100 text-blue-600 border-blue-200">{activeShifts.length}</Badge>
          </div>
          
          <AnimatePresence>
            {activeShifts.map(shift => {
              const endData = endingShifts[shift.id] || { photo: null, regNumber: "", imageUrl: "", isProcessing: false };
              return (
                <motion.div 
                  key={shift.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-mono text-lg font-bold text-slate-800 dark:text-white leading-tight">{shift.vehicle.reg_number}</p>
                        <p className="text-xs text-slate-500">Started {new Date(shift.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <ShiftTimer startTime={shift.start_time} className="text-blue-600 font-bold" />
                  </div>

                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-4">
                    <p className="text-xs text-center text-slate-400 font-medium uppercase tracking-wider">Verification to end shift</p>
                    <ShiftCamera 
                      onCapture={(file) => handleCapture(file, shift.id)} 
                      onClear={() => setEndingShifts(prev => ({ ...prev, [shift.id]: { ...prev[shift.id], photo: null, imageUrl: "" } }))} 
                    />
                    
                    {endData.imageUrl && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500 ml-1">Confirm Registration</Label>
                          <Input 
                            value={endData.regNumber}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndingShifts(prev => ({ ...prev, [shift.id]: { ...prev[shift.id], regNumber: e.target.value.toUpperCase() } }))}
                            placeholder="e.g. GS-1234"
                            className="h-12 rounded-xl font-mono text-lg font-bold uppercase"
                          />
                        </div>
                        <Button 
                          onClick={() => handleEndShift(shift.id)}
                          disabled={endData.isProcessing || !endData.regNumber}
                          variant="destructive"
                          className="w-full h-12 rounded-xl text-base font-bold gap-2 shadow-lg shadow-red-500/20"
                        >
                          {endData.isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <StopCircle className="w-5 h-5" />}
                          End Shift
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {activeShifts.length === 0 && !isStartingNew && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Truck className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No active shifts running.</p>
            </div>
          )}
        </div>

        <div className="pt-4">
          {!isStartingNew ? (
            <Button 
              onClick={() => setIsStartingNew(true)}
              className="w-full h-16 rounded-2xl text-lg font-bold gap-3 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20"
            >
              <Plus className="w-6 h-6" />
              Start New Vehicle
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-blue-200 dark:border-blue-900/30 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Log</h2>
                <Button variant="ghost" size="sm" onClick={() => { setIsStartingNew(false); resetFlow(); }} className="text-slate-400">Cancel</Button>
              </div>

              <ShiftCamera onCapture={handleCapture} onClear={resetFlow} />

              {imageUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 ml-1">Vehicle Number</Label>
                    <Input 
                      value={regNumber} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegNumber(e.target.value.toUpperCase())} 
                      placeholder="Enter Registration"
                      className="h-14 rounded-xl font-mono text-xl font-bold uppercase bg-slate-50 dark:bg-slate-800 border-slate-200"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleStartShift}
                    disabled={isProcessing || !regNumber}
                    className="w-full h-14 rounded-2xl text-lg font-bold gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                  >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />}
                    Confirm & Start
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

import { CheckCircle2, Plus, Truck, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
