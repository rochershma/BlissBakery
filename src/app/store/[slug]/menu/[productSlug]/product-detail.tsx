"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/components/shared/toast";
import { formatPrice } from "@/lib/utils";
import { img } from "@/lib/img";
import { customPrice, parseWeightKg, servesFor, type FlavourPrice } from "@/lib/pricing";
import { IconLeaf, IconTruck, IconClock, IconPlus, IconCheck } from "@/components/v5/icons";

export type PdpProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  ingredients: string | null;
  images: string[];
  basePrice: number;
  mrpPrice: number | null;
  isBestseller: boolean;
  isNew: boolean;
  categoryName: string | null;
  pricingStrategy: string;
  designCharge: number;
  base500gPrice: number | null;
  defaultFlavour: string | null;
  flavours: string[];
  flavourPrices: FlavourPrice[];
  servingInfo: string | null;
  variants: { id: string; name: string; serves: string | null; price: number }[];
};

export function ProductDetail({
  product,
  storeSlug,
  deliveryCharge,
  freeOver,
}: {
  product: PdpProduct;
  storeSlug: string;
  deliveryCharge: number;
  freeOver: number;
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setStoreSlug = useCartStore((s) => s.setStoreSlug);
  const { toast } = useToast();

  const isCustom = product.pricingStrategy === "CUSTOM";
  const flavourMap = useMemo(
    () => new Map(product.flavourPrices.map((f) => [f.name, f.price500g])),
    [product.flavourPrices],
  );

  const defaultFlavour = useMemo(() => {
    if (!product.flavours.length) return "";
    if (product.defaultFlavour && product.flavours.includes(product.defaultFlavour)) return product.defaultFlavour;
    if (isCustom && flavourMap.size) {
      return [...product.flavours].sort((a, b) => (flavourMap.get(a) ?? 1e9) - (flavourMap.get(b) ?? 1e9))[0];
    }
    return product.flavours[0];
  }, [product.flavours, product.defaultFlavour, isCustom, flavourMap]);

  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [flavour, setFlavour] = useState(defaultFlavour);
  const [message, setMessage] = useState("");
  const [qty, setQty] = useState(1);
  const [gallery, setGallery] = useState(0);
  const [added, setAdded] = useState(false);
  const [openAcc, setOpenAcc] = useState<string | null>("desc");

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const kg = variant ? parseWeightKg(variant.name) : 0.5;
  // some variants store "Serves 4-6", others just "4-6"
  const servesLabel = (s: string) => (/serves/i.test(s) ? s : `Serves ${s}`);

  const unitPrice = useMemo(() => {
    if (isCustom && flavour) {
      const per500 = flavourMap.get(flavour) ?? product.base500gPrice ?? 300;
      return customPrice(per500, kg, product.designCharge);
    }
    return variant ? variant.price : product.basePrice;
  }, [isCustom, flavour, flavourMap, kg, product.base500gPrice, product.designCharge, product.basePrice, variant]);

  const total = unitPrice * qty;
  const serves = servesLabel(variant?.serves || servesFor(kg));

  const onAdd = () => {
    setStoreSlug(storeSlug);
    addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      image: product.images[0] ?? undefined,
      variantName: variant?.name,
      unitPrice,
      flavour: flavour || undefined,
      cakeMessage: message.trim() || undefined,
      addOns: [],
    });
    if (qty > 1) updateQuantity(product.id, qty, variant?.name);
    setAdded(true);
    toast(`${product.name} · ${[variant?.name, flavour].filter(Boolean).join(" · ")} added`, "success");
    setTimeout(() => setAdded(false), 1800);
  };

  const acc = [
    {
      k: "desc",
      t: "Description & ingredients",
      c: [product.description || product.shortDesc, product.ingredients].filter(Boolean).join("\n\n") ||
        "Eggless sponge, fresh cream and hand-piped finish. Contains wheat, milk and soy. Made in a kitchen that also handles tree nuts.",
    },
    {
      k: "store",
      t: "Storage & serving",
      c: "Refrigerate on arrival. Bring to room temperature 20 minutes before serving. Best enjoyed within 24 hours.",
    },
    {
      k: "deliv",
      t: "Delivery & slots",
      c: `Same-day delivery for orders placed before 6:00 PM. ${formatPrice(deliveryCharge)} delivery, free over ${formatPrice(freeOver)}. Two-hour slots from 10 AM to 10 PM.`,
    },
    ...(isCustom
      ? [{ k: "made", t: "Made to order", c: "Each cake is decorated by hand, so the finish and shade may vary slightly from the photograph." }]
      : []),
  ];

  return (
    <div className="pdp5">
      <div className="pdp5__gal">
        <div className="pdp5__main">
          {product.images[gallery] ? (
            <Image src={img(product.images[gallery], 900, 900)} alt={product.name} width={900} height={900} priority unoptimized />
          ) : null}
        </div>
        {product.images.length > 1 ? (
          <div className="pdp5__thumbs">
            {product.images.slice(0, 5).map((src, i) => (
              <button key={src} type="button" className={i === gallery ? "is-on" : ""} onClick={() => setGallery(i)} aria-label={`Image ${i + 1}`}>
                <Image src={img(src, 200, 200)} alt="" width={200} height={200} unoptimized loading="lazy" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pdp5__info">
        <div className="pdp5__badges">
          {product.isBestseller ? <span className="badge badge--rose">Bestseller</span> : null}
          {product.isNew && !product.isBestseller ? <span className="badge badge--soft">New</span> : null}
          <span className="veg" aria-label="Pure veg" />
          <span className="t-small">100% eggless</span>
        </div>

        <h1 className="d2">{product.name}</h1>
        {product.shortDesc ? <p className="t-body pdp5__desc">{product.shortDesc}</p> : null}

        {product.variants.length > 0 && (
          <div className="opt-block">
            <h4>Choose a size</h4>
            <div className="sizes" role="radiogroup" aria-label="Size">
              {product.variants.map((v) => {
                const vkg = parseWeightKg(v.name);
                const vPrice = isCustom && flavour
                  ? customPrice(flavourMap.get(flavour) ?? product.base500gPrice ?? 300, vkg, product.designCharge)
                  : v.price;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={v.id === variantId}
                    className="sizes__o"
                    onClick={() => setVariantId(v.id)}
                  >
                    <b>{v.name}</b>
                    <em>{servesLabel(v.serves || servesFor(vkg))}</em>
                    <i>{formatPrice(vPrice)}</i>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {product.flavours.length > 0 && (
          <div className="opt-block">
            <h4>
              Choose a flavour <span className="t-small">all eggless</span>
            </h4>
            <div className="pdp5__flav">
              {product.flavours.map((f) => (
                <button key={f} type="button" className="chip chip--sm" aria-checked={f === flavour} role="radio" onClick={() => setFlavour(f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="opt-block">
          <h4>
            Personalise <span className="t-small">optional</span>
          </h4>
          <input
            className="input"
            maxLength={25}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Name or message on the cake — e.g. Happy Birthday Aarav"
          />
        </div>

        <div className="pdp5__price">
          <div>
            <b className="t-num">{formatPrice(total)}</b>
            <p className="t-small">
              {variant ? `${variant.name} · ` : ""}
              {flavour ? `${flavour} · ` : ""}
              {serves}
            </p>
          </div>
          <div className="pdp5__buy">
            <div className="qty">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity">+</button>
            </div>
            <button type="button" className="btn btn--rose btn--lg pdp5__cta" onClick={onAdd}>
              {added ? <><IconCheck /> Added</> : "Add to cart"}
            </button>
          </div>
        </div>

        <div className="pdp5__trust">
          <span><IconLeaf /> 100% eggless</span>
          <span><IconTruck /> Same-day delivery</span>
          <span><IconClock /> {isCustom ? "Baked to order" : "Ready at the counter"}</span>
        </div>

        <div className="pdp5__acc">
          {acc.map((a) => (
            <div key={a.k} className={`acc__i${openAcc === a.k ? " open" : ""}`}>
              <button type="button" className="acc__b" onClick={() => setOpenAcc(openAcc === a.k ? null : a.k)} aria-expanded={openAcc === a.k}>
                {a.t}
                <IconPlus />
              </button>
              <div className="acc__p">{a.c}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="msticky">
        <div>
          <div className="t-small pdp5__stickysel">
            {variant?.name}
            {flavour ? ` · ${flavour}` : ""}
          </div>
          <b className="t-num pdp5__stickyprice">{formatPrice(total)}</b>
        </div>
        <button type="button" className="btn btn--rose pdp5__stickycta" onClick={onAdd}>
          {added ? "Added" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
