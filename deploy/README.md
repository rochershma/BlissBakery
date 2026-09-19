# Bliss Bakery v5 — Deployment SOP

Everything needed to deploy, update, back up, or move this app to a new server.

| | |
|---|---|
| **Repo / branch** | `https://github.com/rochershma/BlissBakery.git` — branch **`v5`** |
| **Current server** | `172.187.217.79` (Ubuntu 24.04, 2 vCPU, 7.8 GB RAM) |
| **App path** | `/opt/blissbakery-v5` |
| **Domain** | `blissbakery.shop` (Cloudflare DNS, proxied) |
| **Process manager** | PM2 — `blissbakery-v5`, auto-starts on reboot |
| **Ports** | 80 → 301 → 443 → Nginx → `127.0.0.1:3005` |
| **Database** | MySQL 8, local |
| **Images** | Cloudinary CDN |

```bash
ssh -i <your-key>.pem azureuser@172.187.217.79
```

---

## 1. Routine update (code change → live)

From your machine:

```powershell
cd q:\src\poc\bakes\blissbakery-v5
npx tsc --noEmit                 # must be clean
node tests/e2e.cjs               # 77/77
node tests/uicheck.cjs           # 119/119
git add -A
git commit -m "your message"
git push origin v5
```

Then on the server:

```bash
bash /opt/blissbakery-v5/deploy/redeploy.sh
```

`redeploy.sh` pulls `v5`, runs `npm ci`, `prisma generate`, builds, copies static assets into the standalone output, restarts PM2 and verifies. Takes ~90s. It **preserves `.env`**.

> Use `deploy.sh` only for a **first-time** install — it builds `.env` from `/tmp/.env.server`. It will not overwrite an existing `.env`, but `redeploy.sh` is the routine path.

**Verify:**
```bash
bash /opt/blissbakery-v5/deploy/smoke.sh
```

---

## 2. Fresh server from scratch

```bash
# 1. copy the scripts over
scp -i <key>.pem deploy/*.sh azureuser@<NEW_IP>:/tmp/
ssh -i <key>.pem azureuser@<NEW_IP> "sed -i 's/\r$//' /tmp/*.sh"

# 2. install node, mysql, nginx, pm2, firewall
ssh -i <key>.pem azureuser@<NEW_IP> "bash /tmp/setup-server.sh"

# 3. clone the app
ssh -i <key>.pem azureuser@<NEW_IP>
sudo mkdir -p /opt/blissbakery-v5 && sudo chown -R $USER:$USER /opt/blissbakery-v5
git clone --branch v5 --single-branch https://github.com/rochershma/BlissBakery.git /opt/blissbakery-v5

# 4. create .env  (see section 6 for the variables)
sudo nano /opt/blissbakery-v5/.env && sudo chmod 600 /opt/blissbakery-v5/.env

# 5. restore data, deploy, TLS, autostart
bash /tmp/restore.sh /path/to/db-dump.sql.gz
bash /tmp/deploy.sh          # first install only; builds .env
bash /tmp/tls-enable.sh
bash /tmp/enable-autostart.sh
bash /tmp/smoke.sh
```

**Azure NSG / firewall must allow inbound 22, 80, 443.**

---

## 3. Move to a different server

One command, run **on the current server**:

```bash
bash /opt/blissbakery-v5/deploy/migrate-to-new-server.sh <NEW_IP> azureuser ~/.ssh/newkey.pem
```

It backs up here, provisions there, copies `.env` + data, deploys, enables TLS and autostart, then smoke-tests. **The old server keeps running** so you control the cutover.

Afterwards:
1. Cloudflare → DNS → point `A @` and `A www` at the new IP (proxied)
2. On the new server: `bash /opt/blissbakery-v5/deploy/tls-letsencrypt.sh`
3. Cloudflare → SSL/TLS → **Full (Strict)**
4. Watch for an hour, then decommission the old box

---

## 4. Backup & restore

```bash
# manual backup -> /var/backups/blissbakery
bash /opt/blissbakery-v5/deploy/backup.sh

# restore (destructive, asks for confirmation)
bash /opt/blissbakery-v5/deploy/restore.sh /var/backups/blissbakery/db-YYYYMMDD-HHMMSS.sql.gz
pm2 restart blissbakery-v5
```

**Nightly backup at 2am** (keeps 14 days):
```bash
( crontab -l 2>/dev/null; echo "0 2 * * * bash /opt/blissbakery-v5/deploy/backup.sh >> /var/log/bb-backup.log 2>&1" ) | crontab -
crontab -l
```

> Backups are local only. Before going live, ship them off-box — Cloudflare R2 has a 10 GB free tier.

---

## 5. TLS / domain

