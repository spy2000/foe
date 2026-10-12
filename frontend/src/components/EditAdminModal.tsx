"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Pencil,
  X,
  Mail,
  User as UserIcon,
  Phone,
  Loader2,
} from "lucide-react";
import { api, AuthUser } from "@/lib/api";
import { showToast } from "@/components/Toast";
import CustomSelect, { SelectOption } from "@/components/CustomSelect";

const VIEW_SCOPE_OPTIONS: SelectOption[] = [
  { label: "ALL — View all members", value: "ALL" },
  { label: "OWN — View only own members", value: "OWN" },
];

const ROLE_OPTIONS: SelectOption[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "SUPERADMIN", label: "Superadmin" },
];

const editUserSchema = z.object({
  name: z.string().min(2, "Name required"),
  contactNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
  canAddMember: z.boolean(),
  canDownloadCard: z.boolean(),
  role: z.enum(["ADMIN", "SUPERADMIN"]),
  viewScope: z.enum(["ALL", "OWN"]),
  status: z.enum(["ACTIVE", "DEACTIVATED", "INVITED"]),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditAdminModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  currentUser: AuthUser | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditAdminModal({
  isOpen,
  user,
  currentUser,
  onClose,
  onSuccess,
}: EditAdminModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isValid, isDirty, errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      contactNumber: "",
      canAddMember: true,
      canDownloadCard: true,
      role: "ADMIN",
      viewScope: "ALL",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        contactNumber: user.contactNumber || "",
        role: user.role,
        canAddMember: user.canAddMember,
        canDownloadCard: user.canDownloadCard,
        viewScope: user.viewScope || "ALL",
        status: user.status,
      });
    }
  }, [user, reset]);

  if (!isOpen || !user) return null;

  const isSelf = currentUser?.id === user.id;

  const currentStatus = user.status;
  const statusOptions: SelectOption[] =
    currentStatus === "INVITED"
      ? [
          { value: "INVITED", label: "INVITED" },
          { value: "DEACTIVATED", label: "DEACTIVATED" },
        ]
      : [
          { value: "ACTIVE", label: "ACTIVE" },
          { value: "DEACTIVATED", label: "DEACTIVATED" },
        ];

  const onSubmit = async (formData: EditUserFormData) => {
    setIsSubmitting(true);
    try {
      await api.updateUser(user.id, {
        name: formData.name,
        contactNumber: formData.contactNumber ? formData.contactNumber : null,
        role: formData.role,
        canAddMember: formData.canAddMember,
        canDownloadCard: formData.canDownloadCard,
        viewScope: formData.viewScope,
        status: formData.status,
      });
      showToast("Administrator updated successfully", "success");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Failed to update administrator", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Pencil className="h-5 w-5" />
            <h3 className="font-bold text-lg">Edit Administrator</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  {...register("name")}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address (Fixed)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Contact Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  {...register("contactNumber")}
                  placeholder="9876543210 (10 digits)"
                  maxLength={10}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </div>
              {errors.contactNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.contactNumber.message}</p>
              )}
            </div>

            {/* Role & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Role
                </label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field, fieldState }) => (
                    <CustomSelect
                      id="role"
                      value={field.value}
                      onChange={(val) => field.onChange(val as "ADMIN" | "SUPERADMIN")}
                      options={ROLE_OPTIONS}
                      disabled={isSelf}
                      placeholder="Select Role"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Status
                </label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field, fieldState }) => (
                    <CustomSelect
                      id="status"
                      value={field.value}
                      onChange={(val) => field.onChange(val as "ACTIVE" | "DEACTIVATED" | "INVITED")}
                      options={statusOptions}
                      disabled={isSelf}
                      placeholder="Select Status"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
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

            {/* Feature Permissions with Custom Orange Toggles */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Feature Permissions
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
                onClick={onClose}
                className="rounded-xl border border-gray-300 py-2 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isDirty || !isValid || isSubmitting}
                className="px-4 py-2 rounded-md font-bold transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed bg-[#F15A24] text-white hover:bg-[#d94815] cursor-pointer inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
