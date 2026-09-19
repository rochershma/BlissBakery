import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Plus } from "lucide-react";
import { BannerManager } from "./banner-manager";

export default async function AdminBannersPage() {
  const store = await db.store.findFirst();
  if (!store) return <p>No store found.</p>;

  const banners = await db.banner.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Hero Banners</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage homepage hero slider images. Drag to reorder.</p>
        </div>
      </div>

      <BannerManager initialBanners={banners.map(b => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        ctaText: b.ctaText,
        ctaLink: b.ctaLink,
        mediaUrl: b.mediaUrl,
        mobileMediaUrl: b.mobileMediaUrl,
        linkUrl: b.linkUrl,
        sortOrder: b.sortOrder,
        isActive: b.isActive,
      }))} />
    </div>
  );
}
