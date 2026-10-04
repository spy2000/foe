"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface StatusSelectProps {
  value?: "Active" | "Inactive";
  onChange: (value: "Active" | "Inactive") => void;
  disabled?: boolean;
  error?: string;
  id?: string;
}

export default function StatusSelect({
  value = "Active",
  onChange,
  disabled = false,
  error,
  id,
}: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (status: "Active" | "Inactive") => {
    onChange(status);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3.5 py-2 text-xs transition-all ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : isOpen
            ? "border-[#F15A24] ring-2 ring-orange-100"
            : "border-gray-200 hover:border-gray-300 focus:border-[#F15A24] focus:ring-2 focus:ring-orange-100"
        } ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "cursor-pointer shadow-xs"}`}
      >
        <div className="flex items-center gap-2">
          {value === "Active" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>Inactive</span>
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#F15A24]" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown Container */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl transition-all animate-in fade-in-0 zoom-in-95">
          <div className="space-y-1">
            {/* Active Option */}
            <button
              type="button"
              onClick={() => handleSelect("Active")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                value === "Active"
                  ? "bg-orange-50/70 text-[#F15A24]"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Active</span>
                </span>
              </div>
              {value === "Active" && <Check className="h-4 w-4 text-[#F15A24]" />}
            </button>

            {/* Inactive Option */}
            <button
              type="button"
              onClick={() => handleSelect("Inactive")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                value === "Inactive"
                  ? "bg-orange-50/70 text-[#F15A24]"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>Inactive</span>
                </span>
              </div>
              {value === "Inactive" && <Check className="h-4 w-4 text-[#F15A24]" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
