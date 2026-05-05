"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Truck, MapPin, CheckCircle, Clock, AlertTriangle, ArrowRight, History } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

export default function OverviewTab() {
  const [stats, setStats] = useState({
    totalUcs: 0,
    completeUcs: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    totalBins: 0,
    draftBoundaries: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [
        { data: ucs },
        { data: vehicles },
        { data: bins },
        { data: boundaries },
        { data: logs }
      ] = await Promise.all([
        supabase.from("uc").select("status"),
        supabase.from("vehicle").select("id, status"),
        supabase.from("bin").select("id"),
        supabase.from("uc_boundary").select("is_draft"),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(5)
      ]);

      setStats({
        totalUcs: ucs?.length || 0,
        completeUcs: ucs?.filter(u => u.status === 'complete').length || 0,
        totalVehicles: vehicles?.length || 0,
        activeVehicles: vehicles?.filter(v => v.status === 'active' || !v.status).length || 0,
        totalBins: bins?.length || 0,
        draftBoundaries: boundaries?.filter(b => b.is_draft).length || 0
      });
      setRecentLogs(logs || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const ucProgress = (stats.completeUcs / stats.totalUcs) * 100 || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Korangi District GIS Status & Recent Activity
        </p>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="UC Completion" 
          value={`${stats.completeUcs}/${stats.totalUcs}`}
          subtitle={`${Math.round(ucProgress)}% assigned`}
          icon={Building2}
          color="text-blue-500"
        />
        <MetricCard 
          title="Active Fleet" 
          value={`${stats.activeVehicles}/${stats.totalVehicles}`}
          subtitle="Active vehicles in rotation"
          icon={Truck}
          color="text-emerald-500"
        />
        <MetricCard 
          title="Bin Coverage" 
          value={stats.totalBins}
          subtitle="Registered collection points"
          icon={MapPin}
          color="text-purple-500"
        />
        <MetricCard 
          title="Draft Boundaries" 
          value={stats.draftBoundaries}
          subtitle="Pending live deployment"
          icon={Clock}
          color="text-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              District Coverage Progress
            </h3>
            <div className="h-4 w-full bg-accent rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${ucProgress}%` }}
                className="h-full bg-primary"
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              <span>0%</span>
              <span>{Math.round(ucProgress)}% Complete</span>
              <span>100%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-500 uppercase">Attention Needed</div>
                <p className="text-xs text-muted-foreground mt-0.5">3 UCs have overlapping boundaries that need manual review.</p>
              </div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-500 uppercase">System Status</div>
                <p className="text-xs text-muted-foreground mt-0.5">All 14 GPS tracking units are reporting correctly.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Audit Trail
            </h3>
            <Badge variant="outline" className="text-[9px]">Live</Badge>
          </div>
          <div className="flex-1 p-5 space-y-4">
            {recentLogs.length > 0 ? recentLogs.map((log, i) => (
              <div key={log.id} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs leading-relaxed">
                    <span className="font-bold">{log.admin_name}</span> {log.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Clock className="w-8 h-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground italic">No recent activity logged</p>
              </div>
            )}
          </div>
          <button className="p-3 text-[10px] text-center font-bold uppercase tracking-widest text-muted-foreground hover:bg-accent border-t border-border transition-colors">
            View Full Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-muted group-hover:bg-accent transition-colors ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-1">{title}</div>
      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{subtitle}</div>
    </div>
  );
}
