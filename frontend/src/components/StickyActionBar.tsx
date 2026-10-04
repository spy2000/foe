"use client";

import React from "react";
import { Loader2, Save, RotateCcw, X } from "lucide-react";

export interface StickyActionBarProps {
  isDirty: boolean;
  isValid?: boolean;
  isSubmitting: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  unsavedText?: string;
  savedText?: string;
  className?: string;
}

export default function StickyActionBar({
  isDirty,
  isValid = true,
  isSubmitting,
  submitLabel = "Save Changes",
  submittingLabel = "Saving...",
  onCancel,
  cancelLabel = "Cancel",
  onReset,
  resetLabel = "Reset",
  unsavedText = "You have unsaved changes",
  savedText = "All changes saved",
  className = "",
}: StickyActionBarProps) {
  return (
    <div
      className={`sticky bottom-0 z-40 w-full max-w-full box-border left-0 right-0 overflow-hidden border-t border-gray-200 bg-white/95 px-2.5 py-2 backdrop-blur-md sm:px-6 sm:py-3.5 shadow-lg ${className}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Unsaved status text (desktop only) */}
        <div className="hidden text-xs text-gray-500 md:block truncate">
          {isDirty ? unsavedText : savedText}
        </div>

        {/* Action buttons with sub-320px responsive protection */}
        <div className="flex w-full md:w-auto items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 shrink-0">
          {/* Cancel Button */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg shrink-0 transition-colors cursor-pointer whitespace-nowrap"
              title={cancelLabel}
            >
              <X className="w-3.5 h-3.5 shrink-0 text-gray-500" />
              <span className="hidden sm:inline">{cancelLabel}</span>
            </button>
          )}

          {/* Reset / Discard Button */}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={!isDirty || isSubmitting}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              title={resetLabel}
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0 text-gray-500" />
              <span>
                <span className="sm:hidden">Reset</span>
                <span className="hidden sm:inline">{resetLabel}</span>
              </span>
            </button>
          )}

          {/* Save / Submit Button */}
          <button
            type="submit"
            disabled={!isDirty || !isValid || isSubmitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#F15A24] hover:bg-[#d94815] rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors truncate min-w-0 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="truncate">{submittingLabel}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  <span className="sm:hidden">Save</span>
                  <span className="hidden sm:inline">{submitLabel}</span>
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
