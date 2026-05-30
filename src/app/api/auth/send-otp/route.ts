import { NextRequest, NextResponse } from "next/server";
import { createOtpSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 5 OTP requests per phone per 10 minutes
    const body = await req.json();
    const { phone } = schema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ipLimit = rateLimit(`otp-ip:${ip}`, 10, 10 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    const phoneLimit = rateLimit(`otp-phone:${phone}`, 5, 10 * 60 * 1000);
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many OTP requests. Try again in a few minutes." },
        { status: 429 }
      );
    }

    const otp = await createOtpSession(phone);

    // In production, send via WhatsApp/SMS API
    console.log(`📱 OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Only in dev mode — REMOVE in production
      ...(process.env.NODE_ENV !== "production" && { devOtp: otp }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
