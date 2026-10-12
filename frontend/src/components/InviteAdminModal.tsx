"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserPlus,
  X,
  Mail,
  User as UserIcon,
  Phone,
  ShieldAlert,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { api, InviteUserData } from "@/lib/api";
import { showToast } from "@/components/Toast";
import CustomSelect, { SelectOption } from "@/components/CustomSelect";

const VIEW_SCOPE_OPTIONS: SelectOption[] = [
  { label: "ALL — View all members", value: "ALL" },
  { label: "OWN — View only own members", value: "OWN" },
];

const inviteSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  contactNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
  canAddMember: z.boolean(),
  canDownloadCard: z.boolean(),
  role: z.enum(["ADMIN", "SUPERADMIN"]),
  viewScope: z.enum(["ALL", "OWN"]),
});

export type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteAdminModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteAdminModalProps) {
  const [invitedCredentials, setInvitedCredentials] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isValid, errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      contactNumber: "",
      canAddMember: true,
      canDownloadCard: true,
      role: "ADMIN",
      viewScope: "ALL",
    },
  });

  const handleClose = () => {
    setInvitedCredentials(null);
    setInviteError(null);
    reset();
    onClose();
  };

  const onSubmit = async (formData: InviteFormData) => {
    setInviteError(null);
    setIsSubmitting(true);
    try {
      const payload: InviteUserData = {
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber ? formData.contactNumber : null,
        role: formData.role,
        canAddMember: formData.canAddMember,
        canDownloadCard: formData.canDownloadCard,
        viewScope: formData.viewScope,
      };

      const res = await api.inviteUser(payload);
      setInvitedCredentials({
        email: res.data.user.email,
        temporaryPassword: res.data.temporaryPassword,
      });
      showToast("Admin invited successfully! Save the temporary credentials.", "success");
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as Error;
      setInviteError(error.message || "Failed to invite user");
      showToast(error.message || "Failed to invite admin.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!invitedCredentials) return;
    const textToCopy = `Friends of Education Admin Access\nEmail: ${invitedCredentials.email}\nTemporary Password: ${invitedCredentials.temporaryPassword}\nLogin Portal: ${window.location.origin}/login`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      showToast("Credentials copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast("Failed to copy credentials automatically.", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-5 w-5" />
            <h3 className="font-bold text-lg">
              {invitedCredentials ? "One-Time Credentials" : "Invite New Admin"}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {invitedCredentials ? (
            /* One-Time Credentials View */
            <div className="space-y-5">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="block font-bold text-amber-900 mb-0.5">
                    Important Security Notice:
                  </strong>
                  Please copy these credentials now. For security reasons, this password will not be shown again.
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3 font-mono text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-500 font-sans block mb-1">
                    Admin Email
                  </span>
                  <div className="font-bold text-gray-900 select-all">
                    {invitedCredentials.email}
                  </div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-500 font-sans block mb-1">
                    Temporary Password
                  </span>
                  <div className="font-bold text-orange-600 text-base select-all tracking-wider">
                    {invitedCredentials.temporaryPassword}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Credentials</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-gray-300 py-2.5 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Invite Form View */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {inviteError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-medium">
                  {inviteError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="admin@friendsofeducation.in"
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Contact Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    maxLength={10}
                    {...register("contactNumber")}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                {errors.contactNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.contactNumber.message}</p>
                )}
              </div>

              {/* View Scope */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  View Scope
                </label>
                <Controller
                  control={control}
                  name="viewScope"
                  render={({ field, fieldState }) => (
                    <CustomSelect
                      id="viewScope"
                      value={field.value}
                      onChange={(val) => field.onChange(val as "ALL" | "OWN")}
                      options={VIEW_SCOPE_OPTIONS}
                      placeholder="Select View Scope"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              {/* Custom Branded Orange Toggle Switches */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">
                  Initial Permissions
                </span>

                <label className="flex items-center justify-between cursor-pointer mb-3">
                  <span className="text-sm font-bold text-gray-700">Can Add / Edit Members</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register("canAddMember")}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F15A24]"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer mb-3">
                  <span className="text-sm font-bold text-gray-700">Can Download ID Cards</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register("canDownloadCard")}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F15A24]"></div>
                  </div>
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-gray-300 py-2 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="bg-[#F15A24] text-white px-4 py-2 rounded-md font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d94815] cursor-pointer transition-colors inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Send Invite</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
