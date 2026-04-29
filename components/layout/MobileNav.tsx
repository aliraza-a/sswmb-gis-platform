"use client";
import { useRouter } from "next/navigation";
import { LayoutDashboard, MapPin, FileText, Truck } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MapPin, label: "Map", href: "/dashboard" },
  { icon: FileText, label: "Reports", href: "/dashboard/reports" },
  { icon: Truck, label: "Vehicles", href: "/dashboard/vehicles" },
];

export default function MobileNav() {
  const router = useRouter();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around py-2 px-4">
        {items.map((item) => (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.85 }}
            onClick={() => router.push(item.href)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </nav>
  );
}
