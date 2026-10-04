import cloudinary from "../config/cloudinary";
import fs from "fs";
import path from "path";

export class UploadService {
  async uploadImage(buffer: Buffer, originalFilename: string = "image.jpg", folder: string = "foe"): Promise<string> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Check if Cloudinary credentials are fully provided
    const isCloudinaryConfigured =
      cloudName &&
      cloudName !== "your_cloud_name" &&
      apiKey &&
      apiKey !== "your_api_key" &&
      apiSecret &&
      apiSecret !== "your_api_secret";

    if (isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("Upload returned no result"));
            resolve(result.secure_url);
          }
        );
        uploadStream.end(buffer);
      });
    }

    // Fallback: If Cloudinary is not configured with live credentials, save to local uploads directory and return data URI or static URL
    console.warn("⚠️ Cloudinary credentials not set or using placeholder; falling back to Base64 Data URL for zero-friction demo");
    const mimeType = originalFilename.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }
}

export const uploadService = new UploadService();
