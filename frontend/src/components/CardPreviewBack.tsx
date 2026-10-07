"use client";

import React from "react";
import { UsersRound, ShieldCheck, Phone } from "lucide-react";

export interface CardPreviewBackProps {
  settings: {
    trustName: string;
    trustSubtitle: string;
    registrationNo: string;
    logoUrl?: string;
    websiteUrl: string;
    aboutUsText?: string;
    validityClause?: string;
    returnNote?: string;
    defaultEmergencyContact?: string;
  };
  member?: {
    emergencyContactNumber?: string;
  };
  emergencyContactNumber?: string;
  scale?: number;
  id?: string;
  isPrint?: boolean;
  isPrintMode?: boolean;
}

export default function CardPreviewBack({
  settings,
  member,
  emergencyContactNumber,
  scale = 1,
  id = "id-card-back",
  isPrint = false,
  isPrintMode = false,
}: CardPreviewBackProps) {
  const isPrintView = isPrint || isPrintMode;
  const rawContact =
    emergencyContactNumber ||
    member?.emergencyContactNumber ||
    settings.defaultEmergencyContact ||
    "9136643813";

  // Enforce clean +91 prefix formatting for display without duplicate prefixes
  const cleanContact = rawContact.replace(/^\+?91\s*/, "").trim();
  const formattedContact = cleanContact ? `+91 ${cleanContact}` : "+91 9136643813";

  return (
    <div
      id={id}
      className={`relative w-[340px] h-[536px] bg-white rounded-[20px] overflow-hidden border border-gray-300 shrink-0 box-border ${
        isPrintView ? "shadow-none" : "shadow-sm"
      }`}
      style={{
        width: "340px",
        height: "536px",
        boxSizing: "border-box",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        fontFamily: "'Arial Black', 'Inter', sans-serif",
      }}
    >
      {/* A. Convex Scoop Header Curves */}
      <div className="absolute top-0 left-0 w-full h-[120px] z-0 overflow-hidden pointer-events-none">
        {/* Dark Brown Shadow Layer */}
        <svg
          viewBox="0 0 340 120"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-[120px]"
        >
          <path
            d="M0,0 L340,0 L340,75 C255,120 85,120 0,75 Z"
            fill="#3B1B0B"
          />
        </svg>
        {/* Primary Orange Layer */}
        <svg
          viewBox="0 0 340 110"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-[110px]"
        >
          <path
            d="M0,0 L340,0 L340,65 C255,110 85,110 0,65 Z"
            fill="#F15A24"
          />
        </svg>
      </div>

      {/* Header Content */}
      <h1
        style={{ color: "#ffffff" }}
        className="absolute top-[12px] w-full text-center text-[18px] text-white font-black tracking-wide uppercase leading-tight z-10 drop-shadow-sm"
      >
        {settings.trustName || "FRIENDS OF EDUCATION"}
      </h1>
      <p
        style={{ color: "#ffffff" }}
        className="absolute top-[34px] w-full text-center text-[10.5px] text-white font-bold tracking-widest uppercase z-10 leading-none"
      >
        {settings.trustSubtitle || "CHARITABLE TRUST"}
      </p>

      {/* Registration Pill */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 flex justify-center z-10"
        style={{ top: isPrintView ? '75px' : '65px' }}
      >
        <div
          style={{ backgroundColor: "#3B1B0B", color: "#ffffff" }}
          className="bg-[#3B1B0B] text-white text-[10.5px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap"
        >
          {settings.registrationNo || "Reg. E-0040751(GBR)"}
        </div>
      </div>

      {/* Container for Clauses (Explicit Div Underlines - Fixes html2canvas strikethrough bug) */}
      <div className="absolute top-[130px] left-[20px] right-[20px] flex flex-col gap-6 z-20">
        {/* Item 1: ABOUT US */}
        <div className="flex items-start gap-3 w-full">
          <div
            style={{ backgroundColor: "#F15A24", borderColor: "#ffffff" }}
            className="w-[40px] h-[40px] rounded-full bg-[#F15A24] flex items-center justify-center shrink-0 border-[2px] border-white shadow-sm mt-0.5"
          >
            <UsersRound className="w-5 h-5 text-white" color="#ffffff" />
          </div>

          <div className="block flex-1 min-w-0">
            {/* 1. Title Block */}
            <div
              style={{ color: "#222222" }}
              className="text-[13px] font-black text-[#222] uppercase tracking-tight w-full"
            >
              ABOUT US
            </div>
            {/* 2. Explicit Line Block (Fixes PDF Bug) */}
            <div
              style={{ backgroundColor: "#555555" }}
              className="h-[2px] w-[95%] bg-[#555] mt-1 mb-1.5"
            />
            {/* 3. Text Block */}
            <div
              style={{ color: "#222222" }}
              className="text-[11px] text-[#222] font-semibold leading-relaxed"
            >
              {settings.aboutUsText ||
                "Friends Of Education Charitable Trust is committed to supporting education and empowering lives for a better tomorrow."}
            </div>
          </div>
        </div>

        {/* Item 2: THIS CARD IS VALID FOR */}
        <div className="flex items-start gap-3 w-full">
          <div
            style={{ backgroundColor: "#F15A24", borderColor: "#ffffff" }}
            className="w-[40px] h-[40px] rounded-full bg-[#F15A24] flex items-center justify-center shrink-0 border-[2px] border-white shadow-sm mt-0.5"
          >
            <ShieldCheck className="w-5 h-5 text-white" color="#ffffff" />
          </div>

          <div className="block flex-1 min-w-0">
            {/* 1. Title Block */}
            <div
              style={{ color: "#222222" }}
              className="text-[13px] font-black text-[#222] uppercase tracking-tight w-full"
            >
              THIS CARD IS VALID FOR
            </div>
            {/* 2. Explicit Line Block (Fixes PDF Bug) */}
            <div
              style={{ backgroundColor: "#555555" }}
              className="h-[2px] w-[95%] bg-[#555] mt-1 mb-1.5"
            />
            {/* 3. Text Block */}
            <div
              style={{ color: "#222222" }}
              className="text-[11px] text-[#222] font-semibold leading-relaxed"
            >
              {settings.validityClause ||
                "Official use only by authorised members of the trust."}
            </div>
          </div>
        </div>

        {/* Item 3: EMERGENCY CONTACT */}
        <div className="flex items-start gap-3 w-full">
          <div
            style={{ backgroundColor: "#F15A24", borderColor: "#ffffff" }}
            className="w-[40px] h-[40px] rounded-full bg-[#F15A24] flex items-center justify-center shrink-0 border-[2px] border-white shadow-sm mt-0.5"
          >
            <Phone className="w-5 h-5 text-white" color="#ffffff" />
          </div>

          <div className="block flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 w-full border-b-[2px] border-[#555] pb-0.5 mb-1 min-w-0 pr-1">
              <span 
                style={{ color: "#222222" }}
                className={`font-black text-[#222] uppercase whitespace-nowrap ${
                  isPrintView ? 'text-[11px] tracking-tighter' : 'text-[12px] tracking-tight'
                }`}
              >
                IN CASE OF EMERGENCY, CONTACT
              </span>
            </div>
            <div
              style={{ color: "#222222" }}
              className="text-[14px] font-black text-[#222] tracking-wide mt-0.5 pb-1 leading-normal"
            >
              {formattedContact}
            </div>
          </div>
        </div>
      </div>

      {/* C. PDF-Safe Footer Separator */}
      <div className="absolute bottom-[42px] left-0 w-full text-center z-20 px-4">
        <div className="w-full text-center whitespace-nowrap mb-2">
          <span
            style={{ backgroundColor: "#555555" }}
            className="inline-block align-middle w-[100px] h-[1.5px] bg-[#555]"
          />
          <span
            style={{ backgroundColor: "#F15A24" }}
            className="inline-block align-middle w-[6px] h-[6px] rounded-full bg-[#F15A24] mx-2"
          />
          <span
            style={{ backgroundColor: "#555555" }}
            className="inline-block align-middle w-[100px] h-[1.5px] bg-[#555]"
          />
        </div>
        <div
          style={{ color: "#222222" }}
          className="text-[9px] text-[#222] italic font-bold leading-tight px-2 whitespace-normal break-words"
        >
          {settings.returnNote ||
            "If found, please return this card to the Friends Of Education Charitable Trust at the above address or contact number"}
        </div>
      </div>

      {/* Footer URL Banner with dark brown top border */}
      <div
        style={{
          backgroundColor: "#F15A24",
          borderTopColor: "#3B1B0B",
          color: "#ffffff",
        }}
        className="absolute bottom-0 left-0 w-full h-[36px] bg-[#F15A24] border-t-[3px] border-[#3B1B0B] flex items-center justify-center z-20"
      >
        <span 
          style={{ 
            color: "#ffffff",
            lineHeight: isPrintView ? '33px' : 'normal',
            display: isPrintView ? 'block' : 'inline'
          }}
          className="text-[12px] font-bold text-white tracking-wide text-center w-full"
        >
          {settings.websiteUrl || "www.friendsofeducation.in"}
        </span>
      </div>
    </div>
  );
}
