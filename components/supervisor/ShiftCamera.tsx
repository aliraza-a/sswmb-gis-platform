"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShiftCameraProps {
  onCapture: (file: File) => void;
  onClear: () => void;
}

export default function ShiftCamera({ onCapture, onClear }: ShiftCameraProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onCapture(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {!preview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-blue-300 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/40 group"
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <Camera className="w-8 h-8" />
          </div>
          <span className="font-semibold text-blue-700 dark:text-blue-400">Take Vehicle Photo</span>
        </button>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-md group">
          <img src={preview} alt="Captured vehicle" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <ImageIcon className="w-4 h-4" /> Retake
             </Button>
          </div>
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
