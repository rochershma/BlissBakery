"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/shared/toast";
import { img } from "@/lib/img";
import { localIso } from "@/lib/slots";
import { IconCake, IconCheck, IconPlus, IconClock, IconLeaf } from "@/components/v5/icons";

export type CustomCakeConfig = {
  storeSlug: string;
  storeName: string;
  whatsapp: string;
  sizes: { name: string; serves: string | null }[];
  flavours: string[];
  inspiration: { name: string; image: string }[];
};

const BUDGETS = ["Under ₹1,000", "₹1,000 – 2,000", "₹2,000 – 5,000", "₹5,000 – 10,000", "₹10,000+"];
const FINISHES = ["Whipped cream", "Buttercream", "Fondant", "Semi-fondant", "Ganache"];
// Custom designs need two clear days in the kitchen.
const LEAD_DAYS = 2;

const DAYS = Array.from({ length: 14 }, (_, n) => {
  const d = new Date();
  d.setDate(d.getDate() + LEAD_DAYS + n);
  return {
    iso: localIso(d),
    dow: d.toLocaleDateString("en-IN", { weekday: "short" }),
    day: String(d.getDate()).padStart(2, "0"),
    mon: d.toLocaleDateString("en-IN", { month: "short" }),
  };
});

type Photo = { url: string; preview: string };

