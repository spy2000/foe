"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserPlus, Settings, Menu, X } from "lucide-react";
import { useCardSettings } from "@/context/SettingsContext";

export default function Navbar() {
  const pathname = usePathname();
  const { settings } = useCardSettings();
  const [imgError, setImgError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/members", label: "Members", icon: Users },
    { href: "/members/create", label: "Add Member", icon: UserPlus },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const trustName = settings?.trustName || "FRIENDS OF EDUCATION";
  const tag = settings?.trustSubtitle?.toUpperCase().includes("TRUST")
    ? "TRUST"
    : settings?.trustSubtitle || "TRUST";

  const logoUrl = settings?.logoUrl || "/logo.png";

  return (
    <nav className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 backdrop-blur-md w-full max-w-full overflow-hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand / Logo with graceful text truncation */}
        <Link href="/members" className="flex items-center gap-2.5 min-w-0 group">
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

        {/* Desktop Navigation Items */}
        <div className="hidden md:flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href === "/members" && pathname === "/") ||
              (href !== "/members" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Hamburger Menu Toggle Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-700" />
            ) : (
              <Menu className="h-5 w-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-orange-100 bg-white/98 px-4 pt-2.5 pb-4 space-y-1.5 shadow-lg backdrop-blur-md">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href === "/members" && pathname === "/") ||
              (href !== "/members" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                    : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
