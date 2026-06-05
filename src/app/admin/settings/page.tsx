import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Clock, MapPin, Phone, Store } from "lucide-react";
import { parseJsonSafe } from "@/lib/utils";
import { requireAdmin, sanitizeMax } from "@/lib/server-utils";
import { ImageField } from "@/components/admin/image-field";

export default async function AdminSettingsPage() {
  const store = await db.store.findFirst();
  if (!store) return <p>Store not found</p>;

  async function updateSettings(formData: FormData) {
    "use server";
    await requireAdmin();
    const name = sanitizeMax(formData.get("name") as string, 100) || "Store";
    const tagline = formData.get("tagline") as string;
    const description = formData.get("description") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const fssaiLicense = formData.get("fssaiLicense") as string;
    const gstNumber = formData.get("gstNumber") as string;
    const deliveryCharge = Math.max(0, parseFloat(formData.get("deliveryCharge") as string) || 0);
    const packagingCharge = Math.max(0, parseFloat(formData.get("packagingCharge") as string) || 0);
    const gstEnabled = formData.get("gstEnabled") === "on";
    const gstRate = gstEnabled ? Math.max(0, Math.min(28, parseFloat(formData.get("gstRate") as string) || 0)) : 0;
    const deliveryRadius = Math.max(0, parseFloat(formData.get("deliveryRadius") as string) || 10);
    const minDeliveryOrder = Math.max(0, parseFloat(formData.get("minDeliveryOrder") as string) || 0);
    const staffWhatsApp = formData.get("staffWhatsApp") as string;
    const latitude = parseFloat(formData.get("latitude") as string) || null;
    const longitude = parseFloat(formData.get("longitude") as string) || null;
    const isOpen = formData.get("isOpen") === "on";
    const logo = (formData.get("logo") as string) || null;

    // Parse operating hours
    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const hours: Record<string, { open: string; close: string }> = {};
    for (const day of days) {
      const open = formData.get(`hours_${day}_open`) as string;
      const close = formData.get(`hours_${day}_close`) as string;
      if (open && close) hours[day] = { open, close };
    }

    await db.store.update({
      where: { id: store!.id },
      data: {
        name, tagline, description, address, city, phone, email,
        fssaiLicense, gstNumber, deliveryCharge, packagingCharge, gstRate,
        deliveryRadius, minDeliveryOrder, staffWhatsApp: staffWhatsApp || null,
        latitude, longitude,
        operatingHours: JSON.stringify(hours), isOpen,
        logo,
      },
    });
    revalidatePath("/admin/settings");
    redirect("/admin/settings");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground font-serif mb-6">Store Settings</h1>
      <form action={updateSettings} className="max-w-2xl space-y-5">
        {/* Logo Upload */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="label-premium text-foreground">Store Logo</h2>
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 relative bg-muted border border-border p-2">
              {store.logo ? (
                <img src={store.logo} alt="Current Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No logo</div>
              )}
            </div>
            <div className="flex-1">
              <ImageField name="logo" defaultValue={store.logo || ""} label="Upload Logo" folder="branding" aspectRatio="square" />
              <p className="text-[10px] text-muted-foreground mt-1">Square image recommended (PNG with transparent background works best)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="label-premium text-foreground">Store Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Store Name</label>
              <input name="name" defaultValue={store.name} required className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Tagline</label>
              <input name="tagline" defaultValue={store.tagline || ""} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Description</label>
            <textarea name="description" rows={3} defaultValue={store.description || ""} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Address</label>
              <input name="address" defaultValue={store.address} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">City</label>
              <input name="city" defaultValue={store.city} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Phone</label>
              <input name="phone" defaultValue={store.phone} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Email</label>
              <input name="email" defaultValue={store.email || ""} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="isOpen" defaultChecked={store.isOpen} className="w-4 h-4 accent-primary" />
            <Store className="w-4 h-4 text-success" /> Store is Open
          </label>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="label-premium text-foreground">Charges, Delivery & Tax</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Delivery Charge (₹)</label>
              <input name="deliveryCharge" inputMode="decimal" defaultValue={store.deliveryCharge || 0} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Packaging Charge (₹)</label>
              <input name="packagingCharge" inputMode="decimal" defaultValue={store.packagingCharge || 0} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">GST</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="gstEnabled" defaultChecked={store.gstRate > 0} className="w-4 h-4 accent-primary" />
                  Enable GST
                </label>
                <input name="gstRate" inputMode="decimal" placeholder="e.g., 5" defaultValue={store.gstRate > 0 ? store.gstRate : ''} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <p className="text-[10px] text-muted-foreground">Set to 0 or uncheck to disable GST</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Delivery Radius (km)</label>
              <input name="deliveryRadius" inputMode="decimal" defaultValue={store.deliveryRadius || 10} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Min Delivery Order (₹)</label>
              <input name="minDeliveryOrder" inputMode="decimal" defaultValue={store.minDeliveryOrder || 200} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Staff WhatsApp No.</label>
              <input name="staffWhatsApp" inputMode="tel" placeholder="9602831559" defaultValue={store.staffWhatsApp || ""} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Map Latitude</label>
              <input name="latitude" inputMode="decimal" placeholder="27.1517" defaultValue={store.latitude || ""} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Map Longitude</label>
              <input name="longitude" inputMode="decimal" placeholder="74.8560" defaultValue={store.longitude || ""} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Lat/Lng are used for the Google Maps pickup link on checkout. Find your coordinates at <a href="https://maps.google.com" target="_blank" rel="noopener" className="text-primary hover:underline">maps.google.com</a>.</p>
        </div>

        {/* Operating Hours */}
        <OperatingHoursSection hours={parseJsonSafe(store.operatingHours, {})} />

        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="label-premium text-foreground">Legal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">FSSAI License No.</label>
              <input name="fssaiLicense" defaultValue={store.fssaiLicense || ""} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">GST Number</label>
              <input name="gstNumber" defaultValue={store.gstNumber || ""} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors btn-press flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </form>
    </div>
  );
}

function OperatingHoursSection({ hours }: { hours: Record<string, { open: string; close: string }> }) {
  const days = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
  ];

  return (
    <div className="bg-white rounded-xl border border-border p-5 space-y-4">
      <h2 className="label-premium text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Operating Hours</h2>
      <div className="space-y-2">
        {days.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-medium text-foreground">{label}</span>
            <input
              name={`hours_${key}_open`}
              type="time"
              defaultValue={hours[key]?.open || "08:00"}
              className="px-2 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              name={`hours_${key}_close`}
              type="time"
              defaultValue={hours[key]?.close || "22:00"}
              className="px-2 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
