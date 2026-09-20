// Shared admin login for the Playwright suites.
//
// /api/auth/send-otp is rate limited to 5 requests per phone per 10 minutes,
// which a few back-to-back suite runs will exhaust. So we cache the signed-in
// browser state on disk and only fall back to a real OTP round-trip when the
// cached session is missing or expired.
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, ".admin-state.json");
const PHONE = process.env.TEST_PHONE || "9602831559";
const OTP = process.env.TEST_OTP || "999999";

async function roleOf(page) {
  return page.evaluate(async () => {
    const r = await fetch("/api/auth/profile");
    if (!r.ok) return null;
    const d = await r.json().catch(() => null);
    return d?.user?.role ?? null;
  });
}

/** Sign in through the real UI and persist the resulting cookies. */
async function otpLogin(page, base) {
  await page.goto(base + "/", { waitUntil: "networkidle", timeout: 60000 });

  // The header hydrates after networkidle, so one click can land on a dead button.
  const tel = page.locator('input[type="tel"]').first();
  for (let i = 0; i < 4 && !(await tel.count()); i++) {
    await page.getByRole("button", { name: /sign in/i }).first().click().catch(() => {});
    await tel.waitFor({ timeout: 4000 }).catch(() => {});
  }
  await tel.fill(PHONE);
  await page.getByRole("button", { name: /send code/i }).first().click();

  const boxes = page.locator('input[maxlength="1"]');
  try {
    await boxes.first().waitFor({ timeout: 20000 });
  } catch {
    const msg = await page.locator("body").innerText().catch(() => "");
    if (/too many/i.test(msg)) {
      throw new Error("OTP rate limit hit. Wait ~10 minutes or delete tests/.admin-state.json and retry.");
    }
    throw new Error("OTP form never appeared");
  }

  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(OTP[i]);
  await page.waitForTimeout(400);
  const verify = page.getByRole("button", { name: /verify/i }).first();
  if (await verify.count()) await verify.click();
  await page.waitForTimeout(2600);
}

/**
 * Returns a context already signed in as ADMIN, reusing the cached session
 * when it is still valid. Callers own closing the context.
 */
async function adminContext(browser, base, options = {}) {
  const opts = { viewport: { width: 1440, height: 950 }, ignoreHTTPSErrors: true, ...options };

  if (fs.existsSync(STATE)) {
    const ctx = await browser.newContext({ ...opts, storageState: STATE });
    const page = await ctx.newPage();
    await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
    if ((await roleOf(page)) === "ADMIN") return { ctx, page, reused: true };
    await ctx.close();
    fs.unlinkSync(STATE);
  }

  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await otpLogin(page, base);

  const role = await roleOf(page);
  if (role === "ADMIN") await ctx.storageState({ path: STATE });
  return { ctx, page, reused: false, role };
}

module.exports = { adminContext, roleOf, STATE };
