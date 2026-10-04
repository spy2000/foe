/**
 * Cloudinary Utility functions for asset lifecycle and public ID extraction
 */

export function getCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  // Match path after /upload/ (including optional version tag /v12345/) up to the extension
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  return matches ? matches[1] : null;
}
