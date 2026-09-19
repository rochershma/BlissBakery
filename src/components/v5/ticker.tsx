const ITEMS: [string, string][] = [
  ["Same-day delivery", "order before 6 PM"],
  ["100% eggless kitchen", "certified pure-veg"],
  ["Free delivery", "on orders over ₹999"],
  ["Custom cakes", "quote within the hour"],
  ["Open every day", "8 AM – 10 PM"],
];

export function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {ITEMS.map(([a, b], i) => (
          <span key={i}>
            <i />
            <b>{a}</b> {b}
          </span>
        ))}
      </div>
    </div>
  );
}
