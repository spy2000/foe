"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import {
  UserPlus,
  Users,
  AlertTriangle,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Pencil,
  Edit,
  Trash2,
} from "lucide-react";
import { api, AuthUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/components/Toast";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import InviteAdminModal from "@/components/InviteAdminModal";
import EditAdminModal from "@/components/EditAdminModal";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  activeColor?: string;
}

function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  activeColor = "bg-orange-600",
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
        checked ? activeColor : "bg-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      aria-label={label}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
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

export default function AdminManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Selection & Modals state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: "single" | "bulk" | null;
    id?: string;
    name?: string;
  }>({ isOpen: false, type: null });

  // 1. Route Guard: Restrict strictly to SUPERADMIN
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login?redirect=/admin");
      } else if (currentUser && currentUser.role !== "SUPERADMIN") {
        showToast("Access restricted to Super Administrators only.", "error");
        router.push("/members");
      }
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

  // State for Searching & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    order: "asc" | "desc";
  }>({ key: "createdAt", order: "desc" });

  interface UsersPageResponse {
    success: boolean;
    data: AuthUser[];
    nextCursor?: string | null;
    hasMore?: boolean;
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: usersLoading,
    isError,
    error,
  } = useInfiniteQuery<UsersPageResponse>({
    queryKey: ["users", debouncedSearch, sortConfig.key, sortConfig.order],
    queryFn: async ({ pageParam = "" }) => {
      const queryParams = new URLSearchParams({
        limit: "10",
        sortBy: sortConfig.key,
        sortOrder: sortConfig.order,
      });
      if (debouncedSearch) queryParams.append("search", debouncedSearch);
      if (pageParam && typeof pageParam === "string") {
        queryParams.append("cursor", pageParam);
      }

      return api.get<UsersPageResponse>(`/users?${queryParams.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: "",
    enabled: !!currentUser && currentUser.role === "SUPERADMIN",
  });

  const users: AuthUser[] =
    data?.pages.flatMap((page) => page.data || []) || [];

  const selectableUsers = users.filter(
    (u) => u.role !== "SUPERADMIN" && u.id !== currentUser?.id
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(selectableUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const openEditModal = (userItem: AuthUser) => {
    setEditingUser(userItem);
    setIsEditModalOpen(true);
  };

  const openDeleteConfirmModal = (userItem: AuthUser) => {
    setDeleteModalState({
      isOpen: true,
      type: "single",
      id: userItem.id,
      name: userItem.name,
    });
  };

  // Sorting Handler
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // Infinite Scrolling Observer
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

  // Mutation for updating permissions
  const permissionMutation = useMutation({
    mutationFn: async ({
      id,
      permissions,
    }: {
      id: string;
      permissions: { canAddMember?: boolean; canDownloadCard?: boolean };
    }) => {
      const res = await api.updateUserPermissions(id, permissions);
      return res.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast(`Permissions updated for ${updatedUser.name}`, "success");
    },
    onError: () => {
      showToast("Failed to update user permissions", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Mutation for updating status
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "DEACTIVATED";
    }) => {
      const res = await api.updateUserStatus(id, status);
      return res.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast(
        `User ${updatedUser.name} is now ${updatedUser.status.toLowerCase()}`,
        "success"
      );
    },
    onError: () => {
      showToast("Failed to update user status", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("Administrator deactivated successfully", "success");
      setDeleteModalState({ isOpen: false, type: null });
      if (deleteModalState.id) {
        setSelectedIds((prev) => prev.filter((item) => item !== deleteModalState.id));
      }
    },
    onError: (err: unknown) => {
      const error = err as Error;
      showToast(error.message || "Failed to deactivate administrator", "error");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return api.bulkDeleteUsers(ids);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast(res.message || "Administrators deactivated successfully", "success");
      setDeleteModalState({ isOpen: false, type: null });
      setSelectedIds([]);
    },
    onError: (err: unknown) => {
      const error = err as Error;
      showToast(error.message || "Failed to bulk deactivate administrators", "error");
    },
  });

  const isLoading = authLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Header Skeleton */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>

        {/* Table Skeleton */}
        <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 border-b pb-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.role !== "SUPERADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#222] tracking-tight break-words leading-tight">
              Admin Management
            </h1>
            <p className="text-sm text-gray-500 mt-1 break-words">
              Manage portal administrators, access permissions, and account statuses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="btn-primary whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-700 active:scale-[0.98] transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Admin</span>
          </button>
        </div>

        {/* Users Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/40">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <h2 className="text-base font-bold text-gray-800">
                Registered Administrators
              </h2>
              <span className="ml-2 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                {users.length}
              </span>
            </div>

            {/* Search Input Box */}
            <div className="relative w-full sm:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="block w-full rounded-xl border border-gray-200 bg-white py-1.5 pl-9 pr-8 text-xs text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {usersLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 border-b pb-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="font-semibold">
                {(error as Error)?.message || "Failed to load administrators"}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-base font-semibold">
                {searchTerm ? "No matching administrators found" : "No administrators found"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm
                  ? "Try adjusting your search query."
                  : "Click \"Invite Admin\" above to create the first admin."}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full min-w-[1000px] table-fixed text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="w-12 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectableUsers.length > 0 &&
                          selectableUsers.every((u) => selectedIds.includes(u.id))
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#F15A24] focus:ring-[#F15A24] cursor-pointer accent-[#F15A24]"
                        aria-label="Select all administrators"
                      />
                    </th>
                    <SortableHeader
                      columnKey="name"
                      label="User"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[250px]"
                    />
                    <SortableHeader
                      columnKey="role"
                      label="Role"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[120px]"
                    />
                    <SortableHeader
                      columnKey="status"
                      label="Status"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[160px]"
                    />
                    <SortableHeader
                      columnKey="canAddMember"
                      label="Can Add"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[120px] text-center"
                    />
                    <SortableHeader
                      columnKey="canDownloadCard"
                      label="Can Download"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="w-[140px] text-center"
                    />
                    <th className="px-4 py-3 w-[120px] text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
                      Scope
                    </th>
                    <th className="px-4 py-3 w-[90px] text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {users.map((userItem) => {
                    const isSelf = currentUser?.id === userItem.id;
                    const isActive = userItem.status === "ACTIVE";
                    const isDeactivated = userItem.status === "DEACTIVATED";
                    const isInvited = userItem.status === "INVITED";

                    return (
                      <tr
                        key={userItem.id}
                        className={`hover:bg-gray-50/60 transition-colors ${
                          selectedIds.includes(userItem.id) ? "bg-orange-50/30" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="w-12 px-4 py-3 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(userItem.id)}
                            onChange={() => toggleSelection(userItem.id)}
                            disabled={userItem.role === "SUPERADMIN" || isSelf}
                            className="w-4 h-4 rounded border-gray-300 text-[#F15A24] focus:ring-[#F15A24] cursor-pointer accent-[#F15A24] disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={`Select administrator ${userItem.name}`}
                          />
                        </td>

                        {/* Name & Email */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center font-bold text-gray-700 text-xs shrink-0">
                              {userItem.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm truncate">
                                  {userItem.name}
                                </span>
                                {isSelf && (
                                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 shrink-0">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 truncate block">
                                {userItem.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                              userItem.role === "SUPERADMIN"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {userItem.role === "SUPERADMIN" ? "Superadmin" : "Admin"}
                          </span>
                        </td>

                        {/* Status Toggle & Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={isActive}
                              disabled={isSelf || statusMutation.isPending}
                              activeColor="bg-emerald-600"
                              onChange={(checked) => {
                                statusMutation.mutate({
                                  id: userItem.id,
                                  status: checked ? "ACTIVE" : "DEACTIVATED",
                                });
                              }}
                              label={
                                isSelf
                                  ? "Cannot toggle your own status"
                                  : `Toggle status for ${userItem.name}`
                              }
                            />
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : isInvited
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {userItem.status}
                            </span>
                          </div>
                        </td>

                        {/* Can Add Member Inline Toggle */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <Switch
                            checked={userItem.canAddMember}
                            disabled={
                              userItem.role === "SUPERADMIN" ||
                              isDeactivated ||
                              permissionMutation.isPending
                            }
                            activeColor="bg-orange-600"
                            onChange={(checked) => {
                              permissionMutation.mutate({
                                id: userItem.id,
                                permissions: { canAddMember: checked },
                              });
                            }}
                            label={`Toggle Can Add Member for ${userItem.name}`}
                          />
                        </td>

                        {/* Can Download Card Inline Toggle */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <Switch
                            checked={userItem.canDownloadCard}
                            disabled={
                              userItem.role === "SUPERADMIN" ||
                              isDeactivated ||
                              permissionMutation.isPending
                            }
                            activeColor="bg-orange-600"
                            onChange={(checked) => {
                              permissionMutation.mutate({
                                id: userItem.id,
                                permissions: { canDownloadCard: checked },
                              });
                            }}
                            label={`Toggle Can Download Card for ${userItem.name}`}
                          />
                        </td>

                        {/* Scope Column */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                            {userItem.viewScope}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="px-4 py-3 whitespace-nowrap text-right w-[90px]">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(userItem)}
                              className="text-blue-500 hover:text-blue-700 cursor-pointer p-1 transition-colors"
                              title="Edit Administrator"
                              aria-label={`Edit ${userItem.name}`}
                            >
                              <Edit className="w-[18px] h-[18px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirmModal(userItem)}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={userItem.role === "SUPERADMIN" || isSelf}
                              title={
                                userItem.role === "SUPERADMIN"
                                  ? "Cannot delete Superadmin"
                                  : isSelf
                                  ? "Cannot delete your own account"
                                  : "Delete Administrator"
                              }
                              aria-label={`Delete ${userItem.name}`}
                            >
                              <Trash2 className="w-[18px] h-[18px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Infinite Scrolling Sentinel & Status */}
              <div ref={loadMoreSentinelRef} className="py-4 border-t border-gray-100 text-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500">
                    <div className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                    <span>Loading more administrators...</span>
                  </div>
                ) : hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                  >
                    Load More Administrators
                  </button>
                ) : users.length > 0 ? (
                  <p className="text-[11px] font-medium text-gray-400">
                    Showing all {users.length} administrators
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Admin Modal */}
      <InviteAdminModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
      />

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-800 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F15A24] text-xs font-bold text-white">
              {selectedIds.length}
            </span>
            <span className="text-sm font-semibold">
              {selectedIds.length === 1 ? "1 admin selected" : `${selectedIds.length} admins selected`}
            </span>
          </div>

          <div className="h-4 w-px bg-gray-700" />

          <button
            type="button"
            onClick={() =>
              setDeleteModalState({
                isOpen: true,
                type: "bulk",
              })
            }
            className="text-sm font-semibold text-red-400 hover:text-red-300 flex items-center gap-1.5 px-2 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors cursor-pointer ml-1"
            aria-label="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Admin Modal */}
      <EditAdminModal
        isOpen={isEditModalOpen}
        user={editingUser}
        currentUser={currentUser}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
      />

      {/* Delete Administrator Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, type: null })}
        onConfirm={() => {
          if (deleteModalState.type === "single" && deleteModalState.id) {
            deleteMutation.mutate(deleteModalState.id);
          } else if (deleteModalState.type === "bulk" && selectedIds.length > 0) {
            bulkDeleteMutation.mutate(selectedIds);
          }
        }}
        user={deleteModalState.name ? { name: deleteModalState.name } : null}
        count={deleteModalState.type === "bulk" ? selectedIds.length : 1}
        isLoading={deleteMutation.isPending || bulkDeleteMutation.isPending}
      />
    </div>
  );
}