export function CustomCakeForm({ config }: { config: CustomCakeConfig }) {
  const { user, setShowLoginModal } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [size, setSize] = useState("");
  const [flavour, setFlavour] = useState("");
  const [finish, setFinish] = useState("");
  const [theme, setTheme] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(0);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  // Signed-in customers shouldn't retype what we already know.
  useEffect(() => {
    if (!user) return;
    setName((n) => n || user.name || "");
    setPhone((p) => p || user.phone || "");
  }, [user]);

  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const missing = useMemo(() => {
    const m: string[] = [];
    if (!size) m.push("size");
    if (!flavour) m.push("flavour");
    if (name.trim().length < 2) m.push("name");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) m.push("mobile number");
    return m;
  }, [size, flavour, name, cleanPhone]);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!user) { setShowLoginModal(true); return; }
    const room = 5 - photos.length;
    const pick = Array.from(files).slice(0, room);
    if (files.length > room) toast(`Up to 5 photos — added the first ${room}`, "error");
    setUploading((n) => n + pick.length);
    for (const f of pick) {
      try {
        const fd = new FormData();
        fd.append("file", f);
        const r = await fetch("/api/custom-cakes/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok || !d.success) throw new Error(d.message || "Upload failed");
        setPhotos((p) => [...p, { url: d.url, preview: URL.createObjectURL(f) }]);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed", "error");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const summary = () =>
    [
      `Custom cake request${done ? ` ${done}` : ""} — ${config.storeName}`,
      `Size: ${size}`, `Flavour: ${flavour}`,
      finish && `Finish: ${finish}`, theme && `Theme: ${theme}`, message && `Message on cake: ${message}`,
      date && `Needed on: ${date}`, budget && `Budget: ${budget}`, notes && `Notes: ${notes}`,
      `Name: ${name}`, `Mobile: ${cleanPhone}`,
    ].filter(Boolean).join("\n");

  const openWhatsApp = () => {
    if (!config.whatsapp) return;
    window.open(`https://wa.me/91${config.whatsapp}?text=${encodeURIComponent(summary())}`, "_blank", "noopener");
  };

  const submit = async () => {
    setTried(true);
    if (missing.length) {
      toast(`Add your ${missing.join(", ")}`, "error");
      return;
    }
    if (uploading) { toast("Hold on — photos are still uploading", "error"); return; }
    setSending(true);
    try {
      const r = await fetch("/api/custom-cakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: config.storeSlug,
          customerName: name.trim(),
          customerPhone: cleanPhone,
          cakeSize: size,
          baseFlavour: flavour,
          frosting: finish || null,
          theme: theme.trim() || null,
          messageOnCake: message.trim() || null,
          preferredDate: date || null,
          budget: budget || null,
          specialNotes: notes.trim() || null,
          referenceImages: photos.map((p) => p.url),
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || "Couldn't send your request");
      setDone(d.orderNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't send your request", "error");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="wrap" style={{ padding: "40px 16px 80px" }}>
        <div className="v5empty cc5__done">
          <span className="cc5__tick"><IconCheck /></span>
          <h1 className="t-h1">Request received</h1>
          <p className="t-small">
            Reference <b>{done}</b>. {config.storeName} will message you on WhatsApp with a design and a price —
            usually within a few hours. Nothing is charged until you confirm.
          </p>
          <div className="cc5__acts">
            {config.whatsapp ? (
              <button type="button" className="btn btn--rose" onClick={openWhatsApp}>
                Chat on WhatsApp now
              </button>
            ) : null}
            <Link className="btn btn--out" href={`/store/${config.storeSlug}/menu`}>Browse the menu</Link>
          </div>
        </div>
      </div>
    );
  }

  const err = (field: string) => tried && missing.includes(field);

  return (
    <div className="wrap cc5">
      <header className="cc5__head">
        <span className="kicker">Your design, our kitchen</span>
        <h1 className="d2" style={{ marginTop: 8 }}>Design a custom cake</h1>
        <p className="t-small" style={{ marginTop: 8, maxWidth: "56ch" }}>
          Tell us what you have in mind — a theme, a photo, a colour. We&apos;ll send a design and a price on WhatsApp.
          You only pay once you&apos;re happy with it.
        </p>
        <ol className="cc5__steps">
          <li><b>1</b><span>Share your idea</span></li>
          <li><b>2</b><span>Get a quote on WhatsApp</span></li>
          <li><b>3</b><span>We bake &amp; deliver</span></li>
        </ol>
      </header>

      <div className="co5 cc5__grid">
        <div>
          {config.inspiration.length > 0 ? (
            <div className="opt-block">
              <h4>Start from a style <span className="t-small">optional</span></h4>
              <div className="cc5__insp" role="list">
                {config.inspiration.map((t) => (
                  <button
                    type="button"
                    role="listitem"
                    key={t.name}
                    className="cc5__style"
                    aria-pressed={theme === t.name}
                    onClick={() => setTheme((cur) => (cur === t.name ? "" : t.name))}
                  >
                    <span className="cc5__styleimg">
                      <Image src={img(t.image, 220, 220)} alt="" width={110} height={110} unoptimized loading="lazy" />
                      {theme === t.name ? <i><IconCheck /></i> : null}
                    </span>
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={`opt-block${err("size") ? " is-err" : ""}`}>
            <h4>Size</h4>
            <div className="sizes" role="radiogroup" aria-label="Size">
              {config.sizes.map((s) => (
                <button type="button" role="radio" key={s.name} className="sizes__o" aria-checked={size === s.name} onClick={() => setSize(s.name)}>
                  <b>{s.name}</b>
                  {s.serves ? <em>{/serves/i.test(s.serves) ? s.serves : `Serves ${s.serves}`}</em> : null}
                </button>
              ))}
            </div>
          </div>

          <div className={`opt-block${err("flavour") ? " is-err" : ""}`}>
            <h4>Flavour <span className="t-small">all eggless</span></h4>
            <div className="pdp5__flav">
              {config.flavours.map((f) => (
                <button type="button" key={f} className="chip chip--sm" aria-pressed={flavour === f} onClick={() => setFlavour(f)}>{f}</button>
              ))}
            </div>
          </div>

          <div className="opt-block">
            <h4>Finish <span className="t-small">optional</span></h4>
            <div className="pdp5__flav">
              {FINISHES.map((f) => (
                <button type="button" key={f} className="chip chip--sm" aria-pressed={finish === f} onClick={() => setFinish((c) => (c === f ? "" : f))}>{f}</button>
              ))}
            </div>
          </div>

          <div className="opt-block">
            <h4>The design</h4>
            <div className="cc5__fields">
              <div className="field">
                <label htmlFor="cc-theme">Theme or occasion</label>
                <input id="cc-theme" className="input" maxLength={80} placeholder="e.g. Unicorn, Cricket, 25th anniversary" value={theme} onChange={(e) => setTheme(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="cc-msg">Message on the cake</label>
                <input id="cc-msg" className="input" maxLength={60} placeholder="e.g. Happy Birthday Aarav" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="cc-notes">Anything else</label>
                <textarea id="cc-notes" className="textarea" rows={3} maxLength={1000} placeholder="Colours, characters, tiers, a photo to print…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="field">
                <label>Reference photos <span className="t-small">up to 5</span></label>
                <div className="cc5__photos">
                  {photos.map((p, i) => (
                    <span key={p.url} className="cc5__photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt={`Reference ${i + 1}`} />
                      <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((xs) => xs.filter((x) => x.url !== p.url))}>×</button>
                    </span>
                  ))}
                  {Array.from({ length: uploading }).map((_, i) => <span key={`up-${i}`} className="cc5__photo sk" />)}
                  {photos.length + uploading < 5 ? (
                    <button type="button" className="cc5__add" onClick={() => (user ? fileRef.current?.click() : setShowLoginModal(true))}>
                      <IconPlus />
                      <span>{user ? "Add photo" : "Sign in to add"}</span>
                    </button>
                  ) : null}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
                </div>
              </div>
            </div>
          </div>

          <div className="opt-block">
            <h4>When do you need it? <span className="t-small">optional</span></h4>
            <div className="dpick">
              {DAYS.map((d) => (
                <button type="button" key={d.iso} className="dpick__d" aria-pressed={date === d.iso} onClick={() => setDate((c) => (c === d.iso ? "" : d.iso))}>
                  <em>{d.dow}</em><b>{d.day}</b><i>{d.mon}</i>
                </button>
              ))}
            </div>
            <p className="t-small" style={{ marginTop: 10 }}>Custom designs need at least {LEAD_DAYS} days. Sooner? Message us and we&apos;ll try.</p>
          </div>

          <div className="opt-block">
            <h4>Budget <span className="t-small">optional</span></h4>
            <div className="pdp5__flav">
              {BUDGETS.map((b) => (
                <button type="button" key={b} className="chip chip--sm" aria-pressed={budget === b} onClick={() => setBudget((c) => (c === b ? "" : b))}>{b}</button>
              ))}
            </div>
          </div>

          <div className={`opt-block${err("name") || err("mobile number") ? " is-err" : ""}`}>
            <h4>Where should we send the quote?</h4>
            <div className="cc5__fields cc5__fields--2">
              <div className="field">
                <label htmlFor="cc-name">Your name</label>
                <input id="cc-name" className="input" autoComplete="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="cc-phone">WhatsApp number</label>
                <input id="cc-phone" className="input" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <aside className="summary5 cc5__sum">
          <h3 className="t-h3">Your cake</h3>
          <dl className="cc5__dl">
            <div><dt>Size</dt><dd>{size || <span className="t-small">Choose a size</span>}</dd></div>
            <div><dt>Flavour</dt><dd>{flavour || <span className="t-small">Choose a flavour</span>}</dd></div>
            {finish ? <div><dt>Finish</dt><dd>{finish}</dd></div> : null}
            {theme ? <div><dt>Theme</dt><dd>{theme}</dd></div> : null}
            {date ? <div><dt>Needed on</dt><dd>{new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</dd></div> : null}
            {photos.length ? <div><dt>Photos</dt><dd>{photos.length}</dd></div> : null}
          </dl>
          <button type="button" className="btn btn--rose btn--block" onClick={submit} disabled={sending}>
            {sending ? "Sending…" : "Request a quote"}
          </button>
          {missing.length && tried ? <p className="cc5__miss">Still needed: {missing.join(", ")}</p> : null}
          <div className="summary5__trust t-small">
            <span><IconClock width={15} height={15} /> Quote within hours</span>
            <span><IconLeaf width={15} height={15} /> 100% eggless</span>
            <span><IconCake width={15} height={15} /> No payment now</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
