"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  UserPlus,
  Settings,
  ShieldCheck,
  Menu,
  X,
  LogIn,
  KeyRound,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCardSettings } from "@/context/SettingsContext";
import UserDropdown from "./UserDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useCardSettings();
  const [imgError, setImgError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const trustName = settings?.trustName || "FRIENDS OF EDUCATION";
  const tag = settings?.trustSubtitle?.toUpperCase().includes("TRUST")
    ? "TRUST"
    : settings?.trustSubtitle || "TRUST";
  const logoUrl = settings?.logoUrl || "/logo.png";

  const isLoginPage = pathname === "/login";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 backdrop-blur-md w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo Area */}
          <Link
            href={user ? (user.forcePasswordChange ? "/update-password" : "/members") : "/login"}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#F15A24] to-[#EA580C] shadow-md shadow-orange-200 transition-transform group-hover:scale-105 overflow-hidden p-1 shrink-0 relative">
              {!imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={trustName}
                  className="h-full w-full object-contain filter brightness-105"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-black text-white text-xs tracking-tight">
                  FOE
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-xs sm:text-sm md:text-base text-gray-900 truncate block">
                  {trustName}
                </span>
                <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700 shrink-0 hidden sm:inline-block">
                  {tag}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold truncate">
                ID Card Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user && !user.forcePasswordChange && (
            <div className="hidden md:flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
              <Link
                href="/members"
                className={`whitespace-nowrap flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  pathname === "/members" || pathname === "/"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Members</span>
              </Link>

              {user.canAddMember && (
                <Link
                  href="/members/add"
                  className={`whitespace-nowrap flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                    pathname === "/members/add" || pathname === "/members/create"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  <UserPlus className="h-4 w-4 hidden sm:block" />
                  <span>Add Member</span>
                </Link>
              )}

              {/* SUPERADMIN ONLY LINKS */}
              {user.role === "SUPERADMIN" && (
                <>
                  <Link
                    href="/admin"
                    className={`whitespace-nowrap flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                      pathname.startsWith("/admin")
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                        : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admins</span>
                  </Link>
                  <Link
                    href="/settings"
                    className={`whitespace-nowrap flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                      pathname.startsWith("/settings")
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                        : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Auth Controls */}
          <div className="flex items-center gap-2">
            {!user ? (
              <Link
                href="/login"
                className="btn-primary inline-flex items-center gap-1.5 rounded-xl bg-[#F15A24] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:bg-[#d94815] transition-colors cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            ) : user.forcePasswordChange ? (
              // ONLY show Sign Out if they are in the forced onboarding state
              <button
                type="button"
                onClick={logout}
                className="text-sm font-bold text-gray-500 hover:text-[#F15A24] cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-orange-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <>
                {/* Desktop dropdown: hidden on screens < md */}
                <div className="hidden md:block">
                  <UserDropdown user={user} />
                </div>

                {/* Mobile hamburger menu button: hidden on md+ and completely hidden on /login */}
                {!isLoginPage && (
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                    className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-2xs hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer ml-1"
                    aria-label="Toggle navigation menu"
                    aria-expanded={mobileMenuOpen}
                  >
                    {mobileMenuOpen ? (
                      <X className="h-5 w-5 text-gray-700" />
                    ) : (
                      <Menu className="h-5 w-5 text-gray-700" />
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Drawer Menu */}
        {mobileMenuOpen && user && !isLoginPage && (
          <div className="md:hidden border-t border-orange-100 bg-white px-4 pt-3 pb-5 space-y-3 shadow-xl animate-in fade-in slide-in-from-top-1">
            {/* User Profile Header in Mobile Drawer */}
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-orange-50/50 border border-orange-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#F15A24] to-[#EA580C] text-xs font-bold text-white shadow-xs shrink-0">
                {user.name.slice(0, 2).toUpperCase() || <UserIcon className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
              </div>
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                  user.role === "SUPERADMIN"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {user.role}
              </span>
            </div>

            {/* Navigation Options */}
            {!user.forcePasswordChange && (
              <div className="space-y-1">
                <Link
                  href="/members"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    pathname === "/members" || pathname === "/"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                      : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </Link>

                {user.canAddMember && (
                  <Link
                    href="/members/add"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      pathname === "/members/add" || pathname === "/members/create"
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                        : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Member</span>
                  </Link>
                )}

                {user.role === "SUPERADMIN" && (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        pathname.startsWith("/admin")
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                          : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Admins</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        pathname.startsWith("/settings")
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                          : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                      }`}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Mobile Actions: Change Password & Sign Out */}
            <div className="border-t border-gray-100 pt-2 space-y-1">
              <Link
                href="/update-password"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#F15A24] transition-colors cursor-pointer"
              >
                <KeyRound className="h-4 w-4 text-gray-400" />
                <span>Change Password</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
