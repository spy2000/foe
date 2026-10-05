"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Tag,
  CreditCard,
  User,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Users,
  ShieldCheck,
  FileText,
  Upload,
  RotateCcw,
  Save,
  Loader2,
  Camera,
  ArrowLeft,
} from "lucide-react";
import { api, BloodGroup, CardSettings, Member } from "@/lib/api";
import { showToast } from "@/components/Toast";
import { toInputDate } from "@/lib/utils";
import { memberFormSchema, getMemberFormSchema, type MemberFormValues } from "@/lib/schemas";
import DatePickerWithYearSelect from "@/components/DatePickerWithYearSelect";
import CustomSelect, { SelectOption } from "@/components/CustomSelect";
import StatusSelect from "@/components/StatusSelect";
import MediaDropzone from "@/components/MediaDropzone";
import StickyActionBar from "@/components/StickyActionBar";
import { useCardSettings } from "@/context/SettingsContext";

interface MemberFormProps {
  mode: "create" | "edit";
  initialMember?: Member;
  memberId?: string;
}

const RELATIONSHIP_OPTIONS: SelectOption[] = [
  { label: "Father", value: "Father" },
  { label: "Mother", value: "Mother" },
  { label: "Spouse", value: "Spouse" },
  { label: "Sibling", value: "Sibling" },
  { label: "Friend", value: "Friend" },
  { label: "Trust Office", value: "Trust Office" },
  { label: "Other", value: "Other" },
];

