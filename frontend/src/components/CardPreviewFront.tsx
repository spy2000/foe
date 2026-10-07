"use client";

import React, { useState } from "react";

export interface CardPreviewFrontProps {
  member: {
    memberId: string;
    fullName: string;
    designation: string;
    contactNumber: string;
    emailId: string;
    photoPath: string;
    bloodGroup?: { bloodGroup: string } | string;
  };
  settings: {
    trustName: string;
    trustSubtitle: string;
    registrationNo: string;
    logoUrl?: string;
    signatureUrl?: string;
    websiteUrl?: string;
  };
  scale?: number;
  id?: string;
  isPrint?: boolean;
  isPrintMode?: boolean;
}

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CardPreviewFront({
  member,
  settings,
  scale = 1,
  id = "id-card-front",
  isPrint = false,
  isPrintMode = false,
}: CardPreviewFrontProps) {
  const isPrintView = isPrint || isPrintMode;
  const [logoSrc, setLogoSrc] = useState(settings.logoUrl || "/logo.png");
  const [photoSrc, setPhotoSrc] = useState(
    member.photoPath || "/images/placeholder-avatar.png"
  );
  const [sigError, setSigError] = useState(false);

  const bloodGroupStr =
    typeof member.bloodGroup === "object" && member.bloodGroup !== null
      ? member.bloodGroup.bloodGroup
      : typeof member.bloodGroup === "string"
      ? member.bloodGroup
      : "B+";

  const hasSignature =
    settings.signatureUrl &&
    settings.signatureUrl.trim() !== "" &&
    !sigError;

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
      {/* A. The Deep Convex Wave Header (Takes up ~45% of card) */}
      <div className="absolute top-0 left-0 w-full h-[250px] z-0 overflow-hidden pointer-events-none">
        {/* Dark Brown Bottom Shadow Layer */}
        <svg
          viewBox="0 0 340 250"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-[250px]"
        >
          <path
            d="M0,0 L340,0 L340,160 C255,250 85,250 0,160 Z"
            fill="#3B1B0B"
          />
        </svg>
        {/* Primary Orange Layer */}
        <svg
          viewBox="0 0 340 240"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-[240px]"
        >
          <path
            d="M0,0 L340,0 L340,150 C255,240 85,240 0,150 Z"
            fill="#F15A24"
          />
        </svg>
      </div>

      {/* Header Content (Zero transforms - Inline-block centered for html2canvas) */}
      {/* Logo */}
      <div className="absolute top-[20px] left-0 w-full text-center z-10">
        <img
          src={logoSrc}
          alt="FOE Logo"
          className="inline-block h-[48px] object-contain filter drop-shadow-sm"
          crossOrigin="anonymous"
          onError={() => setLogoSrc("/logo.png")}
        />
      </div>

      {/* Main Title */}
      <h1
        style={{ color: "#ffffff" }}
        className="absolute top-[75px] w-full text-center text-[22px] text-white font-black tracking-wide uppercase drop-shadow-sm z-10 leading-tight"
      >
        {settings.trustName || "FRIENDS OF EDUCATION"}
      </h1>

      {/* Subtitle */}
      <p
        style={{ color: "#ffffff" }}
        className="absolute top-[102px] w-full text-center text-[13px] text-white font-bold tracking-widest uppercase z-10 leading-none"
      >
        {settings.trustSubtitle || "CHARITABLE TRUST"}
      </p>

      {/* Registration Pill */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 flex justify-center z-10"
        style={{ top: isPrintView ? '135px' : '125px' }} 
      >
        <div
          style={{ backgroundColor: "#3B1B0B", color: "#ffffff" }}
          className="bg-[#3B1B0B] text-white text-[11px] font-bold px-4 py-0.5 rounded-full shadow-sm whitespace-nowrap"
        >
          {settings.registrationNo || "Reg. E-0040751(GBR)"}
        </div>
      </div>

      {/* Photo */}
      <div className="absolute top-[155px] left-1/2 -translate-x-1/2 flex justify-center z-20">
        <img
          src={photoSrc}
          alt={member.fullName}
          className="w-[96px] h-[116px] rounded-[14px] border-[3px] border-white shadow-md object-cover bg-gray-100"
          crossOrigin="anonymous"
          onError={() => setPhotoSrc("/images/placeholder-avatar.png")}
        />
      </div>

      {/* Name & Designation - Shifted Up */}
      <div
        style={{ color: "#222222" }}
        className="absolute top-[280px] left-0 w-full text-center text-[21px] font-black text-[#222] capitalize leading-none tracking-tight z-10"
      >
        {toTitleCase(member.fullName || "Member Full Name")}
      </div>
      <div
        style={{ color: "#444444" }}
        className="absolute top-[305px] left-0 w-full text-center text-[12px] font-bold text-[#444] z-10"
      >
        {member.designation || "Designation"}
      </div>

      {/* Details Grid */}
      <div className="absolute top-[335px] left-[20px] w-[215px] z-20">
        <div
          style={{ color: "#222222" }}
          className="grid grid-cols-[85px_10px_1fr] gap-y-1 w-full items-start text-[12px] font-bold text-[#222222]"
        >
          {/* ID Row */}
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] whitespace-nowrap pb-1 leading-normal">ID No.</span>
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] text-center pb-1 leading-normal">:</span>
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] truncate pb-1 leading-normal">{member.memberId || "0001"}</span>

          {/* Blood Group Row */}
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] whitespace-nowrap pb-1 leading-normal">Blood Group</span>
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] text-center pb-1 leading-normal">:</span>
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] truncate pb-1 leading-normal">{bloodGroupStr}</span>

          {/* Contact Row */}
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] whitespace-nowrap pb-1 leading-normal">Contact</span>
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] text-center pb-1 leading-normal">:</span>
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] truncate pb-1 leading-normal">{member.contactNumber || "+91 9820556711"}</span>

          {/* Email Row */}
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] whitespace-nowrap pb-1 leading-normal">Email</span>
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] text-center pb-1 leading-normal">:</span>
          <span style={{ color: "#222222" }} className="text-[12px] font-bold text-[#222] break-words pb-1 leading-normal pr-1">
            {member.emailId || "contact@friendsofeducation.in"}
          </span>
        </div>
      </div>

      {/* Signature - Safely in the bottom right corner */}
      <div className="absolute bottom-[40px] right-[15px] w-[110px] text-right z-30">
        {hasSignature ? (
          <img
            src={settings.signatureUrl}
            alt="Signature"
            className="inline-block h-[38px] max-w-full object-contain object-right"
            crossOrigin="anonymous"
            onError={() => setSigError(true)}
          />
        ) : (
          <div className="h-[38px]" />
        )}
        <div
          style={{ color: "#222222" }}
          className="text-[10px] font-bold text-[#222] mt-0.5 whitespace-nowrap text-right w-full"
        >
          Authorised signature
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
