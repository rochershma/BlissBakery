import Link from "next/link";
import Image from "next/image";

interface FooterProps {
  storeSlug?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export function SiteFooter({ storeSlug = "kuchaman-city", phone = "9602831559", city = "Kuchaman City", state = "Rajasthan" }: FooterProps) {
  return (
    <footer className="bg-chocolate text-white/70 mt-0">
      <div className="max-w-[1300px] mx-auto px-4 md:px-5 py-12 md:py-[52px]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_0.65fr_0.65fr] gap-9">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 relative">
                <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-[1.42]" sizes="48px" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-white text-[28px] leading-[1] tracking-[-0.04em]">Bliss Bakery</h3>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-[1.7] font-semibold max-w-md">
              Premium artisan bakery in {city}. Fresh eggless cakes, pastries, brownies, cookies, and custom celebration cakes.
            </p>
          </div>
          <div>
            <h3 className="font-serif font-bold text-white text-lg mb-4">Quick Links</h3>
            <div className="space-y-1 text-sm">
              <Link href="/about" className="block hover:text-white transition-colors font-medium min-h-[44px] flex items-center">About Us</Link>
              <Link href={`/store/${storeSlug}/custom-cakes`} className="block hover:text-white transition-colors font-medium min-h-[44px] flex items-center">Custom Cakes</Link>
              <Link href="/offers" className="block hover:text-white transition-colors font-medium min-h-[44px] flex items-center">Offers</Link>
              <Link href="/contact" className="block hover:text-white transition-colors font-medium min-h-[44px] flex items-center">Contact</Link>
              <Link href="/privacy" className="block hover:text-white transition-colors font-medium min-h-[44px] flex items-center">Privacy Policy</Link>
              <Link href="/terms" className="block hover:text-white transition-colors font-medium min-h-[44px] flex items-center">Terms & Conditions</Link>
              <Link href="/refund-policy" className="block hover:text-white transition-colors font-medium min-h-[44px] flex items-center">Refund Policy</Link>
            </div>
          </div>
          <div>
            <h3 className="font-serif font-bold text-white text-lg mb-4">Order Today</h3>
            <p className="text-white/70 text-sm leading-[1.7] font-medium">
              Same-day delivery before 8 PM.<br />
              Call: <a href={`tel:+91${phone}`} className="hover:text-white transition-colors min-h-[44px] inline-flex items-center">+91 {phone}</a><br />
              {city}, {state}
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Bliss Bakery. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
