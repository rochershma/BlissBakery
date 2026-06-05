import { db } from "@/lib/db";
import { AssetGallery } from "./asset-gallery";

export default async function AdminAssetsPage() {
  const assets = await db.asset.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground font-serif">Media Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload and manage images. Use the image picker on product & banner pages to select images directly.
        </p>
      </div>

      <AssetGallery initialAssets={assets.map(a => ({
        id: a.id,
        url: a.url,
        filename: a.filename,
        folder: a.folder || "general",
        size: a.size,
        createdAt: a.createdAt.toISOString(),
      }))} />
    </div>
  );
}
