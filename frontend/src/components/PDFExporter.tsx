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
  buttonClassName?: string;
}

// Helper to fetch image as base64 via proxy or direct fetch
async function getBase64Image(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  const targetUrl = url.startsWith("http")
    ? api.getProxyImageUrl(url)
    : url;

  try {
    const res = await fetch(targetUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Failed fetching image as base64:", url, err);
    return url;
  }
}

export default function PDFExporter({
  containerId = "pdf-capture-stage",
  fileName,
  memberId,
  memberName,
  buttonClassName,
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
      // 1. Preload and convert all images in the container to base64 through proxy to avoid CORS taint
      const images = Array.from(container.querySelectorAll("img"));
      await Promise.all(
        images.map(async (img) => {
          const currentSrc = img.getAttribute("src") || img.src;
          if (currentSrc && !currentSrc.startsWith("data:")) {
            const b64 = await getBase64Image(currentSrc);
            if (b64 && b64.startsWith("data:")) {
              img.src = b64;
            }
          }
        })
      );

      // 2. Ensure all images are fully loaded and decoded in the DOM
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalHeight !== 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(resolve, 1500); // 1.5s safety timeout
              }
            })
        )
      );

      // Short wait for repaint
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Render container with scale: 3 for crisp 300+ DPI clarity
      const canvas = await html2canvas(container, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          // 1. Inject standard Web Safe Fonts (Arial/Impact) to prevent font-rendering dropouts
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

          // 2. Fallback color maps
          const brandOrange = "#F15A24";
          const brandBrown = "#3B1B0B";
          const textDark = "#222222";
          const textMuted = "#555555";
          const borderLight = "#e5e7eb";

          // Helper to check unsupported color function (lab, oklab, lch, oklch)
          const isUnsupportedColor = (val: string | null | undefined): boolean => {
            if (!val) return false;
            const str = String(val).toLowerCase();
            return str.includes("lab") || str.includes("lch");
          };

          // 3. Target all elements in the cloned document
          const elements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            if (!el || !el.style) continue;

            const computedStyle = window.getComputedStyle(el);
            const tag = el.tagName.toLowerCase();

            // Sanitize background colors
            if (isUnsupportedColor(computedStyle.backgroundColor)) {
              if (tag === "svg" || tag === "path" || tag === "rect" || tag === "circle") continue;
              const className = typeof el.className === "string" ? el.className : "";
              if (className.includes("F15A24") || className.includes("orange")) {
                el.style.backgroundColor = brandOrange;
              } else if (className.includes("3B1B0B") || className.includes("brown")) {
                el.style.backgroundColor = brandBrown;
              } else {
                el.style.backgroundColor = "#ffffff";
              }
            }

            // Sanitize text colors
            if (isUnsupportedColor(computedStyle.color)) {
              const className = typeof el.className === "string" ? el.className : "";
              if (className.includes("white")) {
                el.style.color = "#ffffff";
              } else if (className.includes("F15A24") || className.includes("orange")) {
                el.style.color = brandOrange;
              } else if (className.includes("555555") || className.includes("gray-500") || className.includes("gray-600")) {
                el.style.color = textMuted;
              } else {
                el.style.color = textDark;
              }
            }

            // Sanitize borders
            if (isUnsupportedColor(computedStyle.borderColor)) {
              el.style.borderColor = borderLight;
            }

            // Sanitize outlines
            if (isUnsupportedColor(computedStyle.outlineColor)) {
              el.style.outlineColor = "transparent";
            }
          }

          // 4. Hard-override SVG fills and strokes inside the clone to prevent lab() crashes inside paths
          const svgs = clonedDoc.querySelectorAll("svg path, svg rect, svg circle, svg polygon, svg line");
          svgs.forEach((path: Element) => {
            const fill = path.getAttribute("fill");
            if (isUnsupportedColor(fill)) {
              path.setAttribute("fill", brandBrown);
            }
            const stroke = path.getAttribute("stroke");
            if (isUnsupportedColor(stroke)) {
              path.setAttribute("stroke", brandOrange);
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

  const defaultButtonClass =
    "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F15A24] to-[#EA580C] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer";

  return (
    <button
      onClick={handleDownloadPDF}
      disabled={isExporting}
      className={buttonClassName || defaultButtonClass}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
      ) : (
        <Download className="w-4 h-4 shrink-0" />
      )}
      <span>{isExporting ? "Rendering PDF..." : "Download PDF"}</span>
    </button>
  );
}
