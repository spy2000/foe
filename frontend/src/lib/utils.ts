/**
 * Formats a date string to DD/MM/YYYY
 */
export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formats date to YYYY-MM-DD for input[type="date"]
 */
export function toInputDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Converts image URL to base64 Data URL using the backend proxy endpoint
 * to ensure that html2canvas NEVER gets tainted by cross-origin resources.
 */
export async function convertImageToBase64(
  url: string,
  proxyEndpoint: (u: string) => string
): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  const targetUrl = proxyEndpoint(url);
  try {
    const res = await fetch(targetUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to convert image to base64:", err);
    return url;
  }
}
