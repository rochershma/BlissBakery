export function register() {
  // The bakery runs on IST; the VM clock is UTC. Without this "today", slot
  // cut-offs and every server-rendered time would be 5h30 off.
  process.env.TZ = process.env.TZ || "Asia/Kolkata";
}
