"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/components/Toast";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isInitialized, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (user && user.status === "DEACTIVATED") return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // 1. Not logged in -> Redirect to login (unless on public route)
    if (!user && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    // 2. Logged in, but trying to access public route -> Redirect to dashboard
    if (user && isPublicRoute) {
      router.replace("/members");
      return;
    }

    // 3. Logged in, BUT needs password change -> Lock them to /create-password
    if (user && user.forcePasswordChange && pathname !== "/create-password") {
      router.replace("/create-password");
      return;
    }

    // 4. Fully active user trying to access the first-time setup route -> block them
    if (user && !user.forcePasswordChange && pathname === "/create-password") {
      router.replace("/members");
      return;
    }

    // 5. Admin trying to access Superadmin areas
    if (
      user &&
      user.role !== "SUPERADMIN" &&
      (pathname.startsWith("/settings") || pathname.startsWith("/admin"))
    ) {
      showToast("You don't have permission to access this page.", "error");
      router.replace("/members");
      return;
    }

    // 6. Restrict Add/Edit Member routes based on permissions
    if (
      user &&
      (pathname.startsWith("/members/add") ||
        pathname.startsWith("/members/create") ||
        pathname.includes("/edit"))
    ) {
      if (!user.canAddMember && user.role !== "SUPERADMIN") {
        showToast("You don't have permission to access this page.", "error");
        router.replace("/members");
        return;
      }
    }
  }, [user, isLoading, pathname, router]);

  const renderSkeleton = () => (
    <div className="fixed inset-0 z-50 min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Mock Navbar Skeleton */}
      <div className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-4 w-full shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-4 hidden md:flex">
          <div className="w-20 h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      {/* Mock Page Content Skeleton */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="w-48 h-8 bg-gray-200 rounded mb-6 animate-pulse"></div>
        <div className="w-full h-[400px] bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse"></div>
      </div>
    </div>
  );

  // Only show the hard-refresh skeleton if the app is loading for the VERY FIRST TIME
  if (isLoading && !isInitialized) {
    return renderSkeleton();
  }

  // Full-Screen Deactivation Block
  if (user && user.status === "DEACTIVATED") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 w-full absolute inset-0 z-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[#222]">Account Deactivated</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your access to the ID Card Portal has been revoked. If you believe this is a mistake, please contact the Superadmin.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Prevent flash of protected or restricted content during route redirect
  if (!user && !isPublicRoute) {
    return renderSkeleton();
  }

  if (user && isPublicRoute) {
    return renderSkeleton();
  }

  if (user && user.forcePasswordChange && pathname !== "/create-password") {
    return renderSkeleton();
  }

  if (user && !user.forcePasswordChange && pathname === "/create-password") {
    return renderSkeleton();
  }

  if (
    user &&
    user.role !== "SUPERADMIN" &&
    (pathname.startsWith("/settings") || pathname.startsWith("/admin"))
  ) {
    return renderSkeleton();
  }

  if (
    user &&
    !user.canAddMember &&
    user.role !== "SUPERADMIN" &&
    (pathname.startsWith("/members/add") ||
      pathname.startsWith("/members/create") ||
      pathname.includes("/edit"))
  ) {
    return renderSkeleton();
  }

  return <>{children}</>;
}
