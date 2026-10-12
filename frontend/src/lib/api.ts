// 1. Safely resolve the base URL whether /api is in the .env or not
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const cleanUrl = envUrl.replace(/\/+$/, ""); // Remove trailing slashes

  // If the .env URL already includes /api, use it. Otherwise, append it.
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export interface BloodGroup {
  id: number;
  bloodGroup: string;
  isActive: boolean;
}

export interface CardSettings {
  id: number;
  trustName: string;
  trustSubtitle: string;
  registrationNo: string;
  logoUrl: string;
  signatureUrl: string;
  websiteUrl: string;
  aboutUsText: string;
  validityClause: string;
  returnNote: string;
  defaultEmergencyContact: string;
  defaultAuthorisedName: string;
  defaultAuthorisedDesignation: string;
  updatedAt: string;
}

export interface Member {
  id: string; // Serialized BigInt as string
  memberId: string;
  registrationNo: string;
  fullName: string;
  designation: string;
  bloodGroupId: number;
  bloodGroup: BloodGroup;
  contactNumber: string;
  emailId: string;
  dateOfJoining: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactNumber: string;
  photoPath: string;
  issueDate: string;
  expiryDate: string;
  memberStatus: "Active" | "Inactive";
  authorisedName: string;
  authorisedDesignation: string;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface MembersResponse {
  items: Member[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  contactNumber?: string | null;
  role: "SUPERADMIN" | "ADMIN";
  status: "INVITED" | "ACTIVE" | "DEACTIVATED";
  forcePasswordChange: boolean;
  canAddMember: boolean;
  canDownloadCard: boolean;
  viewScope: "ALL" | "OWN";
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  requiresPasswordChange?: boolean;
  data: {
    user: AuthUser;
    requiresPasswordChange?: boolean;
  };
}

export interface InviteUserData {
  email: string;
  name: string;
  contactNumber?: string | null;
  role?: "SUPERADMIN" | "ADMIN";
  canAddMember?: boolean;
  canDownloadCard?: boolean;
  viewScope?: "ALL" | "OWN";
}

export interface InviteUserResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    temporaryPassword: string;
  };
}

export class ApiClient {
  public baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Ensure endpoint starts with a slash
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    const isMutating =
      options.method === "POST" ||
      options.method === "PUT" ||
      options.method === "PATCH";

    const body =
      options.body !== undefined
        ? options.body
        : isMutating
        ? JSON.stringify({})
        : undefined;

    const headers: Record<string, string> = {
      ...(isMutating || body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers as Record<string, string>),
    };

