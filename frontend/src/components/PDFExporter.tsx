"use client";

import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Loader2 } from "lucide-react";
import { showToast } from "./Toast";
import { convertImageToBase64 } from "@/lib/utils";
import { api } from "@/lib/api";

interface PDFExporterProps {
  frontElementId?: string;
  backElementId?: string;
  containerId?: string;
  fileName?: string;
  memberId?: string;
  memberName?: string;
}

export default function PDFExporter({
  containerId = "pdf-capture-stage",
  fileName,
  memberId,
  memberName,
}: PDFExporterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = async () => {
    const container =
      document.getElementById(containerId) ||
      document.getElementById("pdf-capture-stage") ||
      document.getElementById("pdf-export-container");

    if (!container) {
      showToast("Cannot find card elements for PDF export", "error");
      return;
    }

    setIsExporting(true);
    showToast("Generating high-resolution ID Card PDF...", "success");

    try {
      // Preload and convert all images in the container to base64 through proxy to avoid CORS taint
      const images = Array.from(container.querySelectorAll("img"));
      await Promise.all(
        images.map(async (img) => {
          const currentSrc = img.src;
          if (currentSrc && !currentSrc.startsWith("data:")) {
            try {
              const b64 = await convertImageToBase64(currentSrc, (url) =>
                api.getProxyImageUrl(url)
              );
              if (b64) {
                img.setAttribute("src", b64);
              }
            } catch (err) {
              console.warn("Failed proxying image for canvas:", currentSrc, err);
            }
          }
        })
      );

      // Short wait for any DOM repaint
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Render container with scale: 4 for crisp 300+ DPI clarity
      const canvas = await html2canvas(container, {
        scale: 4,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          // Inject standard Web Safe Fonts (Arial/Impact) to prevent font-rendering dropouts
          const styleSheet = clonedDoc.createElement("style");
          styleSheet.innerHTML = `
            * {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            @font-face {
              font-family: 'Impact';
              src: local('Impact');
            }
          `;
          clonedDoc.head.appendChild(styleSheet);

          // Replace unsupported color functions like oklab/oklch with standard hex/RGB
          const elements = clonedDoc.querySelectorAll("*");
          elements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (!htmlEl || !htmlEl.style) return;
            const style = window.getComputedStyle(htmlEl);
            if (
              style.color &&
              (style.color.includes("oklab") || style.color.includes("oklch"))
            ) {
              htmlEl.style.color = "#222222";
            }
            if (
              style.backgroundColor &&
              (style.backgroundColor.includes("oklab") ||
                style.backgroundColor.includes("oklch"))
            ) {
              htmlEl.style.backgroundColor = "#F15A24";
            }
            if (
              style.borderColor &&
              (style.borderColor.includes("oklab") ||
                style.borderColor.includes("oklch"))
            ) {
              htmlEl.style.borderColor = "#e5e7eb";
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      // A5 Landscape dimensions in mm: 210 x 148
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [210, 148],
      });

      // Proportional placement centered on the page
      const marginX = 10;
      const targetWidth = 190;
      const targetHeight = (canvas.height * targetWidth) / canvas.width;
      const marginY = (148 - targetHeight) / 2;

      pdf.addImage(imgData, "PNG", marginX, marginY, targetWidth, targetHeight);

      const targetFileName = fileName || `ID_Card_${memberId || "FOE"}.pdf`;
      pdf.save(targetFileName);
      showToast("ID Card PDF downloaded successfully!", "success");
    } catch (error) {
      console.error("PDF export error:", error);
      showToast("Failed to generate PDF. Check console for details.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleDownloadPDF}
      disabled={isExporting}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F15A24] to-[#EA580C] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
    >
      {isExporting ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Download className="h-5 w-5" />
      )}
      <span>{isExporting ? "Rendering PDF..." : "Download ID Card (PDF)"}</span>
    </button>
  );
}
