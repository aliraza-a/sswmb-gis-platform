"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Building2, Truck, MapPin, X, AlertTriangle, Clock, Layers } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: string, id?: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }

    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);

      // Search across multiple entities
      const [
        { data: ucs },
        { data: vehicles }
      ] = await Promise.all([
        supabase.from("uc").select("id, uc_number, name").ilike("name", `%${query}%`),
        supabase.from("vehicle").select("id, reg_number").ilike("reg_number", `%${query}%`)
      ]);

      const formattedResults = [
        ...(ucs || []).map(u => ({ id: u.id, label: `UC-${u.uc_number} ${u.name}`, type: "ucs", icon: Building2 })),
        ...(vehicles || []).map(v => ({ id: v.id, label: v.reg_number, type: "vehicles", icon: Truck }))
      ];

      setResults(formattedResults);
      setLoading(false);
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Handle escape key
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-background/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search UCs, vehicles, or areas... (ESC to close)"
                className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground italic">Searching...</div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((res) => (
                    <button
                      key={`${res.type}-${res.id}`}
                      onClick={() => onSelect(res.type, res.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary hover:text-primary-foreground text-left transition-colors group"
                    >
                      <res.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground" />
                      <span className="text-sm font-medium">{res.label}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-widest opacity-50">{res.type}</span>
                    </button>
                  ))}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-8 text-center text-sm text-muted-foreground italic">No results found</div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">Type at least 2 characters to search...</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {["UC-2", "GS-B-051", "Model Colony"].map(hint => (
                      <Badge key={hint} variant="secondary" className="cursor-pointer hover:bg-accent" onClick={() => setQuery(hint)}>
                        {hint}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Badge({ children, variant, className, onClick }: any) {
  return (
    <span 
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
        variant === 'secondary' ? 'bg-secondary border-border text-secondary-foreground' : 'bg-primary border-primary text-primary-foreground'
      } ${className}`}
    >
      {children}
    </span>
  );
}
