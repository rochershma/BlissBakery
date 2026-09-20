import Link from "next/link";
import Image from "next/image";
import { img } from "@/lib/img";

export function SiteFooter({
  storeSlug = "kuchaman-city",
  phone = "9602831559",
  logo = "/uploads/branding/logo.png",
  address,
  className = "",
}: {
  storeSlug?: string;
  phone?: string;
  logo?: string | null;
  address?: string | null;
  className?: string;
}) {
  return (
    <footer className={`ftr ${className}`}>
      <div className="wrap">
        <div className="ftr__top">
          <div>
            <div className="ftr__brand">
              {logo ? (
                <Image src={img(logo, 110, 110)} alt="Bliss Bakery" width={48} height={48} unoptimized />
              ) : null}
              <h3>Bliss Bakery</h3>
            </div>
            <p>
              100% vegetarian and eggless. Baked fresh every morning
              {address ? ` at ${address}` : ""}.
            </p>
            <p className="ftr__fssai">FSSAI Lic. 12345678901234</p>
          </div>

          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link href={`/store/${storeSlug}/menu`}>Full menu</Link></li>
              <li><Link href="/cakes/birthday">Birthday cakes</Link></li>
              <li><Link href="/cakes/anniversary">Anniversary cakes</Link></li>
              <li><Link href="/cakes/wedding">Wedding cakes</Link></li>
              <li><Link href={`/store/${storeSlug}/custom-cakes`}>Custom cakes</Link></li>
            </ul>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/offers">Offers</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/orders">Track order</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms &amp; Conditions</Link></li>
              <li><Link href="/refund-policy">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4>Order Today</h4>
            <p>Open every day<br />8:00 AM – 10:00 PM</p>
            <p className="ftr__call">
              Call or WhatsApp<br />
              <a href={`tel:+91${phone}`}>+91 {phone.slice(0, 5)} {phone.slice(5)}</a>
            </p>
          </div>
        </div>

        <div className="ftr__bot">
          <span>© {new Date().getFullYear()} Bliss Bakery. All Rights Reserved.</span>
          <span className="ftr__pay">
            <span>UPI</span><span>Cards</span><span>Netbanking</span><span>Cash on delivery</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
