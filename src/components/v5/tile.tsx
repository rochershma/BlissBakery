import Link from "next/link";
import Image from "next/image";
import { img } from "@/lib/img";
import { IconCake, IconCup } from "./icons";

export type TileData = {
  name: string;
  href: string;
  image?: string | null;
  /** Fallback glyph when a category has no photo uploaded yet. */
  glyph?: "cake" | "cup";
};

export function Tile({ data, size = 420, eager = false }: { data: TileData; size?: number; eager?: boolean }) {
  const Glyph = data.glyph === "cup" ? IconCup : IconCake;
  return (
    <Link className="tile" href={data.href}>
      <div className="tile__img">
        {data.image ? (
          <Image
            src={img(data.image, size, size)}
            alt={data.name}
            width={size}
            height={size}
            unoptimized
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
          />
        ) : (
          <span className="tile__ph">
            <Glyph />
          </span>
        )}
      </div>
      <div className="tile__cap">
        <b>{data.name}</b>
      </div>
    </Link>
  );
}
