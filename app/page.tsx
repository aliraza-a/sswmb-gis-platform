"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, MapPin, Layers, BarChart3, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Layers,
    title: "Multi-layer GIS Mapping",
    desc: "UC boundaries, routes, bins and GTS on one map",
  },
  {
    icon: BarChart3,
    title: "Operational Dashboard",
    desc: "Real-time overview of all 37 UCs in Korangi",
  },
  {
    icon: FileText,
    title: "Printable Reports",
    desc: "Generate field-ready UC summaries instantly",
  },
  {
    icon: MapPin,
    title: "Vehicle Tracking",
    desc: "All vehicles and routes per Union Council",
  },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    // placeholder — auth later
    await new Promise((r) => setTimeout(r, 1000));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative bg-slate-900 dark:bg-slate-950 flex-col justify-between p-12 overflow-hidden"
      >
        {/* background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-size-[32px_32px]" />
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/20 via-transparent to-emerald-600/10" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-tight">
                SSWMB
              </div>
              <div className="text-slate-400 text-xs">GIS Mapping Platform</div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-slate-400 border-slate-700 mt-2"
          >
            SWEEP Project — Korangi District
          </Badge>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl font-bold text-white leading-tight mb-4"
          >
            Waste Collection
            <br />
            <span className="text-blue-400">Mapped & Managed</span>
          </motion.h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            A unified GIS platform for monitoring all 37 Union Councils across
            Korangi District — routes, vehicles, bins, and transfer stations in
            one place.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">
                    {f.title}
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-slate-600 text-xs">
          Sindh Solid Waste Management Board © 2026
        </div>
      </motion.div>

      {/* ── RIGHT PANEL — LOGIN FORM ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full lg:w-1/2 flex items-center justify-center p-6"
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">SSWMB GIS Platform</span>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to access the GIS dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ali@sswmb.gov.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-11 mt-2"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  "Sign In"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Access restricted to authorized SSWMB personnel only
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
