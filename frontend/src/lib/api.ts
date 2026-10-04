const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  }

  async getSettings(): Promise<{ success: boolean; data: CardSettings }> {
    return this.request("/settings");
  }

  async updateSettings(
    data: Partial<CardSettings> & { oldLogoUrl?: string; oldSignatureUrl?: string }
  ): Promise<{ success: boolean; data: CardSettings }> {
    return this.request("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getBloodGroups(): Promise<{ success: boolean; data: BloodGroup[] }> {
    return this.request("/blood-groups");
  }

  async getNextMemberId(): Promise<{ success: boolean; data: { nextMemberId: string } }> {
    return this.request("/members/next-id");
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
    return this.request(`/members${qs ? `?${qs}` : ""}`);
  }

  async getMemberById(id: string): Promise<{
    success: boolean;
    data: { member: Member; settings: CardSettings };
  }> {
    return this.request(`/members/${id}`);
  }

  async createMember(data: unknown): Promise<{ success: boolean; data: Member }> {
    return this.request("/members", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMember(id: string, data: unknown): Promise<{ success: boolean; data: Member }> {
    return this.request(`/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMember(id: string): Promise<{ success: boolean; data: Member }> {
    return this.request(`/members/${id}`, {
      method: "DELETE",
    });
  }

  async restoreMember(id: string): Promise<{ success: boolean; data: Member }> {
    return this.request(`/members/${id}/restore`, {
      method: "PATCH",
    });
  }

  async permanentDeleteMember(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/members/${id}/permanent`, {
      method: "DELETE",
    });
  }

  async bulkSoftDeleteMembers(ids: string[]): Promise<{ success: boolean; message: string }> {
    return this.request("/members/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  async bulkRestoreMembers(ids: string[]): Promise<{ success: boolean; message: string }> {
    return this.request("/members/bulk-restore", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  async bulkPermanentDeleteMembers(ids: string[]): Promise<{ success: boolean; message: string }> {
    return this.request("/members/bulk-permanent-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
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
