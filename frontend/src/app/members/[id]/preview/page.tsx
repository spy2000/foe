"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Pencil, CheckCircle } from "lucide-react";
import { api, Member, CardSettings } from "@/lib/api";
import { showToast } from "@/components/Toast";
import CardPreviewFront from "@/components/CardPreviewFront";
import CardPreviewBack from "@/components/CardPreviewBack";
import PDFExporter from "@/components/PDFExporter";
import SkeletonCard from "@/components/skeletons/SkeletonCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MemberPreviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [member, setMember] = useState<Member | null>(null);
  const [settings, setSettings] = useState<CardSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberAndSettings();
  }, [id]);

  const fetchMemberAndSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getMemberById(id);
      if (res.success && res.data) {
        setMember(res.data.member);
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error("Failed fetching member details:", err);
      showToast("Failed to load member ID card preview", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-5 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-7 w-64 rounded-lg bg-gray-200" />
            <div className="h-4 w-96 rounded bg-gray-100" />
          </div>
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (!member || !settings) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <CreditCard className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Member Not Found</h2>
        <p className="text-sm text-gray-500">The requested member ID card could not be located.</p>
        <Link
          href="/members"
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Members</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 sm:space-y-8">
      {/* Top Bar with Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4 sm:pb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/members"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition-all shrink-0"
            title="Back to Member Directory"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 truncate">
                ID Card Preview: {member.fullName}
              </h1>
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-mono font-bold text-[#F15A24] shrink-0">
                {member.memberId}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-normal">
              CR80 Standard Print Preview (Front & Back rendered side-by-side for high-resolution export)
            </p>
          </div>
        </div>

        {/* Action Buttons: Edit Member & PDF Download */}
        <div className="flex w-full sm:w-auto items-center justify-center gap-3">
          <Link
            href={`/members/${member.id}/edit`}
            className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm hover:bg-gray-50 text-sm font-medium whitespace-nowrap transition-colors"
            title="Edit Member Details"
          >
            <Pencil className="w-4 h-4 shrink-0 text-[#F15A24]" />
            <span>Edit Member</span>
          </Link>

          <PDFExporter
            containerId="pdf-capture-stage"
            memberId={member.memberId}
            memberName={member.fullName}
            buttonClassName="flex-1 sm:flex-initial inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-white bg-[#F15A24] shadow-sm hover:bg-[#d94815] text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* Side-by-Side Live Print-Ready Canvas */}
      <div className="flex flex-col items-center w-full">
        <div className="w-full rounded-2xl sm:rounded-3xl bg-neutral-100/80 p-4 sm:p-8 shadow-inner border border-gray-200 flex flex-col items-center">
          <div className="flex flex-col xl:flex-row items-center justify-center gap-8 w-full py-4">
            {/* Front Card Container */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Front Side
              </span>
              <div className="w-[340px] h-[536px] shrink-0">
                <CardPreviewFront member={member} settings={settings} />
              </div>
            </div>

            {/* Back Card Container */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Back Side
              </span>
              <div className="w-[340px] h-[536px] shrink-0">
                <CardPreviewBack
                  member={member}
                  settings={settings}
                  emergencyContactNumber={member.emergencyContactNumber}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Hidden Stage for High-DPI Landscape PDF Export (Exact Pixel Parity) */}
      <div
        id="pdf-capture-stage"
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: "740px",
          height: "536px",
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
        }}
      >
        {/* Front Card */}
        <div style={{ position: "absolute", left: "0px", top: "0px", width: "340px", height: "536px", flexShrink: 0 }}>
          <CardPreviewFront isPrintMode={true} member={member} settings={settings} />
        </div>

        {/* Back Card */}
        <div style={{ position: "absolute", left: "400px", top: "0px", width: "340px", height: "536px", flexShrink: 0 }}>
          <CardPreviewBack
            isPrintMode={true}
            member={member}
            settings={settings}
            emergencyContactNumber={member.emergencyContactNumber}
          />
        </div>
      </div>

      {/* Member Details Summary Card */}
      <div className="mx-auto max-w-3xl rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-xs">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>Member Verification Snapshot</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-400 block font-medium">Designation</span>
            <span className="font-bold text-gray-800">{member.designation}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Contact</span>
            <span className="font-bold text-gray-800">{member.contactNumber}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Blood Group</span>
            <span className="font-bold text-red-600">{member.bloodGroup?.bloodGroup}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Status</span>
            <span className="font-bold text-emerald-600">{member.memberStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
