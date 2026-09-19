import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

type P = SVGProps<SVGSVGElement>;

export const IconSearch = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const IconUser = (p: P) => <svg {...base} {...p}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4S18.1 16.4 19.5 20" /></svg>;
export const IconBag = (p: P) => <svg {...base} {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 016 0V8" /></svg>;
export const IconHeart = (p: P) => <svg {...base} {...p}><path d="M12 20s-7-4.5-7-9.3A4 4 0 0112 8a4 4 0 017 2.7C19 15.5 12 20 12 20z" /></svg>;
export const IconPin = (p: P) => <svg {...base} {...p}><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></svg>;
export const IconHome = (p: P) => <svg {...base} {...p}><path d="M4 10.5L12 4l8 6.5V20H4z" /></svg>;
export const IconGrid = (p: P) => <svg {...base} {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>;
export const IconTruck = (p: P) => <svg {...base} {...p}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17.5" cy="18" r="1.8" /></svg>;
export const IconLeaf = (p: P) => <svg {...base} {...p}><path d="M5 19c0-8 5-13 14-13 0 9-5 13-14 13z" /><path d="M5 19c3-4 6-6 9-7" /></svg>;
export const IconCake = (p: P) => <svg {...base} {...p}><path d="M4 20h16v-6H4zM6 14v-3h12v3M9 11V7M12 11V6M15 11V7" /></svg>;
export const IconGift = (p: P) => <svg {...base} {...p}><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M4 13h16M12 9v11M12 9S9.5 4 7.5 5.5 10 9 12 9zM12 9s2.5-5 4.5-3.5S14 9 12 9z" /></svg>;
export const IconCup = (p: P) => <svg {...base} {...p}><path d="M5 8h12v7a5 5 0 01-5 5H10a5 5 0 01-5-5z" /><path d="M17 10h2.2a2.3 2.3 0 010 4.6H17" /><path d="M8 3v2M11.5 2.5v2.5M15 3v2" /></svg>;
export const IconChevL = (p: P) => <svg {...base} {...p}><path d="M15 5l-7 7 7 7" /></svg>;
export const IconChevR = (p: P) => <svg {...base} {...p}><path d="M9 5l7 7-7 7" /></svg>;
export const IconChevD = (p: P) => <svg {...base} {...p}><path d="M6 9l6 6 6-6" /></svg>;
export const IconPlus = (p: P) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IconFilter = (p: P) => <svg {...base} {...p}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
export const IconClock = (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></svg>;
export const IconCheck = (p: P) => <svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const IconTrash = (p: P) => <svg {...base} {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>;
export const IconEdit = (p: P) => <svg {...base} {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></svg>;
export const IconLogout = (p: P) => <svg {...base} {...p}><path d="M9 4H5v16h4" /><path d="M16 8l4 4-4 4M20 12H10" /></svg>;
export const IconPhone = (p: P) => <svg {...base} {...p}><path d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a1 1 0 01-1.1 1A16 16 0 014 5.1 1 1 0 015 4z" /></svg>;
export const IconWhatsApp = (p: P) => <svg {...base} {...p}><path d="M20 11.5a8 8 0 01-11.9 7L4 20l1.6-4A8 8 0 1120 11.5z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 01-2-2l1-1-1-2z" /></svg>;