    try {
      const res = await fetch(url, {
        ...options,
        credentials: "include", // CRITICAL: Required to send/receive secure HttpOnly cookies
        headers,
        body,
      });

      if (!res.ok) {
        // Handle graceful 401 for initial load
        if (res.status === 401 && cleanEndpoint === "/auth/me") {
          return null as T;
        }

        const errBody = await res.json().catch(() => ({}));
        const errorMessage =
          errBody.error || errBody.message || `HTTP ${res.status}: ${res.statusText}`;

        // Create a custom error object that includes the status code
        const error = new Error(errorMessage);
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }

      // Handle 204 No Content gracefully
      if (res.status === 204) {
        return {} as T;
      }

      return (await res.json()) as T;
    } catch (error: unknown) {
      const err = error as Error & { status?: number };

      // Swallow 401s specifically for the initial session check
      if (err.status === 401 && cleanEndpoint === "/auth/me") {
        return null as T;
      }

      // Only log to console if it's a 5xx error or a network failure (no status)
      if (!err.status || err.status >= 500) {
        console.error(`[API Client] Error fetching ${cleanEndpoint}:`, err.message);
      }

      throw err; // Always re-throw so the component can show a toast
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return ApiClient.request<T>(endpoint, options);
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data !== undefined ? (typeof data === "string" ? data : JSON.stringify(data)) : JSON.stringify({}),
    });
  }

  async put<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data !== undefined ? (typeof data === "string" ? data : JSON.stringify(data)) : JSON.stringify({}),
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data !== undefined ? (typeof data === "string" ? data : JSON.stringify(data)) : JSON.stringify({}),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  async getSettings(): Promise<{ success: boolean; data: CardSettings }> {
    return this.get("/settings");
  }

  async updateSettings(
    data: Partial<CardSettings> & { oldLogoUrl?: string; oldSignatureUrl?: string }
  ): Promise<{ success: boolean; data: CardSettings }> {
    return this.put("/settings", data);
  }

  async getBloodGroups(): Promise<{ success: boolean; data: BloodGroup[] }> {
    return this.get("/blood-groups");
  }

  async getNextMemberId(): Promise<{ success: boolean; data: { nextMemberId: string } }> {
    return this.get("/members/next-id");
  }

  // ================= Auth Methods =================
  async login(data: { email: string; password: string }): Promise<LoginResponse> {
    return this.post("/auth/login", data);
  }

  async updatePassword(data: {
    oldPassword?: string;
    newPassword: string;
    confirmPassword?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.post("/auth/update-password", data);
  }

  async getMe(): Promise<{ success: boolean; data: AuthUser } | null> {
    return this.get("/auth/me");
  }

  async changePassword(data: {
    currentPassword?: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.patch("/auth/change-password", data);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.post("/auth/logout");
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.post("/auth/forgot-password", { email });
  }

  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.post("/auth/reset-password", data);
  }

  // ================= User Management Methods (Superadmin) =================
  async getUsers(params?: {
    cursor?: string;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc" | string;
  }): Promise<{
    success: boolean;
    data: AuthUser[];
    nextCursor?: string | null;
    hasMore?: boolean;
  }> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.sortOrder) query.set("sortOrder", params.sortOrder);
    const qs = query.toString();
    return this.get(`/users${qs ? `?${qs}` : ""}`);
  }

  async inviteUser(data: InviteUserData): Promise<InviteUserResponse> {
    return this.post("/users/invite", data);
  }

  async updateUserPermissions(
    id: string,
    data: {
      canAddMember?: boolean;
      canDownloadCard?: boolean;
      viewScope?: "ALL" | "OWN";
    }
  ): Promise<{ success: boolean; data: AuthUser }> {
    return this.patch(`/users/${id}/permissions`, data);
  }

  async updateUserStatus(
    id: string,
    status: "ACTIVE" | "DEACTIVATED"
  ): Promise<{ success: boolean; data: AuthUser }> {
    return this.patch(`/users/${id}/status`, { status });
  }

  async updateUserRole(
    id: string,
    role: "SUPERADMIN" | "ADMIN"
  ): Promise<{ success: boolean; data: AuthUser }> {
    return this.patch(`/users/${id}/role`, { role });
  }

  async updateUser(
    id: string,
    data: {
      name?: string;
      contactNumber?: string | null;
      role?: "SUPERADMIN" | "ADMIN";
      canAddMember?: boolean;
      canDownloadCard?: boolean;
      viewScope?: "ALL" | "OWN";
      status?: "ACTIVE" | "DEACTIVATED" | "INVITED";
    }
  ): Promise<{ success: boolean; data: AuthUser; message?: string }> {
    return this.patch(`/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return this.delete(`/users/${id}`);
  }

  async bulkDeleteUsers(
    ids: string[]
  ): Promise<{ success: boolean; message: string; count: number }> {
    return this.post("/users/bulk-delete", { ids });
  }

  // ================= Member Methods =================
  async getMembers(params?: {
    cursor?: string;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc" | string;
    includeDeleted?: boolean;
    search?: string;
  }): Promise<{
    success: boolean;
    data: Member[];
    items: Member[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.status) query.set("status", params.status);
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.sortOrder) query.set("sortOrder", params.sortOrder);
    if (params?.includeDeleted) query.set("includeDeleted", "true");
    if (params?.search) query.set("search", params.search);

    const qs = query.toString();
    const res = await this.get<{
      success: boolean;
      data: Member[];
      items?: Member[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/members${qs ? `?${qs}` : ""}`);

    const items = Array.isArray(res.data) ? res.data : (res.items || []);
    return {
      success: res.success,
      data: items,
      items,
      nextCursor: res.nextCursor,
      hasMore: res.hasMore,
    };
  }

  async getMemberById(id: string): Promise<{
    success: boolean;
    data: { member: Member; settings: CardSettings };
  }> {
    return this.get(`/members/${id}`);
  }

  async createMember(data: unknown): Promise<{ success: boolean; data: Member }> {
    return this.post("/members", data);
  }

  async updateMember(id: string, data: unknown): Promise<{ success: boolean; data: Member }> {
    return this.put(`/members/${id}`, data);
  }

  async deleteMember(id: string): Promise<{ success: boolean; data: Member }> {
    return this.delete(`/members/${id}`);
  }

  async restoreMember(id: string): Promise<{ success: boolean; data: Member }> {
    return this.patch(`/members/${id}/restore`);
  }

  async permanentDeleteMember(id: string): Promise<{ success: boolean; message: string }> {
    return this.delete(`/members/${id}/permanent`);
  }

  async bulkSoftDeleteMembers(ids: string[]): Promise<{ success: boolean; message: string }> {
    return this.post("/members/bulk-delete", { ids });
  }

  async bulkRestoreMembers(ids: string[]): Promise<{ success: boolean; message: string }> {
    return this.post("/members/bulk-restore", { ids });
  }

  async bulkPermanentDeleteMembers(ids: string[]): Promise<{ success: boolean; message: string }> {
    return this.post("/members/bulk-permanent-delete", { ids });
  }

  async uploadImage(file: File, folder: string = "foe"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const url = `${this.baseUrl}/upload`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      const errorMsg =
        data.message ||
        data.error ||
        (res.status >= 500
          ? "Image upload failed. Please try again."
          : `Upload failed: ${res.statusText}`);
      throw new Error(errorMsg);
    }

    if (!data.url) {
      throw new Error("Upload failed: No image URL returned");
    }

    return data.url;
  }

  getProxyImageUrl(imageUrl: string): string {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("/")) return imageUrl;
    return `${this.baseUrl}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  }
}

export const api = new ApiClient(API_BASE_URL);
