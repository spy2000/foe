"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  Save,
  Loader2,
  Building2,
  FileSignature,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import { showToast } from "@/components/Toast";
import { settingsFormSchema, type SettingsFormValues } from "@/lib/schemas";
import SkeletonForm from "@/components/skeletons/SkeletonForm";
import MediaDropzone from "@/components/MediaDropzone";
import StickyActionBar from "@/components/StickyActionBar";
import { useCardSettings } from "@/context/SettingsContext";

export default function SettingsPage() {
  const { updateLocalSettings } = useCardSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cached initial state for zero-network discard
  const [initialSettings, setInitialSettings] = useState<SettingsFormValues | null>(null);

  // Local staging for deferred uploads
  const [stagedLogo, setStagedLogo] = useState<{ file: File; previewUrl: string } | null>(null);
  const [stagedSignature, setStagedSignature] = useState<{ file: File; previewUrl: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<SettingsFormValues>({
    mode: "onChange",
    resolver: zodResolver(settingsFormSchema),
  });

  const currentLogo = watch("logoUrl");
  const currentSignature = watch("signatureUrl");

  useEffect(() => {
    loadSettings();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (stagedLogo?.previewUrl && stagedLogo.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(stagedLogo.previewUrl);
      }
      if (stagedSignature?.previewUrl && stagedSignature.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(stagedSignature.previewUrl);
      }
    };
  }, [stagedLogo, stagedSignature]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.data) {
        setInitialSettings(res.data);
        reset(res.data);
        updateLocalSettings(res.data);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load settings from server", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = (file: File, previewUrl: string) => {
    if (stagedLogo?.previewUrl && stagedLogo.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(stagedLogo.previewUrl);
    }
    setStagedLogo({ file, previewUrl });
    setValue("logoUrl", previewUrl, { shouldDirty: true, shouldValidate: true });
    showToast("Logo selected for upload on save", "info");
  };

  const handleSignatureSelect = (file: File, previewUrl: string) => {
    if (stagedSignature?.previewUrl && stagedSignature.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(stagedSignature.previewUrl);
    }
    setStagedSignature({ file, previewUrl });
    setValue("signatureUrl", previewUrl, { shouldDirty: true, shouldValidate: true });
    showToast("Signature selected for upload on save", "info");
  };

  // Zero-network Discard: Reverts locally using cached initialSettings without GET/PUT calls
  const handleDiscard = () => {
    if (stagedLogo?.previewUrl && stagedLogo.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(stagedLogo.previewUrl);
    }
    if (stagedSignature?.previewUrl && stagedSignature.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(stagedSignature.previewUrl);
    }
    setStagedLogo(null);
    setStagedSignature(null);

    if (initialSettings) {
      reset(initialSettings);
      showToast("Discarded unsaved changes", "info");
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setSaving(true);
      const payload: SettingsFormValues = { ...data };

      // Pass existing URLs for Cloudinary asset purge if changed
      if (initialSettings?.logoUrl) {
        payload.oldLogoUrl = initialSettings.logoUrl;
      }
      if (initialSettings?.signatureUrl) {
        payload.oldSignatureUrl = initialSettings.signatureUrl;
      }

      // Deferred upload: Only upload when clicking Save
      if (stagedLogo) {
        showToast("Uploading official logo...", "info");
        const uploadedLogoUrl = await api.uploadImage(stagedLogo.file, "foe");
        payload.logoUrl = uploadedLogoUrl;
      }

      if (stagedSignature) {
        showToast("Uploading authorized signature...", "info");
        const uploadedSigUrl = await api.uploadImage(stagedSignature.file, "foe");
        payload.signatureUrl = uploadedSigUrl;
      }

      const res = await api.updateSettings(payload);
      if (res.success && res.data) {
        // Clean up object URLs
        if (stagedLogo?.previewUrl && stagedLogo.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(stagedLogo.previewUrl);
        }
        if (stagedSignature?.previewUrl && stagedSignature.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(stagedSignature.previewUrl);
        }
        setStagedLogo(null);
        setStagedSignature(null);

        showToast("Card settings updated successfully!", "success");
        setInitialSettings(res.data);
        reset(res.data);
        updateLocalSettings(res.data);
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      showToast(error.message || "Failed saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <SkeletonForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 sm:pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm shrink-0">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Card & Trust Settings
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-normal">
              Manage organization details, official logo, digital signature, and back-card clauses
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        {/* Section 1: Trust Profile */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 bg-white p-3.5 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            <h2 className="text-sm sm:text-base font-semibold text-gray-800">Trust Identity & Registration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
                Trust Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("trustName")}
                className="w-full h-9 sm:h-10 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              {errors.trustName && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.trustName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
                Trust Subtitle <span className="text-red-500">*</span>
              </label>
              <input
                {...register("trustSubtitle")}
                className="w-full h-9 sm:h-10 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              {errors.trustSubtitle && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.trustSubtitle.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
                Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register("registrationNo")}
                className="w-full h-9 sm:h-10 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              {errors.registrationNo && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.registrationNo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
                Official Website URL <span className="text-red-500">*</span>
              </label>
              <input
                {...register("websiteUrl")}
                className="w-full h-9 sm:h-10 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              {errors.websiteUrl && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.websiteUrl.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Branding Assets (Logo & Signature) using MediaDropzone */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 bg-white p-3.5 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <FileSignature className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            <h2 className="text-sm sm:text-base font-semibold text-gray-800">Official Media Assets</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Logo Dropzone */}
            <div className="space-y-2">
              <MediaDropzone
                id="logo-dropzone"
                label="Official Organization Logo"
                previewUrl={currentLogo}
                fallbackSrc="/logo.png"
                aspectRatio="logo"
                recommendedText="PNG with transparent background recommended. Max 2MB."
                onFileSelect={handleLogoSelect}
                disabled={saving}
              />
              <input type="hidden" {...register("logoUrl")} />
              {errors.logoUrl && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.logoUrl.message}</p>
              )}
            </div>

            {/* Signature Dropzone */}
            <div className="space-y-2">
              <MediaDropzone
                id="signature-dropzone"
                label="Authorized Digital Signature"
                previewUrl={currentSignature}
                fallbackSrc="/placeholder-signature.png"
                aspectRatio="signature"
                recommendedText="Transparent PNG of President/Signatory. Max 2MB."
                onFileSelect={handleSignatureSelect}
                disabled={saving}
              />
              <input type="hidden" {...register("signatureUrl")} />
              {errors.signatureUrl && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.signatureUrl.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Default Authorisation & Emergency */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 bg-white p-3.5 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm sm:text-base font-semibold text-gray-800">Default Signatory & Emergency Contact</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              These will auto-populate as default values during new member registration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
                Default Signatory Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("defaultAuthorisedName")}
                className="w-full h-9 sm:h-10 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              {errors.defaultAuthorisedName && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.defaultAuthorisedName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
                Default Signatory Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("defaultAuthorisedDesignation")}
                className="w-full h-9 sm:h-10 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              {errors.defaultAuthorisedDesignation && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.defaultAuthorisedDesignation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
                Default Emergency Contact <span className="text-red-500">*</span>
              </label>
              <input
                {...register("defaultEmergencyContact")}
                className="w-full h-9 sm:h-10 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              {errors.defaultEmergencyContact && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.defaultEmergencyContact.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Card Back Terms & Clauses */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 bg-white p-3.5 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm sm:text-base font-semibold text-gray-800">Card Back Clauses & Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              These clauses render on the back of all printed member ID cards
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
              About Us Clause <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register("aboutUsText")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            {errors.aboutUsText && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.aboutUsText.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
              Validity Clause <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              {...register("validityClause")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            {errors.validityClause && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.validityClause.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 tracking-wide uppercase mb-1">
              Return Note (Footer Disclaimer) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              {...register("returnNote")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            {errors.returnNote && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.returnNote.message}</p>
            )}
          </div>
        </div>

        {/* Responsive Sticky Bottom Action Bar */}
        <StickyActionBar
          isDirty={isDirty}
          isValid={isValid}
          isSubmitting={saving}
          submitLabel="Save Card Settings"
          submittingLabel="Saving Changes..."
          onReset={handleDiscard}
          resetLabel="Discard Changes"
          unsavedText="You have unsaved changes"
          savedText="Card settings are up to date"
          className="rounded-xl sm:rounded-2xl"
        />
      </form>
    </div>
  );
}
