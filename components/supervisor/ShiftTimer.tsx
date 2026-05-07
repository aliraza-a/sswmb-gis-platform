"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface ShiftTimerProps {
  startTime: string;
  className?: string;
}

export default function ShiftTimer({ startTime, className }: ShiftTimerProps) {
  const [duration, setDuration] = useState("00:00:00");

  useEffect(() => {
    const start = new Date(startTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = now - start;

      if (diff < 0) return;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setDuration(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className={`flex items-center gap-2 text-3xl font-mono font-bold text-slate-800 dark:text-white tracking-wider ${className}`}>
      <Clock className="w-6 h-6 text-blue-500 animate-pulse" />
      {duration}
    </div>
  );
}
