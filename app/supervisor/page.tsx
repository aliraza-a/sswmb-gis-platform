"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function SupervisorLogin() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !pin) {
      toast.error("Please enter both phone number and PIN");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/supervisor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Login failed");
      }

      toast.success("Login successful");
      router.push("/supervisor/shift");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-slate-800"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Supervisor Portal</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">SSWMB Field Management</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="03XX-XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pin">PIN Code</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 tracking-widest text-lg"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-base font-semibold shadow-md shadow-blue-500/20"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
          </Button>
        </form>
      </motion.div>

      <div className="mt-8 text-center text-xs text-slate-400">
        <p>Install this app on your home screen</p>
        <p className="mt-1">for offline access and quick entry.</p>
      </div>
    </div>
  );
}
