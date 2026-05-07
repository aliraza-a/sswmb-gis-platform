"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface VehicleInputProps {
  value: string;
  onChange: (val: string) => void;
  isValidated?: boolean;
  error?: string;
}

export default function VehicleInput({ value, onChange, isValidated, error }: VehicleInputProps) {
  return (
    <div className="space-y-2 w-full">
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Registration Number
      </Label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="e.g. GS-B-054"
          className={`h-14 text-center text-xl font-bold font-mono tracking-widest rounded-xl
            ${error ? "border-red-500 focus-visible:ring-red-500" : ""}
            ${isValidated && !error ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : ""}
          `}
        />
        {isValidated && !error && (
          <CheckCircle2 className="absolute right-4 top-4 w-6 h-6 text-emerald-500" />
        )}
        {error && (
          <AlertCircle className="absolute right-4 top-4 w-6 h-6 text-red-500" />
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1 font-medium text-center">{error}</p>
      )}
    </div>
  );
}
