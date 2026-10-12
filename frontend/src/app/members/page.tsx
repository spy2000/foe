"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { api, Member } from "@/lib/api";
import { showToast } from "@/components/Toast";
import SkeletonTable from "@/components/skeletons/SkeletonTable";
import ConfirmModal from "@/components/ConfirmModal";
import { useAuth } from "@/context/AuthContext";

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

interface SortableHeaderProps {
  columnKey: string;
  label: string;
  className?: string;
  sortConfig: { key: string; order: "asc" | "desc" };
  onSort: (key: string) => void;
}

function SortableHeader({
  columnKey,
  label,
  className = "",
  sortConfig,
  onSort,
}: SortableHeaderProps) {
  const isSorted = sortConfig.key === columnKey;

  return (
    <th
      className={`${className} px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap`}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="group inline-flex items-center gap-1.5 hover:text-orange-600 transition-colors cursor-pointer select-none text-left"
        aria-label={`Sort by ${label} (${isSorted ? (sortConfig.order === "asc" ? "Ascending" : "Descending") : "Click to sort"})`}
      >
        <span>{label}</span>
        <span
          className={`inline-flex rounded p-0.5 transition-colors ${
            isSorted
              ? "bg-orange-100 text-orange-600 font-bold"
              : "text-gray-400 group-hover:text-gray-600"
          }`}
        >
          {isSorted ? (
            sortConfig.order === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
          )}
        </span>
      </button>
    </th>
  );
}

