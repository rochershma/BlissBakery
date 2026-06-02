import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Home, ChevronRight, Leaf, Star, Clock, Truck, ShieldCheck } from "lucide-react";
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
    where: { categoryId: product.categoryId, id: { not: product.id }, isAvailable: true }, take: 8,
  });

  const store = await db.store.findFirst();
  const storeAddOns = store ? await db.storeAddOn.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  }) : [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto w-full px-4 py-2 text-xs text-muted-foreground flex items-center gap-1 no-scrollbar">
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/store/${storeSlug}/menu`} className="hover:text-primary transition-colors">Menu</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/store/${storeSlug}/menu?category=${product.category.slug}`} className="hover:text-primary transition-colors">{product.category.name}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-32">
        <div className="md:flex md:gap-10 md:py-4">
          {/* Left: Image Gallery — 50% desktop, sticky */}
          <div className="md:w-1/2 mb-5 md:mb-0 md:sticky md:top-4 md:self-start">
            <ProductImageGallery
              images={productImgs.length > 0 ? productImgs : ["/images/hero/AMMO6974.jpg"]}
              name={product.name}
              isBestseller={product.isBestseller}
            />
          </div>

          {/* Right: Product Info — 50% desktop */}
          <div className="md:w-1/2">
            <p className="text-[11px] text-primary uppercase tracking-[0.2em] font-semibold mb-1.5">{product.category.name}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif leading-tight mb-3">{product.name}</h1>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-medium px-2.5 py-1 rounded-full border border-green-200">
                <Leaf className="w-3 h-3" /> 100% Eggless
              </span>
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-medium px-2.5 py-1 rounded-full border border-blue-200">
                <Clock className="w-3 h-3" /> Freshly Baked
              </span>
              {product.isBestseller && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-medium px-2.5 py-1 rounded-full border border-amber-200">
                  <Star className="w-3 h-3" /> Bestseller
                </span>
              )}
              {product.isNew && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[10px] font-medium px-2.5 py-1 rounded-full border border-purple-200">
                  ✨ New
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{product.description}</p>
            )}

            {product.ingredients && (
              <div className="mb-4 bg-muted/40 rounded-xl px-4 py-3 border border-border/50">
                <p className="text-xs font-semibold text-foreground mb-1">🧈 Ingredients</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{product.ingredients}</p>
              </div>
            )}

            <div className="border-t border-border my-4" />

            <ProductDetailClient storeSlug={storeSlug} product={{
              id: product.id, name: product.name, slug: product.slug, basePrice: product.basePrice,
              mrpPrice: (product as any).mrpPrice || null,
              image: heroImg,
              categorySlug: product.category.slug,
              servingInfo: (product as any).servingInfo || undefined,
              flavours: parseJsonSafe<string[]>((product as any).flavours, []),
              variants: product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, serves: v.serves || undefined })),
              addOns: product.addOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
            }} storeAddOns={storeAddOns.map(a => ({ id: a.id, name: a.name, price: a.price, category: a.category }))} />

            {/* Delivery Info */}
            <div className="mt-6 bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 border border-primary/10">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Delivery & Pickup</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Same-day delivery available. Order 2 hours before your desired slot.</p>
                  <p className="text-xs text-muted-foreground">Free pickup from store.</p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-5 py-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Quality Assured</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Leaf className="w-4 h-4 text-green-600" />
                <span>100% Vegetarian</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products — proper grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-lg font-bold text-foreground font-serif mb-4">You May Also Like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {relatedProducts.map((rp) => {
                const rpImgs = parseJsonSafe<string[]>(rp.images, []);
                const rpImg = rpImgs[0] || "/images/hero/AMMO6974.jpg";
                return (
                  <Link key={rp.id} href={`/store/${storeSlug}/menu/${rp.slug}`} className="product-card bg-white rounded-xl border border-border overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      <Image src={rpImg} alt={rp.name} fill className="object-cover product-img-zoom" sizes="(max-width:640px) 50vw, 25vw" />
                    </div>
                    <div className="p-2.5">
                      <h4 className="font-serif font-semibold text-xs text-foreground line-clamp-2 leading-tight">{rp.name}</h4>
                      <p className="font-bold text-sm text-primary mt-1">{formatPrice(rp.basePrice)}</p>
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
