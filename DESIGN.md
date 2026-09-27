# Bliss Bakery — Design System

Source of truth for the visual language. Read this before changing any UI.
Do not invent new patterns while implementing a page; extend this file instead.

---

## 1. What this business actually is

Not a generic "premium bakery". The catalogue says otherwise:

| Category | Products |
|---|---|
| Theme Cakes | 539 |
| Baby & Shower | 83 |
| Tiered Cakes | 78 |
| Bride & Groom | 32 |
| Occasion Cakes | 28 |
| Heart & Shaped | 28 |

Every live product is a **celebration cake**. There is no bread, no viennoiserie,
no counter pastry. Six categories (Pastries, Cookies, Brownies, Beverages,
Cheesecakes, Signature) exist with zero products and must not be shown to
customers until they are stocked.

Three facts drive the design:

1. **100% eggless.** In Rajasthan this is not a marketing line, it is the
   reason a customer picks this shop over another. It must be the single most
   legible non-price fact on the page.
2. **Made to order.** Reference photo in, quote within the hour, baked in 48.
   This is an atelier, not a shelf.
3. **Two small-town outlets** — Kuchaman City and Kishangarh. Local, not a chain
   pretending to be national.

---

## 2. Brand direction: sweet-shop letterpress

The reference is not Instagram-minimal café branding. It is the printed matter
of an Indian sweet shop: block-printed mithai box labels, painted halwai
signage, the price ledger behind the counter, hallmark and purity stamps.

That tradition gives us things a template cannot:

- **ink on paper**, never ink on white
- **rules** to divide, not boxes to contain
- **stamps and marks** that carry meaning
- **prices set like a ledger** — aligned, tabular, unembarrassed
- **condensed uppercase** for labels, the way a printed label sets them

| Is | Is not |
|---|---|
| warm, printed, crafted | glossy, corporate, chrome-heavy |
| confidently Indian | wedding-kitsch, mehndi motifs, marigold borders |
| editorial | Dribbble concept |
| appetising | "indulgent artisanal journey" copy |

### Personality
Assured and unfussy. The shop has been doing this a while. It shows you the
cake and tells you the price.

### Interaction personality
Quiet. Motion confirms, it does not perform. Nothing bounces.

---

## 3. Typography

### The problem being fixed
An audit of the live homepage found **415 elements set in Inter against 42 in
Plus Jakarta Sans**. Both are on every "generic AI interface" list. Ten distinct
font sizes were in use between 9.5px and 16px — that is noise, not hierarchy.

### The pairing

**Display — Fraunces**
An old-style serif with optical sizing plus `SOFT` and `WONK` axes. It was drawn
for exactly this register: warm, printed, slightly irregular, clearly made by a
person. At display sizes the wonk axis gives the headline a hand-cut quality
that no grotesque can fake. Used large and tight, never for body copy.

**Text & UI — Archivo**
A grotesque descended from American gothic signage, drawn for print and for
small sizes. Its tighter apertures and squarer terminals read as *printed
label*, not *software*. Distinct enough from Fraunces that the pairing reads as
two deliberate voices rather than two similar fonts.

**Prices & numerals — Archivo, tabular figures**
`font-variant-numeric: tabular-nums`. Prices in a list must align on the rupee
mark like a ledger. This is the single detail that makes the commerce feel
considered.

Two families only. A third would be decoration.

### Scale

Hierarchy comes from **jumps**, not increments. Adjacent steps differ by enough
to be obvious.

| Token | Size (desktop / mobile) | Family | Use |
|---|---|---|---|
| `--t-display` | 60 / 36 | Fraunces 600 | Page-defining headline, once per page |
| `--t-h1` | 40 / 28 | Fraunces 600 | Section headline |
| `--t-h2` | 28 / 22 | Fraunces 600 | Sub-section, product name on PDP |
| `--t-h3` | 19 / 17 | Archivo 600 | Card headings, block titles |
| `--t-body` | 16 / 16 | Archivo 400 | Prose, inputs (16px prevents iOS zoom) |
| `--t-sm` | 14 / 14 | Archivo 400 | Secondary text, metadata, product names |
| `--t-label` | 12 / 12 | Archivo 600, `0.06em`, uppercase | Printed labels, badges, filter headings |
| `--t-micro` | 11 / 11 | Archivo 600 | Chrome only — bottom-nav labels, sub-labels |

Eight steps, and `--t-micro` earns its place only in navigation chrome. Nothing
between them. Half-pixel sizes (13.5, 12.5, 10.5) are a legacy of the old
stylesheet and are removed on sight; if a size is not on this list it does not
go in the stylesheet.

**Product names** are set in Archivo 600, not the serif — they are data, and
they must stay legible at two lines in a 200px card.

**Section headlines** are set in Fraunces at `--t-h1`, left-aligned, never
centred. Centred headings on every section is the fastest way to look generic.

---

## 4. Colour

One palette. Every colour has a job; none are decorative.

### Ground
| Token | Value | Job |
|---|---|---|
| `--paper` | `#faf6f0` | The page. Warm, printed. **Not white.** |
| `--paper-2` | `#ffffff` | Raised surfaces only — a card lifted off the paper |
| `--cream` | `#f2eade` | Quiet band, alternate section ground |
| `--ink` | `#1b1512` | Primary text. Brown-black, not neutral black |
| `--ink-2` | `#514741` | Secondary text |
| `--ink-3` | `#7d716a` | Metadata, captions |
| `--rule` | `#e3d9cb` | Hairline rules and borders |
| `--rule-2` | `#cfc2b0` | Emphasised rule |