export default function MembersListPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // 1. State for Sorting & Filtering
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    order: "asc" | "desc";
  }>({ key: "createdAt", order: "desc" });
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "DELETED">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset selections on tab change
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  // 2. TanStack React Query: The Infinite Query Hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      "members",
      activeTab,
      sortConfig.key,
      sortConfig.order,
      debouncedSearch,
    ],
    queryFn: async ({ pageParam = "" }) => {
      return api.getMembers({
        status: activeTab,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.order,
        limit: 10,
        cursor: pageParam || undefined,
        search: debouncedSearch || undefined,
      });
    },
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
  });

  // 3. Flatten pages for the table
  const members =
    data?.pages.flatMap((page) => page.data || page.items || []) || [];

  // Sorting Header Click Handler
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          order: prev.order === "asc" ? "desc" : "asc",
        };
      }
      return {
        key,
        order: key === "createdAt" || key === "dateOfJoining" ? "desc" : "asc",
      };
    });
  };

  // 4. Infinite Scrolling Observer
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    const currentSentinel = loadMoreSentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Confirmation modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
  });
  const [modalLoading, setModalLoading] = useState(false);

  // Selection handlers
  const allSelected =
    members.length > 0 && members.every((m) => selectedIds.includes(m.id));

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m) => m.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Modal execution handler
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
            setSelectedIds((prev) => prev.filter((i) => i !== modalState.id));
            queryClient.invalidateQueries({ queryKey: ["members"] });
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
            setSelectedIds((prev) => prev.filter((i) => i !== modalState.id));
            queryClient.invalidateQueries({ queryKey: ["members"] });
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
            setSelectedIds((prev) => prev.filter((i) => i !== modalState.id));
            queryClient.invalidateQueries({ queryKey: ["members"] });
          }
          break;
        }

        case "bulk-soft-delete": {
          const ids = modalState.ids || selectedIds;
          if (!ids.length) return;
          const res = await api.bulkSoftDeleteMembers(ids);
          if (res.success) {
            showToast(`${ids.length} members archived successfully`, "success");
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ["members"] });
          }
          break;
        }

        case "bulk-restore": {
          const ids = modalState.ids || selectedIds;
          if (!ids.length) return;
          const res = await api.bulkRestoreMembers(ids);
          if (res.success) {
            showToast(`${ids.length} members restored successfully`, "success");
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ["members"] });
          }
          break;
        }

        case "bulk-permanent-delete": {
          const ids = modalState.ids || selectedIds;
          if (!ids.length) return;
          const res = await api.bulkPermanentDeleteMembers(ids);
          if (res.success) {
            showToast(`${ids.length} members permanently deleted`, "success");
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ["members"] });
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
          message: `Are you sure you want to permanently delete ${modalState.name || "this member"}? This will permanently purge their database record and photo. This action CANNOT be undone.`,
          confirmText: "Delete Permanently",
          variant: "danger" as const,
        };
      case "bulk-soft-delete":
        return {
          title: "Archive Selected Members",
          message: `Are you sure you want to archive ${modalState.ids?.length || selectedIds.length} selected members?`,
          confirmText: "Archive All",
          variant: "danger" as const,
        };
      case "bulk-restore":
        return {
          title: "Restore Selected Members",
          message: `Are you sure you want to restore ${modalState.ids?.length || selectedIds.length} selected members back to the active directory?`,
          confirmText: "Restore All",
          variant: "warning" as const,
        };
      case "bulk-permanent-delete":
        return {
          title: "Permanently Delete Selected Members",
          message: `Are you sure you want to permanently delete ${modalState.ids?.length || selectedIds.length} selected members? Their records and photo assets will be destroyed. This action CANNOT be undone.`,
          confirmText: "Permanently Delete All",
          variant: "danger" as const,
        };
      default:
        return {
          title: "",
          message: "",
          confirmText: "Confirm",
          variant: "danger" as const,
        };
    }
  };

  const modalConfig = getModalConfig();

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl flex items-center gap-3">
            <span>Members Directory</span>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
              {activeTab === "ACTIVE" ? "Active" : "Archived"}
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            View, search, sort, and manage registered members of Friends of Education.
          </p>
        </div>

        {/* Action Button */}
        {(user?.canAddMember || user?.role === "SUPERADMIN") && (
          <Link
            href="/members/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/25 transition-all active:scale-[0.99] shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register New Member</span>
          </Link>
        )}
      </div>

      {/* Main Container Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs">
        {/* Toolbar: Tab Pills + Search Filter */}
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50/40">
          {/* Active / Deleted Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl bg-gray-200/60 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("ACTIVE")}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === "ACTIVE"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Active</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("DELETED")}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === "DELETED"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Archived</span>
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full sm:w-72">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, contact..."
              className="block w-full rounded-xl border border-gray-200 bg-white py-1.5 pl-9 pr-8 text-xs text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={6} />
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-3" />
            <h3 className="text-base font-bold text-gray-900">
              Failed to load members
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Unable to connect to the directory service. Please retry.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-4">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {searchQuery
                ? `No members found matching "${searchQuery}"`
                : activeTab === "ACTIVE"
                ? "No active members registered yet"
                : "No archived records"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
              {activeTab === "ACTIVE"
                ? "Click 'Register New Member' to create the first record and issue their ID card."
                : "Deleted or soft-archived member records will appear here."}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto bg-white">
            <table className="w-full min-w-[1000px] table-fixed text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60">
                  {/* Select All Checkbox */}
                  <th className="w-[48px] px-4 py-3 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#F15A24] focus:ring-[#F15A24] cursor-pointer accent-[#F15A24]"
                      aria-label="Select all members on this page"
                    />
                  </th>
                  <th className="w-[70px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Photo
                  </th>
                  <SortableHeader
                    columnKey="memberId"
                    label="Member ID"
                    className="w-[110px]"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    columnKey="fullName"
                    label="Full Name"
                    className="w-[190px]"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    columnKey="designation"
                    label="Designation"
                    className="w-[160px]"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <th className="w-[130px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Contact
                  </th>
                  <th className="w-[100px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Blood Group
                  </th>
                  <SortableHeader
                    columnKey="dateOfJoining"
                    label="Joined"
                    className="w-[110px]"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <th className="w-[100px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="w-[140px] px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className={`transition-colors ${
                      selectedIds.includes(member.id)
                        ? "bg-orange-50/70"
                        : "hover:bg-orange-50/30"
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="w-[48px] px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(member.id)}
                        onChange={() => handleToggleRow(member.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#F15A24] focus:ring-[#F15A24] cursor-pointer accent-[#F15A24]"
                        aria-label={`Select member ${member.fullName}`}
                      />
                    </td>

                    {/* Photo */}
                    <td className="w-[70px] px-4 py-3">
                      <MemberAvatar
                        src={member.photoPath}
                        alt={member.fullName}
                      />
                    </td>

                    {/* Member ID */}
                    <td className="w-[110px] px-4 py-3 font-mono font-bold text-orange-600 whitespace-nowrap">
                      {member.memberId}
                    </td>

                    {/* Full Name & Creator */}
                    <td className="w-[190px] px-4 py-3 font-bold text-gray-900 truncate">
                      <div className="truncate block" title={member.fullName}>
                        {member.fullName}
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="w-[160px] px-4 py-3 text-gray-600 truncate">
                      <span className="truncate block" title={member.designation}>
                        {member.designation}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="w-[130px] px-4 py-3 text-gray-600 whitespace-nowrap truncate font-mono text-[11px]">
                      {member.contactNumber}
                    </td>

                    {/* Blood Group */}
                    <td className="w-[100px] px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-lg bg-red-50 px-2.5 py-1 font-bold text-red-700 text-xs">
                        {member.bloodGroup?.bloodGroup || "—"}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="w-[110px] px-4 py-3 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                      {member.dateOfJoining
                        ? new Date(member.dateOfJoining).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "—"}
                    </td>

                    {/* Status */}
                    <td className="w-[100px] px-4 py-3 whitespace-nowrap">
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
                      <div className="flex items-center justify-end gap-1.5">
                        {activeTab === "DELETED" ? (
                          <>
                            {/* Restore */}
                            <div className="relative group">
                              <button
                              type="button"
                              onClick={() =>
                                setModalState({
                                  isOpen: true,
                                  type: "single-restore",
                                  id: member.id,
                                  name: member.fullName,
                                })
                              }
                               disabled={actionLoading === member.id}
                              className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                              aria-label="Restore Member"
                            >
                              {actionLoading === member.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center px-2 py-0.5 text-[10px] font-semibold text-white bg-gray-900 rounded-md shadow-md whitespace-nowrap z-30">
                              Restore
                            </div>
                          </div>

                          {/* Permanent Delete */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() =>
                                setModalState({
                                  isOpen: true,
                                  type: "single-permanent-delete",
                                  id: member.id,
                                  name: member.fullName,
                                })
                              }
                              disabled={actionLoading === member.id}
                              className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                              aria-label="Delete Permanently"
                            >
                              {actionLoading === member.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center px-2 py-0.5 text-[10px] font-semibold text-white bg-gray-900 rounded-md shadow-md whitespace-nowrap z-30">
                              Delete Permanently
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Edit */}
                          {(user?.canAddMember || user?.role === "SUPERADMIN") && (
                            <div className="relative group">
                              <Link
                                href={`/members/${member.id}/edit`}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                aria-label="Edit Member"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center px-2 py-0.5 text-[10px] font-semibold text-white bg-gray-900 rounded-md shadow-md whitespace-nowrap z-30">
                                Edit
                              </div>
                            </div>
                          )}

                          {/* View ID Card */}
                          <div className="relative group">
                            <Link
                              href={`/members/${member.id}/preview`}
                              className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              aria-label="View ID Card"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center px-2 py-0.5 text-[10px] font-semibold text-white bg-gray-900 rounded-md shadow-md whitespace-nowrap z-30">
                              View Card
                            </div>
                          </div>

                          {/* Archive (Soft Delete) */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() =>
                                setModalState({
                                  isOpen: true,
                                  type: "single-soft-delete",
                                  id: member.id,
                                  name: member.fullName,
                                })
                              }
                              disabled={actionLoading === member.id}
                              className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                              aria-label="Archive Member"
                            >
                              {actionLoading === member.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center px-2 py-0.5 text-[10px] font-semibold text-white bg-gray-900 rounded-md shadow-md whitespace-nowrap z-30">
                              Archive
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

        {/* 5. Infinite Scroll Sentinel and Status Indicator */}
        <div
          ref={loadMoreSentinelRef}
          className="p-4 border-t border-gray-100 bg-gray-50/40 flex flex-col items-center justify-center gap-2"
        >
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more members...</span>
            </div>
          ) : hasNextPage ? (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 transition-all cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span>Load More Records</span>
            </button>
          ) : members.length > 0 ? (
            <span className="text-xs text-gray-400 font-medium">
              Showing all {members.length} members
            </span>
          ) : null}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 bg-gray-900 text-white rounded-full shadow-2xl transition-transform translate-y-0 max-w-[90vw] overflow-x-auto">
          <span className="text-sm font-medium border-r border-gray-700 pr-4 whitespace-nowrap">
            {selectedIds.length}{" "}
            {selectedIds.length === 1 ? "member" : "members"} selected
          </span>

          {activeTab === "ACTIVE" ? (
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

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Clear Selection"
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
