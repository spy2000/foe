"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let triggerToast: ((msg: string, type?: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = "success") {
  if (triggerToast) {
    triggerToast(message, type);
  } else {
    console.log(`[Toast ${type}]: ${message}`);
  }
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    triggerToast = (message: string, type: ToastType = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    };

    return () => {
      triggerToast = null;
    };
  }, []);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md transition-all animate-bounce-in text-white ${
            toast.type === "success"
              ? "bg-gradient-to-r from-emerald-600 to-green-600"
              : toast.type === "info"
              ? "bg-gradient-to-r from-slate-800 to-gray-900 border border-gray-700"
              : "bg-gradient-to-r from-red-600 to-rose-600"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : toast.type === "info" ? (
              <Info className="h-5 w-5 shrink-0 text-orange-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => remove(toast.id)}
            className="rounded-full p-1 hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
