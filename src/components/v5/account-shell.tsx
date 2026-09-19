"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { IconBag, IconTruck, IconPin, IconUser, IconLogout } from "@/components/v5/icons";

const NAV = [
  { href: "/orders", label: "Order history", Icon: IconBag },
  { href: "/orders?track=1", label: "Track an order", Icon: IconTruck },
  { href: "/addresses", label: "Saved addresses", Icon: IconPin },
  { href: "/profile", label: "Profile", Icon: IconUser },
];

export function AccountShell({ children, active }: { children: React.ReactNode; active: string }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="wrap acct5">
      <aside className="acct5__nav">
        <div className="acct5__me">
          <span className="acct5__av">{(user?.name ?? "G").charAt(0).toUpperCase()}</span>
          <div style={{ minWidth: 0 }}>
            <b>{user?.name ?? "Guest"}</b>
            <span className="t-small">{user?.phone ? `+91 ${user.phone}` : "Not signed in"}</span>
          </div>
        </div>
        {NAV.map(({ href, label, Icon }) => {
          const base = href.split("?")[0];
          const on = active === base && (href.includes("track") ? pathname.includes("track") : true);
          return (
            <Link key={href} href={href} className={on && !href.includes("track") ? "is-on" : ""}>
              <Icon /> <span>{label}</span>
            </Link>
          );
        })}
        <button type="button" className="acct5__out" onClick={logout}>
          <IconLogout /> <span>Log out</span>
        </button>
      </aside>
      <div className="acct5__body">{children}</div>
    </div>
  );
}
