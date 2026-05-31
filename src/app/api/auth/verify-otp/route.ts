import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, createSession, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkBruteForce, recordFailure, clearFailures } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  otp: z.string().length(4, "OTP must be 4 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = schema.parse(body);

    // Check brute force lockout
    const bf = checkBruteForce(phone);
    if (bf.locked) {
      const mins = Math.ceil(bf.retryAfterMs / 60000);
      return NextResponse.json(
        { success: false, message: `Too many failed attempts. Try again in ${mins} minutes.` },
        { status: 429 }
      );
    }

    const valid = await verifyOtp(phone, otp);
    if (!valid) {
      recordFailure(phone);
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    // Clear failures on success
    clearFailures(phone);

    // Find or create user
    let user = await db.user.findUnique({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      user = await db.user.create({
        data: { phone },
      });
    }

    // Create JWT session
    const token = await createSession(user.id, user.role);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}
