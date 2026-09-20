"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useCartStore } from "@/store/cart";
import { img } from "@/lib/img";
import {
  IconSearch, IconUser, IconBag, IconPin, IconChevD, IconLogout,
  IconGrid, IconHome,
} from "./icons";

export type NavLink = { label: string; href: string };

type StoreOption = { id: string; name: string; slug: string; city: string | null; pincode: string | null };

export function SiteHeaderV5({
  storeSlug = "kuchaman-city",
  logo,
  nav = [],
  pincode = "341508",
}: {
  storeSlug?: string;
  logo?: string | null;
  nav?: NavLink[];
  pincode?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setShowLoginModal, logout } = useAuth();
  const items = useCartStore((s) => s.items);
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [q, setQ] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);

  const activeStore = stores.find((s) => s.slug === storeSlug) ?? null;

  useEffect(() => setHydrated(true), []);
  useEffect(() => { setMenuOpen(false); setStoreOpen(false); }, [pathname]);
  useEffect(() => {
    // Only fetched once the picker is opened — the header renders on every page.
    if (!storeOpen || stores.length) return;
    fetch("/api/stores")
      .then((r) => r.json())
      .then((d) => Array.isArray(d?.stores) && setStores(d.stores))
      .catch(() => {});
  }, [storeOpen, stores.length]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const count = hydrated ? items.reduce((s, i) => s + i.quantity, 0) : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    if (t.length > 1) router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  return (
    <header className="v5hdr">
      <div className="wrap v5hdr__main">
        <Link className="v5brand" href="/">
          {logo ? (
            <Image className="v5brand__logo" src={img(logo, 110, 110)} alt="" width={42} height={42} unoptimized />
          ) : null}
          <span>
            <span className="v5brand__n">Bliss Bakery</span>
            <span className="v5brand__s">Kuchaman City</span>
          </span>
        </Link>

        <form className="v5search" onSubmit={submit} role="search">
          <IconSearch />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cakes, pastries, cookies…"
            aria-label="Search"
          />
        </form>

        <div className="v5hdr__acts">
          <div className="v5store" ref={storeRef}>
            <button
              type="button"
              className="v5loc"
              onClick={() => setStoreOpen((v) => !v)}
              aria-expanded={storeOpen}
              aria-label="Change store"
            >
              <IconPin />
              <span>
                <small>Deliver to</small>
                <b>{activeStore ? `${activeStore.city || activeStore.name} ${activeStore.pincode}`.trim() : pincode}</b>
              </span>
              <IconChevD width={14} height={14} />
            </button>
            {storeOpen ? (
              <div className="v5store__pop">
                <span className="v5store__h">Choose a store</span>
                {stores.length === 0 ? (
                  <span className="v5store__i"><b>{pincode}</b><span>Loading stores…</span></span>
                ) : (
                  stores.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className="v5store__i"
                      aria-current={s.slug === storeSlug}
                      onClick={() => {
                        setStoreOpen(false);
                        router.push(`/store/${s.slug}/menu`);
                      }}
                    >
                      <b>{s.name}</b>
                      <span>{[s.city, s.pincode].filter(Boolean).join(" · ")}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="v5menu" ref={menuRef}>
            <button
              type="button"
              className="v5ibtn"
              onClick={() => (user ? setMenuOpen((v) => !v) : setShowLoginModal(true))}
              aria-label={user ? "Account menu" : "Sign in"}
              aria-expanded={menuOpen}
            >
              <IconUser />
              <span className="v5ibtn__t">{user ? user.name?.split(" ")[0] || "Account" : "Sign in"}</span>
              {user ? <IconChevD width={14} height={14} /> : null}
            </button>
            {menuOpen && user ? (
              <div className="v5menu__pop">
                <Link href="/profile"><IconUser /> Profile</Link>
                <Link href="/orders"><IconBag /> My orders</Link>
                <Link href="/addresses"><IconPin /> Saved addresses</Link>
                {user.role === "ADMIN" ? <Link href="/admin"><IconGrid /> Admin</Link> : null}
                <button type="button" onClick={() => { logout(); setMenuOpen(false); }} className="v5menu__out">
                  <IconLogout /> Log out
                </button>
              </div>
            ) : null}
          </div>

          <Link className="v5ibtn" href="/cart" aria-label={`Cart, ${count} items`}>
            <IconBag />
            {count > 0 ? <span className="v5dot">{count > 9 ? "9+" : count}</span> : null}
          </Link>
        </div>
      </div>

      {nav.length > 0 ? (
        <nav className="v5nav" aria-label="Categories">
          <div className="wrap">
            <Link href={`/store/${storeSlug}/menu`} className={pathname?.endsWith("/menu") ? "is-on" : ""}>
              Menu
            </Link>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={pathname === n.href ? "is-on" : ""}>
                {n.label}
              </Link>
            ))}
            <Link href={`/store/${storeSlug}/custom-cakes`} className="v5nav__custom">
              Custom cake
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

export function MobileNavV5({ storeSlug = "kuchaman-city" }: { storeSlug?: string }) {
  const pathname = usePathname() || "";
  const items = useCartStore((s) => s.items);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const count = hydrated ? items.reduce((s, i) => s + i.quantity, 0) : 0;

  if (/^\/(admin|checkout|cart)/.test(pathname)) return null;

  const tabs = [
    { href: "/", label: "Home", Icon: IconHome, on: pathname === "/" },
    { href: `/store/${storeSlug}/menu`, label: "Menu", Icon: IconGrid, on: pathname.includes("/menu") },
    { href: "/search", label: "Search", Icon: IconSearch, on: pathname.startsWith("/search") },
    { href: "/orders", label: "Orders", Icon: IconBag, on: pathname.startsWith("/order") },
    { href: "/profile", label: "Account", Icon: IconUser, on: pathname.startsWith("/profile") },
  ];

  return (
    <nav className="mnav" aria-label="Main">
      {tabs.map(({ href, label, Icon, on }) => (
        <Link key={href} href={href} className={on ? "is-on" : ""} style={{ position: "relative" }}>
          <Icon />
          <span>{label}</span>
          {href === "/orders" && count > 0 ? <span className="v5dot v5dot--nav">{count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
