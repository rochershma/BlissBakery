import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 8 * 1024 * 1024;

/** Reference photos for a custom cake request. Signed-in customers only. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: "Sign in to attach photos" }, { status: 401 });
  if (!rateLimit(`cc-upload:${session.userId}`, 15, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ success: false, message: "Too many photos — send the rest on WhatsApp" }, { status: 429 });
  }

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ success: false, message: "No photo received" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ success: false, message: "Use a JPG, PNG or WebP photo" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ success: false, message: "Photo is over 8 MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const { url } = await uploadToCloudinary(buffer, { folder: "blissbakery/custom-requests", filename: name });
      return NextResponse.json({ success: true, url });
    }
    const dir = join(process.cwd(), "public", "uploads", "custom-requests");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `${name}.${ext}`), buffer);
    return NextResponse.json({ success: true, url: `/uploads/custom-requests/${name}.${ext}` });
  } catch (e) {
    console.error("custom cake upload failed", e);
    return NextResponse.json({ success: false, message: "Upload failed — please try again" }, { status: 500 });
  }
}
