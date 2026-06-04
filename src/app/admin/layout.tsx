import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, Tag, Users, Image as ImageIcon, Settings, LogOut, Store, Layers, Gift, CalendarHeart } from "lucide-react";

// Admin pages must always be dynamic (DB queries + auth)
export const dynamic = "force-dynamic";
import Image from "next/image";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });

  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    redirect("/");
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/admin/banners", label: "Banners", icon: Layers },
    { href: "/admin/occasions", label: "Occasions", icon: CalendarHeart },
    { href: "/admin/themes", label: "Themes", icon: Layers },
    { href: "/admin/promos", label: "Promos", icon: Tag },
    { href: "/admin/add-ons", label: "Add-Ons", icon: Gift },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/assets", label: "Assets", icon: ImageIcon },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 relative">
              <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="44px" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground font-serif">Bliss Bakery</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
            <Store className="w-4 h-4" />
            View Store →
          </Link>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {(user.name || "A")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden sticky top-0 z-50 bg-white border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative">
                <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="32px" />
              </div>
              <span className="text-sm font-bold">Admin</span>
            </div>
            <Link href="/" className="text-xs text-primary hover:underline flex items-center gap-1">
              <Store className="w-3 h-3" /> View Store
            </Link>
          </div>
        </header>

        {/* Mobile Bottom Nav — scrollable to show all items */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
          <div className="flex overflow-x-auto no-scrollbar py-2 px-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground flex-shrink-0"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