### Action
| Token | Value | Job |
|---|---|---|
| `--rose` | `#af3f63` | The one action colour. Buttons, links, current state. 5.6:1 on paper |
| `--rose-dk` | `#8e3050` | Hover / pressed |
| `--rose-wash` | `#f7e9ed` | Selected background, never decoration |

### Meaning
| Token | Value | Job |
|---|---|---|
| `--brass` | `#9a6b23` | **Only** the eggless mark and "from" price prefix |
| `--veg` | `#1f7a4d` | **Only** the vegetarian mark |
| `--choc` | `#241814` | Inverted bands (custom-cake block, footer) |
| `--ok` | `#1f7a4d` | Success |
| `--warn` | `#8a5a12` | Warning |
| `--err` | `#a32318` | Error |

### Rules of use
- Rose is for **action**, never for a background flourish.
- Brass appears at most **twice per screen**.
- No gradients anywhere. The current pages have zero; keep it that way.
- A section changes ground (`--paper` → `--cream` → `--choc`) to mark a change
  of **purpose**, not to break up monotony.

---

## 5. Spacing

Single scale, 4px based. Values not on it do not get written.

```
--s-1: 4px    --s-2: 8px    --s-3: 12px   --s-4: 16px
--s-5: 24px   --s-6: 32px   --s-7: 48px   --s-8: 64px
--s-9: 96px   --s-10: 128px
```

- Inside a component: `--s-1` … `--s-4`
- Between components: `--s-5`, `--s-6`
- Section padding: `--s-8` desktop, `--s-6` mobile
- Between major page movements: `--s-9`

Hierarchy is created by **the gap before a thing**, not by a border around it.

---

## 6. Radius

The audit found 30 pill-radius elements on the homepage and 49 on the menu —
the most common radius on the site was the most decorative one. Inverted:

| Element | Radius | Why |
|---|---|---|
| Product & category images | `0` | Photographs are rectangular in print |
| Buttons | `6px` | Enough to feel pressable, not a lozenge |
| Inputs | `6px` | Matches buttons |
| Cards, panels | `10px` | |
| Large feature surfaces, sheets | `18px` | Scale earns radius |
| Pills (`999px`) | **only** filter chips, quantity steppers, the eggless mark | Semantically "a toggle" or "a stamp" |

If an element is not a toggle, a stepper, or a stamp, it is not a pill.

---

## 7. Elevation

Most surfaces have **no shadow**. Separation comes from the paper ground, a
hairline rule, and space.

| Token | Use |
|---|---|
| `--e-0` | none — the default |
| `--e-1` | `0 1px 2px rgba(27,21,18,.06)` — a card genuinely lifted off the paper |
| `--e-2` | `0 12px 28px -12px rgba(27,21,18,.25)` — dropdowns, sheets, dialogs |

Three levels. Nothing else. A shadow means "this floats above the page" — if it
does not float, it does not get one.

---

## 8. Layout

- Max width **1240px**. Full-bleed permitted for photography.
- Not every section is a rail of equal tiles. The homepage audit found **four of
  six sections structurally identical** (kicker + h2 + rail), three of them at
  the *same* 429px height, two sharing the same kicker text. Sections must vary
  in density, ground and composition.
- Rules divide; boxes do not contain. A product grid sits on the paper.
- Asymmetry where it serves hierarchy — a feature product may take two columns.

---

## 9. Product card

Answers, in order of prominence:

1. **What it looks like** — square photo, full card width, zero radius, no overlay
2. **What it is** — name, Archivo 600, two lines max
3. **What it costs** — tabular, ledger-aligned, `from` prefix in brass small caps
4. **That it is eggless** — the mark, top-right of the image
5. Size / serves — one line of metadata, muted
6. Add — text action, not a floating circular button

Not on the card: rating, discount slash, delivery time, badge stack. A card that
says everything says nothing.

---

## 10. The eggless mark

The brand device. A circular stamp, `--veg` rule, set in `--t-label`. It appears
on every product image, in the header once, and in the footer. It is the one
element allowed to be a pill because it is genuinely a stamp.

Never rendered as an emoji. Never as a generic green dot without the word.

---

## 11. Motion

- Page transitions: none. Speed is the feature.
- Image load: 160ms opacity fade from the paper colour, no scale, no skeleton shimmer.
- Add to cart: the cart count ticks; a toast confirms. Nothing jumps.
- Hover on a product: image scales `1.02` over 400ms. Nothing else moves.
- Sheets and dropdowns: 180ms translate, `cubic-bezier(.32,.72,0,1)`.
- Respect `prefers-reduced-motion` — disable all of the above.

No parallax. No scroll-triggered reveals. No bouncing.

---

## 12. Copy

Real facts only. The shop's own vocabulary.

Write: *"Eggless. Baked this morning."* · *"Serves 8–10"* · *"Send a photo, we quote in an hour"*
· *"Same-day before 6pm"*

Never write: *"Indulge in deliciousness"* · *"Where taste meets perfection"*
· *"Crafted with love"* · *"Experience the ultimate culinary journey"*

If a fact is unknown, leave it out. Do not invent awards, years in business, or
customer counts.

---

## 13. Anti-slop checklist

Run against every screen before calling it done.

- [ ] Fewer than 8 pill-radius elements on the page
- [ ] No gradient anywhere
- [ ] At most 3 shadowed elements
- [ ] No two sections share a structure *and* a height
- [ ] No section headline is centred
- [ ] Only the 7 type steps are used
- [ ] Food occupies more screen area than UI chrome on discovery pages
- [ ] Remove the logo — is it still recognisably this shop?
