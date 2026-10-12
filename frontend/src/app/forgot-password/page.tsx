"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setErrorMessage(null);
    try {
      await api.forgotPassword(data.email.trim());
      setSubmittedEmail(data.email.trim());
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to send reset link. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 shadow-lg shadow-orange-500/30">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-gray-900">
          Reset Password
        </h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Enter your registered email to receive a password reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 sm:px-10">
          {submittedEmail ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Check Your Inbox</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                If an account exists for <strong className="text-gray-900">{submittedEmail}</strong>, a password reset link has been dispatched. The link expires in 15 minutes.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-orange-600 py-2.5 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-700 transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {errorMessage && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium">
                  {errorMessage}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
                >
                  Registered Email Address
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    placeholder="name@friendsofeducation.in"
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="btn-primary w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
