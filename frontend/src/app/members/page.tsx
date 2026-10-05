"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Trash2,
  RotateCcw,
  Eye,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Search,
  CheckCircle,
  Pencil,
  Edit2,
  X,
} from "lucide-react";
import { api, Member } from "@/lib/api";
import { showToast } from "@/components/Toast";
import SkeletonTable from "@/components/skeletons/SkeletonTable";
import ConfirmModal from "@/components/ConfirmModal";

function MemberAvatar({ src, alt }: { src?: string | null; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src || "/images/placeholder-avatar.png");
  return (
    <div className="h-10 w-10 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-xs">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setImgSrc("/images/placeholder-avatar.png")}
      />
    </div>
  );
}

interface ModalState {
  isOpen: boolean;
  type:
    | "single-soft-delete"
    | "single-restore"
    | "single-permanent-delete"
    | "bulk-soft-delete"
    | "bulk-restore"
    | "bulk-permanent-delete"
    | null;
  id?: string;
  ids?: string[];
  name?: string;
}

export default function MembersListPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Confirmation modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
    fetchMembers(true);
  }, [activeTab]);

  const fetchMembers = async (resetList = false, cursorToUse?: string) => {
    try {
      if (resetList) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await api.getMembers({
        status: activeTab,
        cursor: cursorToUse,
        limit: 10,
      });

      if (res.success && res.data) {
        if (resetList) {
          setMembers(res.data.items);
        } else {
          setMembers((prev) => [...prev, ...res.data.items]);
        }
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);
      }
    } catch (err) {
      console.error("Failed fetching members:", err);
      showToast("Failed to retrieve member list", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.memberId.toLowerCase().includes(q) ||
      m.designation.toLowerCase().includes(q) ||
      m.contactNumber.includes(q)
    );
  });

  const allSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.includes(m.id));

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map((m) => m.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmModal = async () => {
    if (!modalState.type) return;

    try {
      setModalLoading(true);

      switch (modalState.type) {
        case "single-soft-delete": {
          if (!modalState.id) return;
          setActionLoading(modalState.id);
          const res = await api.deleteMember(modalState.id);
          if (res.success) {
            showToast(
              `Member ${modalState.name || ""} archived successfully`,
              "success"
            );
            setMembers((prev) => prev.filter((m) => m.id !== modalState.id));
            setSelectedIds((prev) => prev.filter((i) => i !== modalState.id));
          }
          break;
        }

        case "single-restore": {
          if (!modalState.id) return;
          setActionLoading(modalState.id);
          const res = await api.restoreMember(modalState.id);
          if (res.success) {
            showToast(
              `Member ${modalState.name || ""} restored successfully`,
              "success"
            );
            setMembers((prev) => prev.filter((m) => m.id !== modalState.id));
            setSelectedIds((prev) => prev.filter((i) => i !== modalState.id));
          }
          break;
        }

        case "single-permanent-delete": {
          if (!modalState.id) return;
          setActionLoading(modalState.id);
          const res = await api.permanentDeleteMember(modalState.id);
          if (res.success) {
            showToast(
              `Member ${modalState.name || ""} permanently deleted`,
              "success"
            );
            setMembers((prev) => prev.filter((m) => m.id !== modalState.id));
            setSelectedIds((prev) => prev.filter((i) => i !== modalState.id));
          }
          break;
        }

        case "bulk-soft-delete": {
          const ids = modalState.ids || selectedIds;
          if (!ids.length) return;
          const res = await api.bulkSoftDeleteMembers(ids);
          if (res.success) {
            showToast(`${ids.length} members archived successfully`, "success");
            setMembers((prev) => prev.filter((m) => !ids.includes(m.id)));
            setSelectedIds([]);
          }
          break;
        }

        case "bulk-restore": {
          const ids = modalState.ids || selectedIds;
          if (!ids.length) return;
          const res = await api.bulkRestoreMembers(ids);
          if (res.success) {
            showToast(`${ids.length} members restored successfully`, "success");
            setMembers((prev) => prev.filter((m) => !ids.includes(m.id)));
            setSelectedIds([]);
          }
          break;
        }

        case "bulk-permanent-delete": {
          const ids = modalState.ids || selectedIds;
          if (!ids.length) return;
          const res = await api.bulkPermanentDeleteMembers(ids);
          if (res.success) {
            showToast(
              `${ids.length} members permanently deleted`,
              "success"
            );
            setMembers((prev) => prev.filter((m) => !ids.includes(m.id)));
            setSelectedIds([]);
          }
          break;
        }
      }
    } catch (err: unknown) {
      console.error("Action error:", err);
      const error = err as Error;
      showToast(error.message || "Action failed", "error");
    } finally {
      setModalLoading(false);
      setActionLoading(null);
      setModalState({ isOpen: false, type: null });
    }
  };

  // Helper to determine modal title & text
  const getModalConfig = () => {
    switch (modalState.type) {
      case "single-soft-delete":
        return {
          title: "Archive Member",
          message: `Are you sure you want to archive ${modalState.name || "this member"}? This will move the record to the deleted/archival list.`,
          confirmText: "Archive",
          variant: "danger" as const,
        };
      case "single-restore":
        return {
          title: "Restore Member",
          message: `Are you sure you want to restore ${modalState.name || "this member"} back to the active directory?`,
          confirmText: "Restore",
          variant: "warning" as const,
        };
      case "single-permanent-delete":
        return {
          title: "Permanently Delete Member",
          message: `Are you sure you want to permanently delete ${modalState.name || "this member"}? This action cannot be undone and will delete their photo from storage.`,
          confirmText: "Delete Permanently",
          variant: "danger" as const,
        };
      case "bulk-soft-delete":
        return {
          title: `Archive ${selectedIds.length} Members`,
          message: `Are you sure you want to archive these ${selectedIds.length} selected members? They will be moved to the archival list.`,
          confirmText: `Archive ${selectedIds.length} Members`,
          variant: "danger" as const,
        };
      case "bulk-restore":
        return {
          title: `Restore ${selectedIds.length} Members`,
          message: `Are you sure you want to restore these ${selectedIds.length} selected members back to the active directory?`,
          confirmText: `Restore ${selectedIds.length} Members`,
          variant: "warning" as const,
        };
      case "bulk-permanent-delete":
        return {
          title: `Permanently Delete ${selectedIds.length} Members`,
          message: `Are you sure you want to permanently delete these ${selectedIds.length} members and remove their photos from cloud storage? This action cannot be undone.`,
          confirmText: `Delete ${selectedIds.length} Members`,
          variant: "danger" as const,
        };
      default:
        return {
          title: "Confirm Action",
          message: "Are you sure you want to proceed with this action?",
          confirmText: "Confirm",
          variant: "danger" as const,
        };
    }
  };

  const modalConfig = getModalConfig();

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Members Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-normal">
            Ordered descending with latest registrations first. View, print ID cards, or manage archive records.
          </p>
        </div>

        <Link
          href="/members/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#F15A24] text-white rounded-lg font-semibold shadow-sm hover:bg-[#d94815] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Register New Member</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Active vs Deleted Tabs */}
        <div className="flex w-full sm:w-auto p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 text-center py-2 px-4 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Active
          </button>

          <button
            onClick={() => setActiveTab("deleted")}
            className={`flex-1 text-center py-2 px-4 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "deleted"
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Archived
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, contact..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        {loading ? (
          <SkeletonTable rows={6} cols={9} />
        ) : filteredMembers.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center gap-2 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">
              {activeTab === "active" ? "No active members found" : "No deleted records"}
            </h3>
            <p className="max-w-xs text-xs text-gray-500">
              {activeTab === "active"
                ? "Click 'Register New Member' to create the first record and issue their ID card."
                : "Deleted or soft-archived member records will appear here."}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Force min-width to prevent column overlapping */}
            <table className="w-full min-w-[950px] table-fixed text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  {/* Custom Checkbox Column */}
                  <th className="w-[48px] px-4 py-3 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#F15A24] focus:ring-[#F15A24] cursor-pointer accent-[#F15A24]"
                      aria-label="Select all members on this page"
                    />
                  </th>
                  <th className="w-[70px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Photo</th>
                  <th className="w-[100px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Member ID</th>
                  <th className="w-[180px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Full Name</th>
                  <th className="w-[160px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Designation</th>
                  <th className="w-[140px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
                  <th className="w-[110px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Blood Group</th>
                  <th className="w-[110px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="w-[140px] px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className={`transition-colors ${
                      selectedIds.includes(member.id)
                        ? "bg-orange-50/60"
                        : "hover:bg-orange-50/30"
                    }`}
                  >
                    {/* Checkbox column */}
                    <td className="w-[48px] px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(member.id)}
                        onChange={() => handleToggleRow(member.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#F15A24] focus:ring-[#F15A24] cursor-pointer accent-[#F15A24]"
                        aria-label={`Select member ${member.fullName}`}
                      />
                    </td>

                    {/* Photo thumbnail */}
                    <td className="w-[70px] px-4 py-3">
                      <MemberAvatar src={member.photoPath} alt={member.fullName} />
                    </td>

                    {/* Member ID */}
                    <td className="w-[100px] px-4 py-3 font-mono font-bold text-orange-600 whitespace-nowrap">
                      {member.memberId}
                    </td>

                    {/* Full Name */}
                    <td className="w-[180px] px-4 py-3 font-bold text-gray-900 truncate">
                      <span className="truncate block" title={member.fullName}>
                        {member.fullName}
                      </span>
                    </td>

                    {/* Designation */}
                    <td className="w-[160px] px-4 py-3 text-gray-600 truncate">
                      <span className="truncate block" title={member.designation}>
                        {member.designation}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="w-[140px] px-4 py-3 text-gray-600 whitespace-nowrap truncate">
                      <span className="whitespace-nowrap truncate block">
                        {member.contactNumber}
                      </span>
                    </td>

                    {/* Blood Group */}
                    <td className="w-[110px] px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-lg bg-red-50 px-2.5 py-1 font-bold text-red-700 text-xs">
                        {member.bloodGroup?.bloodGroup || "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="w-[110px] px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                          member.deletedAt
                            ? "bg-gray-100 text-gray-600"
                            : member.memberStatus === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.deletedAt
                              ? "bg-gray-400"
                              : member.memberStatus === "Active"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {member.deletedAt ? "Archived" : member.memberStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="w-[140px] px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === "deleted" ? (
                          <>
                            {/* Restore Button */}
                            <div className="relative group inline-block">
                              <button
                                onClick={() =>
                                  setModalState({
                                    isOpen: true,
                                    type: "single-restore",
                                    id: member.id,
                                    name: member.fullName,
                                  })
                                }
                                disabled={actionLoading === member.id}
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {actionLoading === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
                              </button>
                              {/* Custom Hover-Only Tooltip (Hidden on touch devices) */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity [@media(hover:hover)]:group-hover:block">
                                <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  Restore Member
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>

                            {/* Permanent Delete Button */}
                            <div className="relative group inline-block">
                              <button
                                onClick={() =>
                                  setModalState({
                                    isOpen: true,
                                    type: "single-permanent-delete",
                                    id: member.id,
                                    name: member.fullName,
                                  })
                                }
                                disabled={actionLoading === member.id}
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {actionLoading === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                              {/* Custom Hover-Only Tooltip (Hidden on touch devices) */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity [@media(hover:hover)]:group-hover:block">
                                <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  Delete Permanently
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Edit Button */}
                            <div className="relative group inline-block">
                              <Link
                                href={`/members/${member.id}/edit`}
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              {/* Custom Hover-Only Tooltip (Hidden on touch devices) */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity [@media(hover:hover)]:group-hover:block">
                                <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  Edit Member
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>

                            {/* View / Download ID */}
                            <div className="relative group inline-block">
                              <Link
                                href={`/members/${member.id}/preview`}
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              {/* Custom Hover-Only Tooltip (Hidden on touch devices) */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity [@media(hover:hover)]:group-hover:block">
                                <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  View ID Card
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>

                            {/* Archive (Soft Delete) */}
                            <div className="relative group inline-block">
                              <button
                                onClick={() =>
                                  setModalState({
                                    isOpen: true,
                                    type: "single-soft-delete",
                                    id: member.id,
                                    name: member.fullName,
                                  })
                                }
                                disabled={actionLoading === member.id}
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {actionLoading === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                              {/* Custom Hover-Only Tooltip (Hidden on touch devices) */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity [@media(hover:hover)]:group-hover:block">
                                <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  Archive Member
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cursor Pagination Load More */}
        {hasMore && !loading && (
          <div className="flex items-center justify-center p-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => fetchMembers(false, nextCursor || undefined)}
              disabled={loadingMore}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 transition-all disabled:opacity-60"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span>{loadingMore ? "Loading more members..." : "Load More Records"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 bg-gray-900 text-white rounded-full shadow-2xl transition-transform translate-y-0 max-w-[90vw] overflow-x-auto">
          {/* Selected Count */}
          <span className="text-sm font-medium border-r border-gray-700 pr-4 whitespace-nowrap">
            {selectedIds.length} {selectedIds.length === 1 ? "member" : "members"} selected
          </span>

          {/* Active Tab Actions */}
          {activeTab === "active" ? (
            <button
              type="button"
              onClick={() =>
                setModalState({
                  isOpen: true,
                  type: "bulk-soft-delete",
                  ids: selectedIds,
                })
              }
              className="text-sm font-semibold text-red-400 hover:text-red-300 flex items-center gap-1.5 px-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              <span>Archive Selected</span>
            </button>
          ) : (
            /* Archived Tab Actions */
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setModalState({
                    isOpen: true,
                    type: "bulk-restore",
                    ids: selectedIds,
                  })
                }
                className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-2 cursor-pointer transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore Selected</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setModalState({
                    isOpen: true,
                    type: "bulk-permanent-delete",
                    ids: selectedIds,
                  })
                }
                className="text-sm font-semibold text-red-400 hover:text-red-300 flex items-center gap-1.5 px-2 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </button>
            </div>
          )}

          {/* Clear Selection */}
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalState({ isOpen: false, type: null });
          }
        }}
        onConfirm={handleConfirmModal}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant}
        isLoading={modalLoading}
      />
    </div>
  );
}
