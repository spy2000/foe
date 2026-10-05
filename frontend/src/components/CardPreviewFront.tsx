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
      className={`relative w-[340px] h-[540px] bg-white rounded-[20px] overflow-hidden shrink-0 box-border ${
        isPrintView ? "shadow-none border-none" : "border border-gray-300 shadow-sm"
      }`}
      style={{
        width: "340px",
        height: "540px",
        boxSizing: "border-box",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        fontFamily: "'Arial Black', 'Inter', sans-serif",
      }}
    >
      {/* A. The Convex Wave Header */}
      <div className="absolute top-0 left-0 w-[340px] h-[190px] z-0 overflow-hidden pointer-events-none">
        {/* Dark Brown Bottom Shadow Layer */}
        <svg
          viewBox="0 0 340 190"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-[190px]"
        >
          <path
            d="M0,0 L340,0 L340,120 C255,200 85,200 0,120 Z"
            fill="#3B1B0B"
          />
        </svg>
        {/* Primary Orange Layer */}
        <svg
          viewBox="0 0 340 180"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-[180px]"
        >
          <path
            d="M0,0 L340,0 L340,115 C255,190 85,190 0,115 Z"
            fill="#F15A24"
          />
        </svg>
      </div>

      {/* Header Content (Absolute inside card, z-10) */}
      {/* Logo */}
      <img
        src={logoSrc}
        alt="FOE Logo"
        className="absolute top-[12px] left-1/2 -translate-x-1/2 h-[45px] object-contain z-10 filter drop-shadow-sm"
        crossOrigin="anonymous"
        onError={() => setLogoSrc("/logo.png")}
      />

      {/* Main Title */}
      <h1
        style={{ color: "#ffffff" }}
        className="absolute top-[62px] w-full text-center text-[19px] text-white font-black tracking-wide uppercase leading-tight z-10 drop-shadow-sm"
      >
        {settings.trustName || "FRIENDS OF EDUCATION"}
      </h1>

      {/* Subtitle */}
      <p
        style={{ color: "#ffffff" }}
        className="absolute top-[88px] w-full text-center text-[11px] text-white font-bold tracking-widest uppercase z-10 leading-none"
      >
        {settings.trustSubtitle || "CHARITABLE TRUST"}
      </p>

      {/* Registration Pill */}
      <div
        style={{ backgroundColor: "#3B1B0B", color: "#ffffff" }}
        className="absolute top-[108px] left-1/2 -translate-x-1/2 bg-[#3B1B0B] text-white text-[10.5px] font-bold px-4 py-0.5 rounded-full whitespace-nowrap shadow-sm z-10"
      >
        {settings.registrationNo || "Reg. E-0040751(GBR)"}
      </div>

      {/* B. Member Photo (Overlapping the Wave Exactly 50%) */}
      <div className="absolute top-[125px] left-1/2 -translate-x-1/2 z-20">
        <div className="w-[110px] h-[130px] rounded-[14px] border-[4px] border-white shadow-md bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoSrc}
            alt={member.fullName}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={() => setPhotoSrc("/images/placeholder-avatar.png")}
          />
        </div>
      </div>

      {/* C. Name, Designation & Details Grid */}
      {/* Member Name */}
      <h2
        style={{ color: "#222222" }}
        className="absolute top-[265px] w-full text-center text-[21px] font-black text-[#222222] capitalize leading-none z-10 tracking-tight"
      >
        {toTitleCase(member.fullName || "Member Full Name")}
      </h2>

      {/* Designation */}
      <p
        style={{ color: "#555555" }}
        className="absolute top-[290px] w-full text-center text-[12px] font-bold text-[#555555] leading-tight z-10"
      >
        {member.designation || "Designation"}
      </p>

      {/* Details Grid */}
      <div className="absolute top-[340px] left-[30px] right-[30px] z-10">
        <div
          style={{ color: "#222222" }}
          className="grid grid-cols-[85px_15px_1fr] gap-y-1.5 text-[12px] font-bold text-[#222222]"
        >
          <div>ID No.</div>
          <div className="text-center">:</div>
          <div className="truncate">{member.memberId || "0001"}</div>

          <div>Blood Group</div>
          <div className="text-center">:</div>
          <div className="truncate">{bloodGroupStr}</div>

          <div>Contact</div>
          <div className="text-center">:</div>
          <div className="truncate">{member.contactNumber || "+91 9820556711"}</div>

          <div>Email</div>
          <div className="text-center">:</div>
          <div className="truncate">{member.emailId || "contact@friendsofeducation.in"}</div>
        </div>
      </div>

      {/* D. Signature Box */}
      <div className="absolute bottom-[45px] right-[30px] z-10 flex flex-col items-end">
        {hasSignature ? (
          <img
            src={settings.signatureUrl}
            alt="Authorised Signature"
            className="h-[35px] object-contain ml-auto"
            crossOrigin="anonymous"
            onError={() => setSigError(true)}
          />
        ) : (
          <div className="h-[35px]" />
        )}
        <p
          style={{ color: "#222222" }}
          className="text-[10px] font-bold text-[#222222] mt-0.5 whitespace-nowrap"
        >
          Authorised signature
        </p>
      </div>

      {/* Footer URL Banner */}
      <div
        style={{ backgroundColor: "#F15A24", color: "#ffffff" }}
        className="absolute bottom-0 left-0 w-full h-[35px] bg-[#F15A24] rounded-b-[20px] flex items-center justify-center text-[12px] font-bold text-white tracking-wide z-10"
      >
        <span>{settings.websiteUrl || "www.friendsofeducation.in"}</span>
      </div>
    </div>
  );
}
