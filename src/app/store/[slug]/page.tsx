import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StoreIndexPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/store/${slug}/menu`);
}
