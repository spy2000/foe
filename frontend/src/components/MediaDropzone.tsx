"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { showToast } from "./Toast";

export interface MediaDropzoneProps {
  id?: string;
  label?: string;
  previewUrl?: string | null;
  fallbackSrc?: string;
  onFileSelect: (file: File, previewUrl: string) => void;
  onClear?: () => void;
  accept?: string;
  maxSizeBytes?: number; // Defaults to 2MB
  aspectRatio?: "avatar" | "logo" | "signature" | "contain" | "cover";
  recommendedText?: string;
  disabled?: boolean;
  className?: string;
}

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

export default function MediaDropzone({
  id = "media-dropzone",
  label,
  previewUrl,
  onFileSelect,
  onClear,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  maxSizeBytes = 2 * 1024 * 1024, // 2MB
  aspectRatio = "contain",
  recommendedText = "Transparent PNG/SVG. Max 2MB.",
  disabled = false,
  className = "",
}: MediaDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    // 1. MIME / format validation
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const hasValidExtension = /\.(png|jpe?g|webp|svg)$/i.test(fileName);
    const hasValidMime = ALLOWED_MIME_TYPES.includes(fileType);

    if (!hasValidMime && !hasValidExtension) {
      showToast("Invalid file format. Allowed: PNG, JPG, WebP, SVG", "error");
      return;
    }

    // 2. Size validation (max 2MB)
    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      showToast(`File size exceeds maximum limit of ${maxMb}MB`, "error");
      return;
    }

    // 3. Generate in-memory Object URL preview without network upload
    const objectUrl = URL.createObjectURL(file);
    setImgError(false);
    onFileSelect(file, objectUrl);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    // Reset file input value so selecting the same file triggers change
    e.target.value = "";
  };

  const handleClickBrowse = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const isAvatar = aspectRatio === "avatar";

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold uppercase tracking-wider text-gray-700"
        >
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickBrowse}
        className={`group relative flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full rounded-2xl border-2 border-dashed p-4 transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-orange-500 bg-orange-50/70 ring-4 ring-orange-100 scale-[1.01]"
            : "border-gray-200 bg-gray-50/50 hover:border-orange-300 hover:bg-orange-50/20"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Preview Container */}
        <div
          className={`relative flex items-center justify-center shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-xs transition-transform group-hover:scale-102 ${
            isAvatar
              ? "w-28 h-36 sm:w-32 sm:h-40"
              : "w-24 h-16 sm:w-28 sm:h-20"
          }`}
        >
          {previewUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Media Preview"
              onError={() => setImgError(true)}
              className={
                isAvatar
                  ? "h-full w-full object-cover rounded-lg"
                  : "max-h-full max-w-full object-contain filter contrast-105"
              }
            />
          ) : previewUrl && imgError ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400 p-1">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-[9px] font-semibold text-center text-gray-500 leading-tight">
                Not Found
              </span>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400 p-1">
              <ImageIcon className="h-6 w-6 text-gray-300 group-hover:text-orange-400 transition-colors" />
              <span className="text-[10px] font-semibold text-center text-gray-400">
                No Media
              </span>
            </div>
          )}

          {/* Clear preview button if file staged and onClear provided */}
          {previewUrl && onClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 transition-transform active:scale-95"
              title="Remove media"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Controls & Description with whitespace-nowrap button */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClickBrowse();
              }}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 whitespace-nowrap shrink-0 shadow-sm transition-all active:scale-95 group-hover:border-orange-300 group-hover:text-orange-600"
            >
              <Upload className="w-4 h-4 shrink-0 text-orange-500" />
              <span>{previewUrl ? "Change Image" : "Upload Image"}</span>
            </button>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              or drag & drop
            </span>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2">
            {recommendedText}
          </p>
          <p className="text-[10px] font-medium text-orange-600/80">
            Deferred upload: Saved securely on form submit.
          </p>
        </div>
      </div>
    </div>
  );
}
