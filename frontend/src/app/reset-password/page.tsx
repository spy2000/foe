"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { showToast } from "@/components/Toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Complexity rules validation
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

    if (!token) {
      setErrorMessage("Reset token is missing or invalid. Please request a new reset link.");
      return;
    }

    if (!allRulesPassed) {
      setErrorMessage("Please satisfy all password complexity requirements.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword({
        token,
        newPassword,
      });

      if (res.success) {
        showToast("Password reset successfully! Please sign in with your new password.", "success");
        router.push("/login");
      } else {
        setErrorMessage(res.message || "Failed to reset password.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 shadow-lg shadow-orange-500/30">
            <KeyRound className="h-7 w-7 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-gray-900">
          Create New Password
        </h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Set a secure new password for your administrator account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 sm:px-10">
          {!token && (
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              No reset token detected in the URL. If you followed a link from your email, please ensure the entire link was copied.
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-11 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-[#F15A24] transition-colors z-10"
                >
                  {showPassword ? (
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
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Password Rules Checklist */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-1">
                Security Requirements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {rule.valid ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    )}
                    <span className={rule.valid ? "text-emerald-700 font-medium" : "text-gray-500"}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !allRulesPassed || !token}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving new password...</span>
                </>
              ) : (
                <>
                  <span>Save Password & Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-gray-500 hover:text-orange-600 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
