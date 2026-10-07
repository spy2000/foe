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
        headers,
        body,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || errBody.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      // Handle 204 No Content gracefully
      if (res.status === 204) {
        return {} as T;
      }

      return await res.json();
    } catch (error: any) {
      console.error(`[API Client] Error fetching ${cleanEndpoint}:`, error.message);
      throw error; // Re-throw for specific component handling
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

  async getMembers(params?: {
    cursor?: string;
    limit?: number;
    status?: "active" | "deleted" | "all";
    includeDeleted?: boolean;
  }): Promise<{ success: boolean; data: MembersResponse }> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.status) query.set("status", params.status);
    if (params?.includeDeleted) query.set("includeDeleted", "true");

    const qs = query.toString();
    return this.get(`/members${qs ? `?${qs}` : ""}`);
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
