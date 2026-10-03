import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getCustomerStoreId } from "@/lib/customer-store";
import { z } from "zod";

const clean = (s: string | null | undefined, max: number) => s?.replace(/<[^>]*>/g, "").trim().slice(0, max) || null;
// Only photos our own upload endpoint produced.
const ALLOWED_IMG = /^(https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\/[\w\-./]*\/custom-requests\/[\w\-.]+|\/uploads\/custom-requests\/[\w\-.]+)$/;

const schema = z.object({
  storeSlug: z.string().max(80).optional(),
  customerName: z.string().trim().min(2, "Tell us your name").max(60),
  customerPhone: z.string().transform((s) => s.replace(/\D/g, "").slice(-10)).pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")),
  cakeSize: z.string().trim().min(1, "Choose a size").max(30),
  baseFlavour: z.string().trim().min(1, "Choose a flavour").max(50),
  frosting: z.string().max(40).optional().nullable(),
  theme: z.string().max(80).optional().nullable(),
  messageOnCake: z.string().max(60).optional().nullable(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  budget: z.string().max(40).optional().nullable(),
  specialNotes: z.string().max(1000).optional().nullable(),
  referenceImages: z.array(z.string().max(300).regex(ALLOWED_IMG)).max(5).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Public form — keep one sender from flooding the kitchen's inbox.
    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    if (!rateLimit(`custom-cake:${ip}`, 5, 60 * 60 * 1000).allowed) {
      return NextResponse.json({ success: false, message: "Too many requests — please message us on WhatsApp instead" }, { status: 429 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "Please check the form" }, { status: 400 });
    }
    const b = parsed.data;

    const store = b.storeSlug
      ? await db.store.findUnique({ where: { slug: b.storeSlug }, select: { id: true } })
      : await db.store.findFirst({ where: { id: await getCustomerStoreId() }, select: { id: true } });

    const session = await getSession();
    const orderNumber = `CC-${Date.now().toString(36).toUpperCase()}`;

    const order = await db.customCakeOrder.create({
      data: {
        orderNumber,
        storeId: store?.id ?? null,
        userId: session?.userId || null,
        customerName: clean(b.customerName, 60)!,
        customerPhone: b.customerPhone,
        cakeSize: clean(b.cakeSize, 30)!,
        baseFlavour: clean(b.baseFlavour, 50)!,
        frosting: clean(b.frosting, 40),
        theme: clean(b.theme, 80),
        messageOnCake: clean(b.messageOnCake, 60),
        designDescription: clean(b.specialNotes, 1000),
        preferredDate: b.preferredDate ? new Date(b.preferredDate) : null,
        referenceImages: b.referenceImages?.length ? JSON.stringify(b.referenceImages) : null,
        budgetRange: clean(b.budget, 40),
        status: "RECEIVED",
      },
    });

    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("Custom cake order error:", error);
    return NextResponse.json({ success: false, message: "Failed to submit order" }, { status: 500 });
  }
}
