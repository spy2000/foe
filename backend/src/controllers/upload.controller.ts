import { FastifyReply, FastifyRequest } from "fastify";
import cloudinary, { validateCloudinaryConfig } from "../config/cloudinary";
import { logger } from "../config/logger";

export async function uploadImageHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    // 1. Enforce Cloudinary environment check
    validateCloudinaryConfig();

    const data = await req.file({
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
      },
    });

    if (!data) {
      return reply.status(400).send({
        success: false,
        message: "No image file provided in multipart request",
      });
    }

    const buffer = await data.toBuffer();
    const folder =
      (data.fields?.folder as { value?: string } | undefined)?.value ||
      process.env.CLOUDINARY_UPLOAD_FOLDER ||
      "foe";

    // Upload to Cloudinary
    const secureUrl: string = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Upload returned empty result"));
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    });

    logger.info("Successfully uploaded image to Cloudinary folder %s: %s", folder, secureUrl);
    return reply.status(200).send({ success: true, url: secureUrl });
  } catch (err: unknown) {
    const error = err as Error;
    logger.error("Cloudinary upload failed", {
      error: error.message,
      stack: error.stack,
    });

    return reply.status(500).send({
      success: false,
      message: "Image upload failed. Cloudinary credentials invalid or missing.",
    });
  }
}

export async function proxyImageHandler(
  req: FastifyRequest<{ Querystring: { url?: string } }>,
  reply: FastifyReply
) {
  const { url } = req.query;

  if (!url) {
    return reply.status(400).send({
      success: false,
      message: "Missing image url query parameter",
    });
  }

  // Handle data URIs directly
  if (url.startsWith("data:")) {
    const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      return reply
        .header("Content-Type", contentType)
        .header("Access-Control-Allow-Origin", "*")
        .header("Cache-Control", "public, max-age=86400")
        .send(buffer);
    }
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return reply.status(response.status).send({
        success: false,
        message: `Failed to fetch remote image (status ${response.status})`,
      });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return reply
      .header("Content-Type", contentType)
      .header("Access-Control-Allow-Origin", "*")
      .header("Cache-Control", "public, max-age=86400")
      .send(buffer);
  } catch (error) {
    logger.error("Error proxying image:", error);
    return reply.status(500).send({
      success: false,
      message: "Failed to proxy image",
    });
  }
}
