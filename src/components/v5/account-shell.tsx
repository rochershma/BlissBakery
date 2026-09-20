"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { IconBag, IconTruck, IconPin, IconUser, IconLogout, IconChevL } from "@/components/v5/icons";

const NAV = [
  { href: "/orders", label: "Order history", Icon: IconBag },
  { href: "/track", label: "Track an order", Icon: IconTruck },
  { href: "/addresses", label: "Saved addresses", Icon: IconPin },
  { href: "/profile", label: "Profile", Icon: IconUser },
];

export function AccountShell({ children, active }: { children: React.ReactNode; active: string }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Account pages sit outside the storefront header, so they need their own
          way back — otherwise desktop users are stranded here. */}
      <div className="acct5__top">
        <div className="wrap acct5__topin">
          <Link href="/" className="acct5__back">
            <IconChevL /> <span>Back to store</span>
          </Link>
          <Link href="/" className="acct5__brand">Bliss Bakery</Link>
        </div>
      </div>

      <div className="wrap acct5">
        <aside className="acct5__nav">
          <div className="acct5__me">
            <span className="acct5__av">{(user?.name ?? "G").charAt(0).toUpperCase()}</span>
            <div style={{ minWidth: 0 }}>
              <b>{user?.name ?? "Guest"}</b>
              <span className="t-small">{user?.phone ? `+91 ${user.phone}` : "Not signed in"}</span>
            </div>
          </div>
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={active === href ? "is-on" : ""}>
              <Icon /> <span>{label}</span>
            </Link>
          ))}
          <button type="button" className="acct5__out" onClick={logout}>
            <IconLogout /> <span>Log out</span>
          </button>
        </aside>
        <div className="acct5__body">{children}</div>
      </div>
    </>
  );
}
