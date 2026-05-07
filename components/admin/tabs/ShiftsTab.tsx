"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, AlertTriangle, CheckCircle2, Search, Pencil, Image as ImageIcon, MapPin, Truck, History, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function ShiftsTab() {
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [shifts, setShifts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShiftsAndAlerts = async () => {
    try {
      const res = await fetch("/api/shifts");
      const data = await res.json();
      setShifts(data.shifts || []);
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load shifts data");
    }
  };

  const fetchSupervisorsAndUcs = async () => {
    const { data: sData } = await supabase.from("supervisors").select("*, uc(name, uc_number)");
    const { data: uData } = await supabase.from("uc").select("id, uc_number, name");
    setSupervisors(sData || []);
    setUcs(uData || []);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchShiftsAndAlerts(), fetchSupervisorsAndUcs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resolveAlert = async (id: string) => {
    try {
      const res = await fetch("/api/alerts/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: id })
      });
      if (res.ok) {
        toast.success("Alert resolved");
        fetchShiftsAndAlerts();
      }
    } catch (err) {
      toast.error("Failed to resolve alert");
    }
  };

  const activeShiftsCount = shifts.filter(s => s.status === "active").length;
  const completedTodayCount = shifts.filter(s => s.status === "complete" && new Date(s.end_time).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Fleet Monitoring</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live operation tracking and field verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadAll} variant="outline" size="sm" className="gap-2">
            <History className="w-4 h-4" /> Refresh Data
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border pb-px">
        {["overview", "logs", "alerts", "supervisors"].map(t => (
          <button
            key={t}
            onClick={() => setActiveSubTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeSubTab === t 
                ? "border-primary text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          {activeSubTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Active Vehicles</p>
                    <p className="text-2xl font-bold">{activeShiftsCount}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(activeShiftsCount / (shifts.length || 1)) * 100}%` }} className="bg-blue-500 h-full" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Logs (Today)</p>
                    <p className="text-2xl font-bold">{completedTodayCount}</p>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                  <History className="w-3 h-3" /> Successfully Archived
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Critical Alerts</p>
                    <p className="text-2xl font-bold">{alerts.length}</p>
                  </div>
                </div>
                <Badge variant="destructive" className="animate-pulse">Action Required</Badge>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Supervisors</p>
                    <p className="text-2xl font-bold">{supervisors.length}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Assigned to {ucs.length} UC Clusters</p>
              </motion.div>
            </div>
          )}

          {activeSubTab === "logs" && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supervisor Detail</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region (UC)</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vehicle ID</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temporal Data</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational Status</th>
                    <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Visual Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(s => (
                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{s.supervisor?.name || "Unknown"}</div>
                        <div className="text-xs text-slate-500 font-mono">{s.supervisor?.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-blue-600 dark:text-blue-400">UC-{s.uc?.uc_number}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-medium">{s.uc?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{s.vehicle?.reg_number || "NO-REG"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-slate-600 dark:text-slate-400">{new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-slate-300">→</span>
                            <span className="text-slate-600 dark:text-slate-400">{s.end_time ? new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE'}</span>
                          </div>
                          {s.duration && (
                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 ml-3">
                              <Clock className="w-3 h-3" /> {s.duration}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={s.status === 'active' ? 'bg-blue-500/10 text-blue-500 border-blue-200 hover:bg-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-200 hover:bg-emerald-500/20'}>
                          <div className="flex items-center gap-1.5 capitalize">
                            <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                            {s.status}
                          </div>
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          {[
                            { url: s.start_image_url, label: "Start Verification" },
                            { url: s.end_image_url, label: "End Verification" }
                          ].map((img, i) => img.url ? (
                            <Dialog key={i}>
                              <DialogTrigger asChild>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative group">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                    <ImageIcon className="w-4 h-4 text-white" />
                                  </div>
                                </motion.button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none">
                                <div className="relative group bg-slate-950/90 backdrop-blur-xl p-4 rounded-3xl">
                                  <div className="absolute top-8 left-8 z-10">
                                    <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white px-3 py-1 text-xs">
                                      {img.label} · {s.vehicle?.reg_number}
                                    </Badge>
                                  </div>
                                  <img src={img.url} alt="Verification" className="w-full h-auto rounded-2xl shadow-2xl" />
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <div key={i} className="w-10 h-10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-300">
                               <ImageIcon className="w-4 h-4" />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === "alerts" && (
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No open alerts! 🎉</div>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-600 dark:text-red-400">{a.type.replace('_', ' ').toUpperCase()}</h4>
                        <p className="text-sm text-muted-foreground">{a.message}</p>
                      </div>
                    </div>
                    <Button onClick={() => resolveAlert(a.id)} variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white">
                      Resolve
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === "supervisors" && (
            <div className="space-y-6">
               {/* Simplified Supervisor Table */}
               <div className="border border-border rounded-2xl overflow-hidden bg-card">
                 <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Phone</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">UC</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisors.map(s => (
                        <tr key={s.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                          <td className="px-4 py-3 font-medium">{s.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                          <td className="px-4 py-3 text-blue-500 font-medium">{s.uc ? `UC-${s.uc.uc_number}` : 'Unassigned'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={s.status === 'active' ? 'text-emerald-500 border-emerald-200' : 'text-red-500 border-red-200'}>
                              {s.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
