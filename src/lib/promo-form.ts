import { redirect } from "next/navigation";

/**
 * Shared validation for promo code forms.
 *
 * A negative or over-100% discount silently corrupts every order total it
 * touches, so the numbers are checked here rather than trusted from the form.
 */
export type PromoInput = {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  validFrom: Date;
  validTo: Date;
  usageLimit: number | null;
  perUserLimit: number;
  occasionTag: string | null;
  isActive: boolean;
  storeId: string | null;
};

export function readPromoForm(formData: FormData, backTo: string): PromoInput {
  const fail = (msg: string): never =>
    redirect(`${backTo}?error=${encodeURIComponent(msg)}`);

  const code = ((formData.get("code") as string) ?? "").toUpperCase().replace(/\s/g, "").slice(0, 24);
  if (code.length < 3) fail("Promo code needs at least 3 characters");

  const discountType = formData.get("discountType") === "FLAT" ? "FLAT" : "PERCENTAGE";

  const discountValue = parseFloat(formData.get("discountValue") as string);
  if (!Number.isFinite(discountValue) || discountValue <= 0) fail("Discount must be greater than zero");
  if (discountType === "PERCENTAGE" && discountValue > 90) fail("Percentage discount cannot exceed 90%");

  const validFrom = new Date(formData.get("validFrom") as string);
  const validTo = new Date(formData.get("validTo") as string);
  if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validTo.getTime())) fail("Enter valid dates");
  if (validTo <= validFrom) fail("The end date must be after the start date");

  const positiveOrNull = (raw: FormDataEntryValue | null) => {
    const n = parseFloat(raw as string);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  return {
    code,
    discountType,
    discountValue,
    minOrderValue: positiveOrNull(formData.get("minOrderValue")),
    maxDiscount: positiveOrNull(formData.get("maxDiscount")),
    validFrom,
    validTo,
    usageLimit: positiveOrNull(formData.get("usageLimit")),
    perUserLimit: Math.max(1, parseInt(formData.get("perUserLimit") as string, 10) || 1),
    occasionTag: ((formData.get("occasionTag") as string) || "").trim().slice(0, 40) || null,
    isActive: formData.get("isActive") === "on",
    storeId: (formData.get("storeId") as string) || null,
  };
}
