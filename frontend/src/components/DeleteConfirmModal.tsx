"use client";

import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user?: { name: string } | null;
  count?: number;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  count,
  isLoading = false,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity p-4"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-[#222]">
            {count && count > 1 ? `Delete ${count} Administrators` : "Delete Administrator"}
          </h2>
          <p className="text-gray-500 text-sm">
            {count && count > 1 ? (
              <>
                Are you sure you want to delete{" "}
                <span className="font-bold">{count} selected administrators</span>? They will be removed from this directory and immediately lose access to the portal.
              </>
            ) : (
              <>
                Are you sure you want to delete{" "}
                <span className="font-bold">{user?.name || "this administrator"}</span>?{" "}
                They will be removed from this directory and immediately lose access to the portal.
              </>
            )}
          </p>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border rounded-md font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            <span>{count && count > 1 ? "Delete Selected" : "Delete Admin"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