export default function MemberForm({ mode, initialMember, memberId }: MemberFormProps) {
  const router = useRouter();
  const { settings: globalSettings } = useCardSettings();

  // Independent loading states
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);
  const [loadingBloodGroups, setLoadingBloodGroups] = useState<boolean>(true);

  const [settings, setSettings] = useState<CardSettings | null>(globalSettings);
  const [bannerImgError, setBannerImgError] = useState<boolean>(false);

  const [nextMemberId, setNextMemberId] = useState<string>("0001");
  const [loadingNextId, setLoadingNextId] = useState<boolean>(mode === "create");

  // Local interaction states
  const [photoPreview, setPhotoPreview] = useState<string>(initialMember?.photoPath || "");
  const [stagedPhoto, setStagedPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isEdit = mode === "edit";

  const today = new Date();
  const threeMonthsFromNow = new Date(today);
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isDirty, isValid },
  } = useForm<MemberFormValues>({
    mode: "onChange",
    resolver: zodResolver(getMemberFormSchema(isEdit)),
    defaultValues: isEdit && initialMember
      ? {
          registrationNo: initialMember.registrationNo || "",
          fullName: initialMember.fullName || "",
          designation: initialMember.designation || "",
          bloodGroupId: String(initialMember.bloodGroupId || ""),
          dateOfJoining: toInputDate(initialMember.dateOfJoining) || "",
          contactNumber: initialMember.contactNumber || "",
          emailId: initialMember.emailId || "",
          emergencyContactName: initialMember.emergencyContactName || "",
          emergencyContactRelationship: initialMember.emergencyContactRelationship || "",
          emergencyContactNumber: initialMember.emergencyContactNumber || "",
          photoPath: initialMember.photoPath || "",
          issueDate: toInputDate(initialMember.issueDate) || today.toISOString().split("T")[0],
          expiryDate: toInputDate(initialMember.expiryDate) || threeMonthsFromNow.toISOString().split("T")[0],
          memberStatus: initialMember.memberStatus || "Active",
          authorisedName: initialMember.authorisedName || "",
          authorisedDesignation: initialMember.authorisedDesignation || "",
          remarks: initialMember.remarks || "",
        }
      : {
          registrationNo: "",
          fullName: "",
          designation: "",
          bloodGroupId: "",
          dateOfJoining: "", // Default to empty per instructions (requires user selection)
          contactNumber: "",
          emailId: "",
          emergencyContactName: "", // Explicitly blank
          emergencyContactRelationship: "", // Explicitly blank
          emergencyContactNumber: "", // Explicitly blank
          photoPath: "",
          issueDate: today.toISOString().split("T")[0],
          expiryDate: threeMonthsFromNow.toISOString().split("T")[0],
          memberStatus: "Active",
          authorisedName: "",
          authorisedDesignation: "",
          remarks: "",
        },
  });

  // Independent API Fetching - Blood Groups
  useEffect(() => {
    let mounted = true;
    api.getBloodGroups()
      .then((res) => {
        if (mounted && res.success && res.data) {
          setBloodGroups(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load blood groups:", err);
      })
      .finally(() => {
        if (mounted) setLoadingBloodGroups(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Sync settings with global settings or fetch if not present
  useEffect(() => {
    if (globalSettings) {
      setSettings(globalSettings);
      if (!isEdit) {
        setValue("registrationNo", globalSettings.registrationNo || "Reg. E-0040751(GBR)", { shouldValidate: true });
        setValue("authorisedName", globalSettings.defaultAuthorisedName || "Mr. Shailesh Pandey", { shouldValidate: true });
        setValue("authorisedDesignation", globalSettings.defaultAuthorisedDesignation || "Founder and President", { shouldValidate: true });
      }
    } else {
      let mounted = true;
      api.getSettings()
        .then((res) => {
          if (mounted && res.success && res.data) {
            const s = res.data;
            setSettings(s);
            if (!isEdit) {
              setValue("registrationNo", s.registrationNo || "Reg. E-0040751(GBR)", { shouldValidate: true });
              setValue("authorisedName", s.defaultAuthorisedName || "Mr. Shailesh Pandey", { shouldValidate: true });
              setValue("authorisedDesignation", s.defaultAuthorisedDesignation || "Founder and President", { shouldValidate: true });
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load card settings:", err);
        });

      return () => {
        mounted = false;
      };
    }
  }, [globalSettings, isEdit, setValue]);

  // Independent API Fetching - Next Member ID (only in create mode)
  useEffect(() => {
    if (!isEdit) {
      let mounted = true;
      api.getNextMemberId()
        .then((res) => {
          if (mounted && res.success && res.data) {
            setNextMemberId(res.data.nextMemberId);
          }
        })
        .catch((err) => {
          console.error("Failed to load next member id:", err);
        })
        .finally(() => {
          if (mounted) setLoadingNextId(false);
        });

      return () => {
        mounted = false;
      };
    }
  }, [isEdit]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (stagedPhoto?.previewUrl && stagedPhoto.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(stagedPhoto.previewUrl);
      }
    };
  }, [stagedPhoto]);

  // Deferred Photo Selection: Stages local File and Object URL preview
  const handlePhotoSelect = (file: File, previewUrl: string) => {
    if (stagedPhoto?.previewUrl && stagedPhoto.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(stagedPhoto.previewUrl);
    }
    setStagedPhoto({ file, previewUrl });
    setPhotoPreview(previewUrl);
    setValue("photoPath", previewUrl, { shouldValidate: true, shouldDirty: true });
    showToast("Photograph selected for upload on save", "info");
  };

  // Zero-network Discard: Reverts locally to cached initial data
  const onResetForm = () => {
    if (stagedPhoto?.previewUrl && stagedPhoto.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(stagedPhoto.previewUrl);
    }
    setStagedPhoto(null);

    if (isEdit && initialMember) {
      reset({
        registrationNo: initialMember.registrationNo || "",
        fullName: initialMember.fullName || "",
        designation: initialMember.designation || "",
        bloodGroupId: String(initialMember.bloodGroupId || ""),
        dateOfJoining: toInputDate(initialMember.dateOfJoining) || "",
        contactNumber: initialMember.contactNumber || "",
        emailId: initialMember.emailId || "",
        emergencyContactName: initialMember.emergencyContactName || "",
        emergencyContactRelationship: initialMember.emergencyContactRelationship || "",
        emergencyContactNumber: initialMember.emergencyContactNumber || "",
        photoPath: initialMember.photoPath || "",
        issueDate: toInputDate(initialMember.issueDate) || toInputDate(new Date()),
        expiryDate: toInputDate(initialMember.expiryDate) || toInputDate(new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)),
        memberStatus: initialMember.memberStatus || "Active",
        authorisedName: initialMember.authorisedName || "",
        authorisedDesignation: initialMember.authorisedDesignation || "",
        remarks: initialMember.remarks || "",
      });
      setPhotoPreview(initialMember.photoPath || "");
      showToast("Reverted form to original values", "info");
    } else {
      reset({
        registrationNo: settings?.registrationNo || "Reg. E-0040751(GBR)",
        fullName: "",
        designation: "",
        bloodGroupId: "",
        dateOfJoining: "",
        contactNumber: "",
        emailId: "",
        emergencyContactName: "",
        emergencyContactRelationship: "",
        emergencyContactNumber: "",
        photoPath: "",
        issueDate: toInputDate(new Date()),
        expiryDate: toInputDate(new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)),
        memberStatus: "Active",
        authorisedName: settings?.defaultAuthorisedName || "Mr. Shailesh Pandey",
        authorisedDesignation: settings?.defaultAuthorisedDesignation || "Founder and President",
        remarks: "",
      });
      setPhotoPreview("");
      showToast("Form cleared to defaults", "info");
    }
  };

  const onSubmit = async (values: MemberFormValues) => {
    try {
      setSubmitting(true);
      let finalPhotoPath = values.photoPath;

      // Deferred Upload: Only execute upload upon clicking Save/Update
      if (stagedPhoto) {
        showToast("Uploading photograph...", "info");
        finalPhotoPath = await api.uploadImage(stagedPhoto.file, "foe/members");
      }

      const payload = {
        ...values,
        photoPath: finalPhotoPath,
        bloodGroupId: Number(values.bloodGroupId),
      };

      if (isEdit && memberId) {
        const res = await api.updateMember(memberId, payload);
        if (res.success && res.data) {
          if (stagedPhoto?.previewUrl && stagedPhoto.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(stagedPhoto.previewUrl);
          }
          setStagedPhoto(null);
          showToast("Member updated successfully!", "success");
          router.push(`/members/${memberId}/preview`);
        }
      } else {
        const res = await api.createMember(payload);
        if (res.success && res.data) {
          if (stagedPhoto?.previewUrl && stagedPhoto.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(stagedPhoto.previewUrl);
          }
          setStagedPhoto(null);
          showToast("Member registered successfully!", "success");
          router.push(`/members/${res.data.id}/preview`);
        }
      }
    } catch (err) {
      console.error(err);
      showToast((err as Error).message || `Failed to ${isEdit ? "update" : "register"} member`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const bloodGroupOptions: SelectOption[] = bloodGroups.map((bg) => ({
    label: bg.bloodGroup,
    value: String(bg.id),
  }));

  const trustName = settings?.trustName || "FRIENDS OF EDUCATION";
  const trustSubtitle = settings?.trustSubtitle || "CHARITABLE TRUST";
  const registrationNo = settings?.registrationNo || "Reg. E-0040751(GBR)";
  const logoUrl = settings?.logoUrl || "/logo.png";

  const headerTitle = isEdit && initialMember
    ? `Edit Member Details: ${initialMember.fullName} (${initialMember.memberId || `#${initialMember.id}`})`
    : "Member ID Card Form";

  const headerSubtitle = isEdit
    ? "Update member details and ID card parameters"
    : "Enter member details to generate ID card";

  return (
    <div className="mx-auto max-w-5xl rounded-2xl sm:rounded-3xl border border-gray-200/80 bg-white shadow-xl overflow-hidden relative">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-[#F15A24] via-[#EA580C] to-[#E65100] px-4 py-4 sm:px-6 sm:py-5 text-white gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-12 sm:h-12 sm:w-14 items-center justify-center rounded-xl bg-white/10 p-1 backdrop-blur-sm overflow-hidden relative shrink-0">
            {!bannerImgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={trustName}
                className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                onError={() => setBannerImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-black text-white text-xs tracking-tight">
                FOE
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold tracking-wide text-white uppercase drop-shadow-sm truncate">
              {trustName}
            </h1>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-widest text-orange-100 truncate">
              {trustSubtitle}
            </p>
            <div className="mt-0.5 inline-block rounded-full bg-black/30 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white">
              {registrationNo}
            </div>
          </div>
        </div>

        <div className="text-center sm:text-right shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{headerTitle}</h2>
          <p className="text-xs text-orange-100 mt-0.5">{headerSubtitle}</p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-3.5 sm:p-6 space-y-5 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Section 1: Personal Information */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200/70">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#F15A24]">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Personal Information</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Member ID (Read-only) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Member ID
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Tag className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        disabled
                        value={
                          isEdit && initialMember
                            ? initialMember.memberId || `#${initialMember.id}`
                            : loadingNextId
                            ? "Loading ID..."
                            : `Auto-generated (e.g. ${nextMemberId})`
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-100 pl-9 pr-3 py-2.5 text-xs font-bold text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Registration Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <input
                        {...register("registrationNo")}
                        placeholder="Enter registration number"
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                    {errors.registrationNo && (
                      <p className="mt-1 text-xs text-red-500">{errors.registrationNo.message}</p>
                    )}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      {...register("fullName")}
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <input
                      {...register("designation")}
                      placeholder="Enter designation (e.g. Founder and President)"
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  {errors.designation && (
                    <p className="mt-1 text-xs text-red-500">{errors.designation.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Blood Group with CustomSelect */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="bloodGroupId"
                      render={({ field, fieldState }) => (
                        <CustomSelect
                          id="bloodGroupId"
                          value={field.value}
                          onChange={(val) => field.onChange(String(val))}
                          options={bloodGroupOptions}
                          placeholder={loadingBloodGroups ? "Loading groups..." : "Select Blood Group"}
                          disabled={loadingBloodGroups}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    {errors.bloodGroupId && (
                      <p className="mt-1 text-xs text-red-500">{errors.bloodGroupId.message}</p>
                    )}
                  </div>

                  {/* Date of Joining with DatePickerWithYearSelect */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Date of Joining <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="dateOfJoining"
                      render={({ field, fieldState }) => (
                        <DatePickerWithYearSelect
                          id="dateOfJoining"
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          placeholder="Select joining date"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    {errors.dateOfJoining && (
                      <p className="mt-1 text-xs text-red-500">{errors.dateOfJoining.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200/70">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#F15A24]">
                  <Phone className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Contact Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      {...register("contactNumber")}
                      placeholder="Enter mobile number (+91...)"
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.contactNumber.message}</p>
                  )}
                </div>

                {/* Email ID */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      {...register("emailId")}
                      placeholder="Enter email address"
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  {errors.emailId && (
                    <p className="mt-1 text-xs text-red-500">{errors.emailId.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Card Validity & Status */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200/70">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#F15A24]">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Card Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Issue Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="issueDate"
                    render={({ field, fieldState }) => (
                      <DatePickerWithYearSelect
                        id="issueDate"
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        placeholder="Issue Date"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  {errors.issueDate && (
                    <p className="mt-1 text-xs text-red-500">{errors.issueDate.message}</p>
                  )}
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="expiryDate"
                    render={({ field, fieldState }) => (
                      <DatePickerWithYearSelect
                        id="expiryDate"
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        placeholder="Expiry Date"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  {errors.expiryDate && (
                    <p className="mt-1 text-xs text-red-500">{errors.expiryDate.message}</p>
                  )}
                </div>

                {/* Member Status (Custom StatusSelect with active/inactive pills) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Member Status <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="memberStatus"
                    render={({ field, fieldState }) => (
                      <StatusSelect
                        id="memberStatus"
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  {errors.memberStatus && (
                    <p className="mt-1 text-xs text-red-500">{errors.memberStatus.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Section 4: Photograph Upload (MediaDropzone) */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200/70">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#F15A24]">
                  <Camera className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Photograph</h3>
              </div>

              <div className="space-y-2">
                <MediaDropzone
                  id="member-photo-dropzone"
                  label="Passport Size Photo (300 x 400)"
                  previewUrl={photoPreview}
                  fallbackSrc="/sample-member.jpg"
                  aspectRatio="avatar"
                  recommendedText="Passport size photo (JPG, PNG, WebP). Max 2MB."
                  onFileSelect={handlePhotoSelect}
                  disabled={submitting}
                />
                <input type="hidden" {...register("photoPath")} />
                {errors.photoPath && (
                  <p className="text-xs font-semibold text-red-500 mt-1">{errors.photoPath.message}</p>
                )}
              </div>
            </div>

            {/* Section 5: Emergency Contact Information (Blank by default) */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200/70">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#F15A24]">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Emergency Contact Information</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Emergency Contact Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Emergency Contact Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        {...register("emergencyContactName")}
                        placeholder="Enter contact person name"
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                    {errors.emergencyContactName && (
                      <p className="mt-1 text-xs text-red-500">{errors.emergencyContactName.message}</p>
                    )}
                  </div>

                  {/* Relationship with CustomSelect */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Relationship <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="emergencyContactRelationship"
                      render={({ field, fieldState }) => (
                        <CustomSelect
                          id="emergencyContactRelationship"
                          value={field.value}
                          onChange={(val) => field.onChange(String(val))}
                          options={RELATIONSHIP_OPTIONS}
                          placeholder="Select Relationship"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    {errors.emergencyContactRelationship && (
                      <p className="mt-1 text-xs text-red-500">{errors.emergencyContactRelationship.message}</p>
                    )}
                  </div>
                </div>

                {/* Emergency Contact Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emergency Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      {...register("emergencyContactNumber")}
                      placeholder="Enter emergency number (e.g. +91 9136643813)"
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  {errors.emergencyContactNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.emergencyContactNumber.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 6: Authorisation (Pre-fills from active settings) */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200/70">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#F15A24]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Authorisation</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Authorised By (Name) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Authorised By (Name) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      {...register("authorisedName")}
                      placeholder="Enter authorised name"
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  {errors.authorisedName && (
                    <p className="mt-1 text-xs text-red-500">{errors.authorisedName.message}</p>
                  )}
                </div>

                {/* Authorised By (Designation) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Authorised By (Designation) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <input
                      {...register("authorisedDesignation")}
                      placeholder="Enter designation"
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  {errors.authorisedDesignation && (
                    <p className="mt-1 text-xs text-red-500">{errors.authorisedDesignation.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Additional Information */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/70">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#F15A24]">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Additional Information</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows={2}
              {...register("remarks")}
              placeholder="Enter any additional notes or remarks"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 focus:border-[#F15A24] focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* Responsive Sticky Action Bar */}
        <StickyActionBar
          isDirty={isDirty}
          isValid={isValid}
          isSubmitting={submitting}
          submitLabel={isEdit ? "Update Member Details" : "Save Member Details"}
          submittingLabel={isEdit ? "Updating..." : "Saving..."}
          onCancel={() => router.push(isEdit && memberId ? `/members/${memberId}/preview` : "/members")}
          cancelLabel="Cancel"
          onReset={onResetForm}
          resetLabel={isEdit ? "Revert Changes" : "Reset Form"}
          unsavedText="You have unsaved changes"
          savedText="Member details are saved"
          className="-mx-3.5 sm:-mx-6 -mb-3.5 sm:-mb-6 rounded-b-2xl sm:rounded-b-3xl"
        />
      </form>
    </div>
  );
}
