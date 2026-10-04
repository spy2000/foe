"use client";

import React from "react";
import { Users, ShieldCheck, PhoneCall } from "lucide-react";

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
  const contactNo =
    emergencyContactNumber ||
    member?.emergencyContactNumber ||
    settings.defaultEmergencyContact ||
    "+91 9136643813";

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
      {/* A. The Concave Scoop Header */}
      <div className="absolute top-0 left-0 w-full h-[140px] z-0 overflow-hidden pointer-events-none">
        {/* Brown Layer */}
        <svg
          viewBox="0 0 340 140"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-[140px]"
        >
          <path
            d="M0,0 L340,0 L340,140 C255,100 85,100 0,140 Z"
            fill="#3B1B0B"
          />
        </svg>
        {/* Orange Layer */}
        <svg
          viewBox="0 0 340 130"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full h-[130px]"
        >
          <path
            d="M0,0 L340,0 L340,130 C255,90 85,90 0,130 Z"
            fill="#F15A24"
          />
        </svg>
      </div>

      {/* Header Content */}
      <h1 className="absolute top-[20px] w-full text-center text-[19px] text-white font-black tracking-wide uppercase leading-tight z-10 drop-shadow-sm">
        {settings.trustName || "FRIENDS OF EDUCATION"}
      </h1>
      <p className="absolute top-[46px] w-full text-center text-[11px] text-white font-bold tracking-widest uppercase z-10 leading-none">
        {settings.trustSubtitle || "CHARITABLE TRUST"}
      </p>

      {/* Registration Pill */}
      <div className="absolute top-[95px] left-1/2 -translate-x-1/2 bg-[#3B1B0B] text-white text-[10px] font-bold px-3 py-0.5 rounded-full z-10 whitespace-nowrap shadow-sm">
        {settings.registrationNo || "Reg. E-0040751(GBR)"}
      </div>

      {/* B. Icon List with Underlines (NO Side Lines) */}
      <div className="absolute top-[155px] left-[25px] right-[25px] flex flex-col gap-5 z-10">
        {/* Item 1: ABOUT US */}
        <div className="flex items-start gap-3.5">
          <div className="w-[36px] h-[36px] rounded-full bg-[#F15A24] flex items-center justify-center shrink-0 border-[2px] border-white shadow-sm mt-0.5">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="border-b-[1.5px] border-gray-300 pb-0.5 mb-1 w-full">
              <span className="text-[13px] font-black text-[#222222] uppercase tracking-wide">
                ABOUT US
              </span>
            </div>
            <p className="text-[10px] text-[#222222] font-semibold leading-tight line-clamp-3">
              {settings.aboutUsText ||
                "Friends Of Education Charitable Trust is committed to supporting education and empowering lives for a better tomorrow."}
            </p>
          </div>
        </div>

        {/* Item 2: THIS CARD IS VALID FOR */}
        <div className="flex items-start gap-3.5">
          <div className="w-[36px] h-[36px] rounded-full bg-[#F15A24] flex items-center justify-center shrink-0 border-[2px] border-white shadow-sm mt-0.5">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="border-b-[1.5px] border-gray-300 pb-0.5 mb-1 w-full">
              <span className="text-[13px] font-black text-[#222222] uppercase tracking-wide">
                THIS CARD IS VALID FOR
              </span>
            </div>
            <p className="text-[10px] text-[#222222] font-semibold leading-tight line-clamp-3">
              {settings.validityClause ||
                "Official use only by authorised members of the trust."}
            </p>
          </div>
        </div>

        {/* Item 3: IN CASE OF EMERGENCY, CONTACT */}
        <div className="flex items-start gap-3.5">
          <div className="w-[36px] h-[36px] rounded-full bg-[#F15A24] flex items-center justify-center shrink-0 border-[2px] border-white shadow-sm mt-0.5">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="border-b-[1.5px] border-gray-300 pb-0.5 mb-1 w-full">
              <span className="text-[13px] font-black text-[#222222] uppercase tracking-wide">
                IN CASE OF EMERGENCY, CONTACT
              </span>
            </div>
            {/* Phone number rendered in BLACK (text-[#222222]), NOT orange */}
            <p className="text-[13px] font-black text-[#222222] mt-0.5">
              {contactNo}
            </p>
          </div>
        </div>
      </div>

      {/* C. Footer Disclaimer & Banner */}
      <div className="absolute bottom-[40px] left-[25px] right-[25px] flex flex-col items-center z-10">
        {/* Line with Center Dot */}
        <div className="flex items-center justify-center w-full gap-2 mb-2 px-6">
          <div className="h-[1.5px] bg-gray-300 flex-1"></div>
          <div className="w-[6px] h-[6px] rounded-full bg-[#F15A24] shrink-0"></div>
          <div className="h-[1.5px] bg-gray-300 flex-1"></div>
        </div>
        {/* Disclaimer Text */}
        <p className="text-[9px] text-[#444444] italic font-semibold text-center leading-tight line-clamp-3">
          {settings.returnNote ||
            "If found, please return this card to the Friends Of Education Charitable Trust at the above address or contact number"}
        </p>
      </div>

      {/* Footer URL Banner */}
      <div className="absolute bottom-0 left-0 w-full h-[35px] bg-[#F15A24] rounded-b-[20px] flex items-center justify-center text-[12px] font-bold text-white tracking-wide z-10">
        <span>{settings.websiteUrl || "www.friendsofeducation.in"}</span>
      </div>
    </div>
  );
}
