import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    // Sanitize folder — whitelist allowed folders
    const allowedFolders = ["products", "banners", "categories", "occasions", "assets", "uploads", "addons"];
    const cleanFolder = folder.replace(/[^a-zA-Z0-9-_]/g, "");
    if (!allowedFolders.includes(cleanFolder)) {
      return NextResponse.json({ success: false, message: "Invalid upload folder" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: "Invalid file type" }, { status: 400 });
    }

    // Derive extension from MIME type, not filename
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "video/mp4": "mp4",
    };

    // Validate size (5MB for images, 25MB for video)
    const maxSize = file.type.startsWith("video/") ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, message: "File too large" }, { status: 400 });
    }

    // Upload to Cloudinary if configured, otherwise fall back to local storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let url: string;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await uploadToCloudinary(buffer, {
        folder: `blissbakery/${cleanFolder}`,
        filename: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      });
      url = result.url;
    } else {
      // Local fallback
      const uploadDir = join(process.cwd(), "public", "uploads", cleanFolder);
      await mkdir(uploadDir, { recursive: true });
      const ext = mimeToExt[file.type] || "bin";
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);
      url = `/uploads/${cleanFolder}/${filename}`;
    }

    // Save to database
    const asset = await db.asset.create({
      data: {
        filename: file.name,
        url,
        mimeType: file.type,
        size: file.size,
        folder,
      },
    });

    return NextResponse.json({ success: true, asset: { id: asset.id, url: asset.url, filename: asset.filename } });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
