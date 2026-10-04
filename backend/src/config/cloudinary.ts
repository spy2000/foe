import { v2 as cloudinary } from "cloudinary";

export function validateCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name" ||
    process.env.CLOUDINARY_API_KEY === "your_api_key" ||
    process.env.CLOUDINARY_API_SECRET === "your_api_secret"
  ) {
    throw new Error("Missing or invalid Cloudinary configuration credentials in .env");
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
