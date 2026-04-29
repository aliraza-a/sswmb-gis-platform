"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin, ChevronLeft, ChevronRight,
  Sun, Moon, Truck, Building2,
  LayoutDashboard, FileText, Settings,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard"          },
  { icon: FileText,        label: "Reports",         href: "/dashboard/reports"  },
  { icon: Truck,           label: "Vehicles",        href: "/dashboard/vehicles" },
  { icon: Building2,       label: "Union Councils",  href: "/dashboard/ucs"      },
  { icon: Settings,        label: "Admin",           href: "/dashboard/admin"    },
];

type UC = { uc_number: number; label: string; status: string };

export default function Sidebar() {
  const [collapsed, setCollapsed]   = useState(false);
  const [ucs, setUcs]               = useState<UC[]>([]);
  const { theme, setTheme }         = useTheme();
  const router                      = useRouter();
  const searchParams                = useSearchParams();
  const currentUc                   = searchParams.get("uc") || "1";

  useEffect(() => {
    supabase.from("uc").select("uc_number, name, status").order("uc_number")
      .then(({ data }) => {
        if (data?.length) {
          setUcs(data.map(d => ({
            uc_number: d.uc_number,
            label:     `UC-${d.uc_number} ${d.name || ""}`.trim(),
            status:    d.status,
          })));
        }
      });
  }, []);

  const complete    = ucs.filter(u => u.status === "complete").length;
  const inProgress  = ucs.filter(u => u.status === "in_progress").length;
  const pending     = ucs.filter(u => u.status === "pending").length;
  const pct         = ucs.length ? (complete / ucs.length) * 100 : 0;

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative h-screen bg-card border-r border-border flex flex-col shrink-0 z-20 hidden md:flex overflow-hidden"
      >

        {/* ── HEADER ── */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <div className="font-bold text-sm leading-tight whitespace-nowrap">SSWMB GIS</div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">Korangi District</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-14 mt-3 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors z-30 shadow-sm"
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft  className="w-3 h-3" />
          }
        </button>

        {/* ── NAV — fixed height, never scrolls ── */}
        <nav className="px-2 pt-3 pb-2 space-y-0.5 shrink-0 border-b border-border">
          {navItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors group text-left"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          ))}
        </nav>

        {/* ── PROGRESS + UC LIST — scrollable ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full min-h-0"
              >
                {/* Progress block — fixed */}
                <div className="px-4 pt-3 pb-2 shrink-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      District Progress
                    </span>
                    <span className="text-[10px] font-bold text-foreground">
                      {complete}
                      <span className="text-muted-foreground font-normal">/{ucs.length} UCs</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      {inProgress} active
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 inline-block" />
                      {pending} pending
                    </span>
                  </div>
                </div>

                <Separator />

                {/* UC list — scrollable */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                  {ucs.map((uc) => {
                    const isActive = currentUc === String(uc.uc_number);
                    const dotColor =
                      uc.status === "complete"    ? "bg-emerald-500" :
                      uc.status === "in_progress" ? "bg-amber-500"   : "bg-muted-foreground/30";

                    return (
                      <button
                        key={uc.uc_number}
                        onClick={() => router.push(`/dashboard?uc=${uc.uc_number}`)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-left ${
                          isActive
                            ? "bg-accent border border-border"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                        <span className={`text-xs truncate flex-1 ${
                          isActive ? "text-foreground font-medium" : "text-muted-foreground"
                        }`}>
                          {uc.label}
                        </span>
                        {uc.status === "in_progress" && (
                          <span className="text-[9px] text-amber-500 shrink-0 font-medium">Active</span>
                        )}
                        {uc.status === "complete" && (
                          <span className="text-[9px] text-emerald-500 shrink-0 font-medium">Done</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FOOTER ── */}
        <div className="shrink-0 p-2 border-t border-border space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full justify-start gap-3 px-3 h-8"
              >
                {theme === "dark"
                  ? <Sun  className="w-3.5 h-3.5 shrink-0" />
                  : <Moon className="w-3.5 h-3.5 shrink-0" />
                }
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs"
                    >
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Toggle Theme</TooltipContent>}
          </Tooltip>

          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-accent overflow-hidden ${collapsed ? "justify-center" : ""}`}>
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              AR
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden min-w-0"
                >
                  <div className="text-xs font-medium truncate leading-tight">Ali Raza</div>
                  <div className="text-[10px] text-muted-foreground truncate">GIS Mapping Officer</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </motion.aside>
    </TooltipProvider>
  );
}