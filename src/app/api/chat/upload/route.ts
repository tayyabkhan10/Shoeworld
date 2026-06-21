import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return errorResponse("No file provided", 422);

  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) return errorResponse("Only image or video allowed", 422);

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: "chat-uploads",
      resource_type: isVideo ? "video" : "image",
    });

    return successResponse({
      url: result.secure_url,
      mediaType: isVideo ? "video" : "image",
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return errorResponse("Upload failed", 500);
  }
}