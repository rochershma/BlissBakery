import Link from "next/link";
import { getCustomerStoreSlug } from "@/lib/customer-store";
import { IconCake } from "@/components/v5/icons";
import { AppHeader } from "@/components/v5/app-header";

export const metadata = { title: "Page not found" };

export default async function NotFoundPage() {
  const store = (await getCustomerStoreSlug()) || "kuchaman-city";
  return (
    <>
    <AppHeader />
    <div className="wrap" style={{ padding: "64px 16px 96px" }}>
      <div className="v5empty" style={{ maxWidth: 480, margin: "0 auto" }}>
        <IconCake />
        <h1 className="t-h2">We couldn&apos;t find that page</h1>
        <p className="t-small">The link may be old, or the cake may have left the menu. Everything else is still baking.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="btn btn--rose btn--sm" href={`/store/${store}/menu`}>Browse the menu</Link>
          <Link className="btn btn--out btn--sm" href="/">Go home</Link>
        </div>
      </div>
    </div>
    </>
  );
}
