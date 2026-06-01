import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Home, ChevronRight } from "lucide-react";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { ProductDetailClient } from "./product-detail-client";
import { SiteHeader } from "@/components/shared/site-header";
import { ProductImageGallery } from "@/components/product/image-gallery";

interface Props { params: Promise<{ slug: string; productSlug: string }>; }

export default async function ProductDetailPage({ params }: Props) {
  const { slug: storeSlug, productSlug } = await params;
  const product = await db.product.findUnique({
    where: { slug: productSlug },
    include: { category: true, variants: { orderBy: { price: "asc" } }, addOns: true },
  });
  if (!product) return notFound();

  const productImgs = parseJsonSafe<string[]>(product.images, []);
  const heroImg = productImgs[0] || "/images/hero/AMMO6974.jpg";
  const relatedProducts = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isAvailable: true }, take: 6,
  });

  // Fetch store-level add-ons
  const store = await db.store.findFirst();
  const storeAddOns = store ? await db.storeAddOn.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  }) : [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      {/* Breadcrumb */}
      <nav className="max-w-5xl mx-auto w-full px-4 py-2 text-xs text-muted-foreground flex items-center gap-1 no-scrollbar">
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/store/${storeSlug}/menu`} className="hover:text-primary transition-colors">Menu</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pb-44">
        <div className="md:flex md:gap-8 md:py-2">
          {/* Product Image Gallery */}
          <div className="md:w-2/5 mb-4 md:mb-0">
            <ProductImageGallery
              images={productImgs.length > 0 ? productImgs : ["/images/hero/AMMO6974.jpg"]}
              name={product.name}
              isBestseller={product.isBestseller}
            />
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-medium mb-1">{product.category.name}</p>
            <h1 className="text-xl md:text-2xl font-bold text-foreground font-serif mb-1">{product.name}</h1>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-primary">{formatPrice(product.basePrice)}</span>
              {(product as any).mrpPrice && (product as any).mrpPrice > product.basePrice && (
                <>
                  <span className="text-sm text-muted-foreground line-through">{formatPrice((product as any).mrpPrice)}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                    {Math.round(((product as any).mrpPrice - product.basePrice) / (product as any).mrpPrice * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            {product.description && <p className="text-sm text-muted-foreground leading-relaxed mb-3">{product.description}</p>}
            {product.ingredients && (
              <div className="mb-3 bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-foreground mb-0.5">Ingredients</p>
                <p className="text-xs text-muted-foreground">{product.ingredients}</p>
              </div>
            )}
            <ProductDetailClient storeSlug={storeSlug} product={{
              id: product.id, name: product.name, slug: product.slug, basePrice: product.basePrice,
              image: heroImg,
              categorySlug: product.category.slug,
              servingInfo: (product as any).servingInfo || undefined,
              flavours: parseJsonSafe<string[]>((product as any).flavours, []),
              variants: product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, serves: v.serves || undefined })),
              addOns: product.addOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
            }} storeAddOns={storeAddOns.map(a => ({ id: a.id, name: a.name, price: a.price, category: a.category }))} />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-base font-bold text-foreground font-serif mb-3">You may also like</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {relatedProducts.map((rp) => {
                const rpImgs = parseJsonSafe<string[]>(rp.images, []);
                const rpImg = rpImgs[0] || "/images/hero/AMMO6974.jpg";
                return (
                  <Link key={rp.id} href={`/store/${storeSlug}/menu/${rp.slug}`} className="product-card flex-shrink-0 w-32 bg-white rounded-xl border border-border overflow-hidden">
                    <div className="relative h-24 overflow-hidden"><Image src={rpImg} alt={rp.name} fill className="object-cover product-img-zoom" sizes="128px" /></div>
                    <div className="p-2">
                      <h4 className="font-serif font-semibold text-[10px] text-foreground line-clamp-2 leading-tight">{rp.name}</h4>
                      <p className="font-bold text-xs text-primary mt-1">{formatPrice(rp.basePrice)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

