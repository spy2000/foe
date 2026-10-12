"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Eye, EyeOff, Loader2, X, CheckCircle2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { showToast } from "@/components/Toast";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least 1 special character"),
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isValid, isSubmitting, errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword", "");

  // Reset form when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      reset();
      setServerError(null);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isOpen, reset]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setServerError(null);
      await api.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showToast("Password updated successfully!", "success");
      reset();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setServerError(error.message || "Failed to update password. Please check your current password.");
      showToast(error.message || "Failed to update password.", "error");
    }
  };

  const rules = [
    { label: "At least 8 characters", valid: newPasswordValue.length >= 8 },
    { label: "At least 1 uppercase letter (A-Z)", valid: /[A-Z]/.test(newPasswordValue) },
    { label: "At least 1 number (0-9)", valid: /[0-9]/.test(newPasswordValue) },
    {
      label: "At least 1 special character (!@#$...)",
      valid: /[^A-Za-z0-9]/.test(newPasswordValue),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-[#F15A24]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Change Password</h2>
              <p className="text-xs text-gray-500">Update your account credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {serverError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
              {serverError}
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                {...register("currentPassword")}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-[#F15A24] transition-colors z-10"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                {...register("newPassword")}
                placeholder="Enter new strong password"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-[#F15A24] transition-colors z-10"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Password Requirements Checklist */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
              Security Requirements
            </span>
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <CheckCircle2
                  className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                    rule.valid ? "text-emerald-500" : "text-gray-300"
                  }`}
                />
                <span
                  className={`transition-colors ${
                    rule.valid ? "text-emerald-700 font-medium" : "text-gray-500"
                  }`}
                >
                  {rule.label}
                </span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-[#F15A24] text-white px-5 py-2 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d94815] cursor-pointer transition-colors shadow-md shadow-orange-500/20 inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
