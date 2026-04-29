"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Truck,
  Building2,
  LayoutDashboard,
  FileText,
  Settings,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MapPin, label: "GIS Map", href: "/dashboard" },
  { icon: FileText, label: "Reports", href: "/dashboard/reports" },
  { icon: Truck, label: "Vehicles", href: "/dashboard/vehicles" },
  { icon: Building2, label: "Union Councils", href: "/dashboard/ucs" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [ucs, setUcs] = useState<{ uc_number: number; label: string; status: string }[]>([]);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUc = searchParams.get("uc") || "1";

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("uc").select("uc_number, name, status").order("uc_number");
      if (data && data.length > 0) {
        setUcs(data.map(d => ({ uc_number: d.uc_number, label: `UC-${d.uc_number} ${d.name || ''}`.trim(), status: d.status })));
      } else {
        setUcs([{ uc_number: 1, label: "No UCs found", status: "pending" }]);
      }
    }
    load();
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative h-screen bg-card border-r border-border flex flex-col shrink-0 z-20 md:flex"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 h-16 border-b border-border overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="font-bold text-sm leading-tight">SSWMB GIS</div>
                <div className="text-xs text-muted-foreground">
                  Korangi District
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 mt-4 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors z-30 shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>

        {/* Nav */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group text-left"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-sm text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-4 mt-6"
            >
              <Separator className="mb-4" />
              <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                Progress
              </div>
              <div className="space-y-2">
                {ucs.map((uc) => {
                  const isActive = currentUc === String(uc.uc_number);
                  return (
                    <button
                      key={uc.label}
                      onClick={() => router.push(`/dashboard?uc=${uc.uc_number}`)}
                      className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${isActive ? 'bg-accent border border-border' : 'hover:bg-accent/50'}`}
                    >
                      <span className={`text-xs truncate ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {uc.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ml-2 shrink-0 ${
                          uc.status === "in_progress"
                            ? "border-amber-500/50 text-amber-500"
                            : uc.status === "complete"
                            ? "border-emerald-500/50 text-emerald-500"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {uc.status === "in_progress" ? "Active" : uc.status === "complete" ? "Complete" : "Pending"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </ScrollArea>

        {/* Footer — theme toggle + user */}
        <div className="p-3 border-t border-border space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full justify-start gap-3 px-3"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 shrink-0" />
                )}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm"
                    >
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Toggle Theme</TooltipContent>
            )}
          </Tooltip>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                AR
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium truncate">Ali Raza</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  GIS Mapping Officer
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
