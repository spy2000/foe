"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Member } from "@/lib/api";
import { showToast } from "@/components/Toast";
import MemberForm from "@/components/MemberForm";
import SkeletonForm from "@/components/skeletons/SkeletonForm";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    api.getMemberById(id)
      .then((res) => {
        if (!mounted) return;
        if (res.success && res.data?.member) {
          setMember(res.data.member);
        } else {
          setError("Member details not found or could not be retrieved.");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed fetching member:", err);
        setError((err as Error).message || "Failed to load member details.");
        showToast("Failed to load member for editing", "error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <SkeletonForm />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-base font-bold text-red-900 mb-1">Unable to Load Member</h2>
        <p className="text-xs text-red-700 mb-4">{error || "Member record does not exist."}</p>
        <button
          onClick={() => router.push("/members")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-700 border border-gray-200 shadow-xs hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Member Directory</span>
        </button>
      </div>
    );
  }

  return <MemberForm mode="edit" initialMember={member} memberId={id} />;
}
