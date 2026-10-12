"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { showToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password rules validation
  const rules = [
    { label: "At least 8 characters", valid: newPassword.length >= 8 },
    { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(newPassword) },
    { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(newPassword) },
    { label: "One number (0-9)", valid: /[0-9]/.test(newPassword) },
    {
      label: "One special character (!@#$%...)",
      valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
    },
    {
      label: "Passwords match",
      valid: newPassword.length > 0 && newPassword === confirmPassword,
    },
  ];

  const allRulesPassed = rules.every((r) => r.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage("Please enter your current password.");
      return;
    }

    if (!allRulesPassed) {
      setErrorMessage("Please satisfy all password complexity requirements.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        showToast("Password updated successfully!", "success");
        await refreshUser();
        router.push("/members");
      } else {
        setErrorMessage(res.message || "Failed to update password.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to update password. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 mb-4">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
            Update Security Credentials
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose a strong, unique password to secure your admin account.
          </p>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white/90 p-8 shadow-xl shadow-gray-200/50 backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                <p className="font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password - Strictly required for voluntary update */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                Current Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-11 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-[#F15A24] transition-colors z-10"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                New Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create new strong password"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-11 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-[#F15A24] transition-colors z-10"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Complexity Checklist */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-2">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Password Requirements
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    {rule.valid ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    )}
                    <span
                      className={
                        rule.valid
                          ? "text-gray-900 font-medium"
                          : "text-gray-500"
                      }
                    >
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !allRulesPassed}
              className="btn-primary group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.99] cursor-pointer hover:bg-[#d94815] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password & Continue</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