The origin serves 443 with a self-signed certificate until Let's Encrypt is issued. That is fine behind Cloudflare **Full**, but use **Full (Strict)** with a real cert.

```bash
# only works once Cloudflare DNS points at this server
bash /opt/blissbakery-v5/deploy/tls-letsencrypt.sh you@email.com
```

The script refuses to run if the domain doesn't resolve to this box, and prints the exact DNS records to create. It also enables `certbot.timer` for auto-renewal.

**Cloudflare settings**
- DNS: `A @` and `A www` → server IP, **proxied**
- SSL/TLS: **Full (Strict)** (use **Full** while on the self-signed cert)
- Always Use HTTPS: **on**
- Cache rules: bypass `/api/*`, `/admin/*`, `/cart`, `/checkout`

> Nginx restores the real visitor IP from `CF-Connecting-IP`. Without it every request looks like Cloudflare and rate limiting breaks.

---

## 6. Environment variables

`/opt/blissbakery-v5/.env` — `chmod 600`, never committed.

| Variable | Notes |
|---|---|
| `DATABASE_URL` | `mysql://user:pass@localhost:3306/blissbakery_v5` |
| `JWT_SECRET` | unique per deployment — `openssl rand -base64 32` |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://blissbakery.shop` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | from the Cloudinary dashboard |

The session cookie's `Secure` flag is derived from `X-Forwarded-Proto`, **not** from `NEXT_PUBLIC_APP_URL`, so it stays correct behind Nginx and Cloudflare.

---

## 7. Operations

```bash
pm2 status
pm2 logs blissbakery-v5 --lines 100
pm2 restart blissbakery-v5
pm2 monit

sudo systemctl reload nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

curl -s localhost:3005/api/health
```

**Reboot resilience** — verified by actually rebooting the box. `enable-autostart.sh` registers `pm2-azureuser.service`, enables MySQL and Nginx, and adds an 8-second `ExecStartPre` delay so PM2 doesn't race MySQL on a cold boot.

```bash
sudo systemctl reboot     # app returns on its own
```

---

## 8. Known gotchas

| Symptom | Cause | Fix |
|---|---|---|
| `next start does not work with output: standalone` | PM2 saved the old command; `pm2 restart` reuses it | `pm2 delete` then start `.next/standalone/server.js` |
| `.env` wiped after a deploy | ran `deploy.sh` instead of `redeploy.sh` | use `redeploy.sh` for updates |
| `git push` looks like it hangs | slow through a corporate proxy; output is buffered by `Select-Object` | let it finish, or `git push --porcelain` without piping |
| non-fast-forward rejection | remote moved ahead | `git fetch origin v5` then rebase/merge before pushing |
| CSS missing / stale HTML after deploy | `next build` run while `next dev` shared `.next` | never build against a running dev server; clear `.next` |
| Build fails on `postcss` | `npm ci --omit=dev` — Tailwind is a devDependency | use plain `npm ci` |
| Tables not found after restore | Windows MySQL is case-insensitive, Linux isn't | `fix-table-case.sh` (restore.sh calls it) |
| Import fails at line 1 | PowerShell wrote a UTF-8 BOM | `restore.sh` strips BOM + CRLF |
| Cloudflare 522 | DNS points at an unreachable origin | update the A record to this server |
| Cloudflare 470 from your office | corporate proxy blocking the domain | test on mobile data |
| Images 404 after deploy | `public/uploads/` is gitignored | ship via `backup.sh` / `migrate-to-new-server.sh` |

---

## 9. Test suites

Run against a server on `:3005`:

```bash
node tests/e2e.cjs          # 77 checks — full customer journey incl. ordering
node tests/admin-e2e.cjs    # 26 checks — admin CRUD + propagation speed
node tests/uicheck.cjs      # 119 checks — 17 routes x 7 viewports
node tests/price-audit.cjs  # every flavour x size vs the server price
node tests/perf.cjs         # load timings and image payload
node tests/live-check.cjs   # live HTTPS (BASE=https://... to target a server)
```

`price-audit.cjs` is the important one before any pricing change — it catches "shown one price, charged another".

---

## 10. Not done yet (pre-launch blockers)

1. **OTP is never delivered in production** — `send-otp` logs to console in dev and does nothing in prod. Nobody can log in. Needs an SMS/WhatsApp provider; Indian SMS also needs TRAI DLT registration (3–10 working days).
2. **No payment gateway** — Razorpay is installed but unused. The checkout is pay-on-confirmation by design, so this is not strictly blocking.
3. **No error monitoring** — add Sentry (free tier).
4. **No off-box backups** — see section 4.
5. **No CI** — suites exist but nothing runs them automatically.
