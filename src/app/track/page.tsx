import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Statuses where the order is still in flight and worth tracking.
const ACTIVE = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];

export default async function TrackPage() {
  const session = await getSession();
  if (!session) redirect("/orders");

  const active = await db.order.findFirst({
    where: { userId: session.userId, status: { in: ACTIVE } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (active) redirect(`/order/${active.id}`);

  // Nothing in flight — fall back to the most recent order, else the list.
  const latest = await db.order.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  redirect(latest ? `/order/${latest.id}` : "/orders");
}
