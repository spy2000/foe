"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, KeyRound, ChevronDown, ShieldCheck, Shield } from "lucide-react";
import { AuthUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface UserDropdownProps {
  user: AuthUser;
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-left text-sm font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 transition-all cursor-pointer"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {/* Avatar / Initials */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#F15A24] to-[#EA580C] text-[11px] font-black text-white shadow-xs">
            {initials || <User className="h-4 w-4" />}
          </div>

          {/* User Name & Role Pill */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[120px]">
              {user.name}
            </span>
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wider ${
                user.role === "SUPERADMIN" ? "text-amber-600" : "text-blue-600"
              }`}
            >
              {user.role}
            </span>
          </div>

          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* User Meta header */}
            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                    user.role === "SUPERADMIN"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}
                >
                  {user.role === "SUPERADMIN" ? (
                    <ShieldCheck className="h-3 w-3" />
                  ) : (
                    <Shield className="h-3 w-3" />
                  )}
                  {user.role}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/update-password"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#F15A24] transition-colors cursor-pointer"
              >
                <KeyRound className="h-4 w-4 text-gray-400 group-hover:text-[#F15A24]" />
                <span>Change Password</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
