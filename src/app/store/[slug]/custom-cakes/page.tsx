import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppHeader, AppFooter } from "@/components/v5/app-header";
import { CustomCakeForm } from "./custom-cake-form";

export const metadata = { title: "Custom Cakes | Bliss Bakery" };

export default async function CustomCakesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await db.store.findUnique({ where: { slug }, select: { id: true } });
  if (!store) notFound();

  return (
    <>
      <AppHeader />
      <CustomCakeForm />
      <AppFooter />
    </>
  );
}
