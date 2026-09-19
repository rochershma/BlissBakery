"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./auth-provider";
import { X, MessageCircle, Phone, ArrowLeft } from "lucide-react";
import Image from "next/image";

type Step = "phone" | "otp" | "register";

export function LoginModal() {
  const { showLoginModal, setShowLoginModal, sendOtp, login, updateProfile, user } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpMethod, setOtpMethod] = useState<"whatsapp" | "sms">("whatsapp");
  const [otp, setOtp] = useState(["" , "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll, set inert on background, trap focus, auto-focus phone input
  useEffect(() => {
    if (!showLoginModal) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    // Set background inert so search/other inputs can't receive focus
    const appElements = document.querySelectorAll("body > *:not([role='dialog']):not(script):not(style)");
    appElements.forEach((el) => {
      if (!modalRef.current?.contains(el) && el !== modalRef.current?.parentElement) {
        el.setAttribute("inert", "");
      }
    });

    // Focus phone input after mount — only on desktop (mobile keyboard is intrusive)
    const isMobile = window.innerWidth < 768;
    const timer = setTimeout(() => {
      if (!isMobile) {
        if (step === "phone") phoneInputRef.current?.focus();
        else if (step === "otp") otpRefs.current[0]?.focus();
      }
    }, 100);

    // Focus trap: cycle focus within modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLoginModal(false);
        resetForm();
        return;
      }
      if (e.key !== "Tab") return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
      // Remove inert from all elements
      appElements.forEach((el) => el.removeAttribute("inert"));
      previousFocus?.focus();
    };
  }, [showLoginModal, step]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // Close modal if user logs in
  useEffect(() => {
    if (user && step !== "register") {
      setShowLoginModal(false);
      resetForm();
    }
  }, [user, step, setShowLoginModal]);

  if (!showLoginModal) return null;

  function resetForm() {
    setStep("phone");
    setPhone("");
    setOtp(["", "", "", "", "", ""]);
    setName("");
    setEmail("");
    setError("");
    setDevOtp("");
  }

  async function handleSendOtp() {
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.success) {
        setStep("otp");
        setResendTimer(60);
        if (res.devOtp) setDevOtp(res.devOtp);
      } else {
        setError(res.message || "Failed to send OTP");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every((d) => d) && newOtp.join("").length === 6) {
      handleVerifyOtp(newOtp.join(""));
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(otpValue?: string) {
    const code = otpValue || otp.join("");
    if (code.length !== 6) {
      setError("Enter 6-digit OTP");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await login(phone, code);
      if (res.success) {
        if (res.isNewUser) {
          setStep("register");
        }
        // If existing user, the useEffect above will close modal
      } else {
        setError(res.message || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (name.trim().length < 2) {
      setError("Enter your name (at least 2 characters)");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const success = await updateProfile(name.trim(), email.trim() || undefined);
      if (success) {
        setShowLoginModal(false);
        resetForm();
      } else {
        setError("Failed to save profile");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" ref={modalRef}>
      <div className="auth__scrim" onClick={() => { setShowLoginModal(false); resetForm(); }} />

      <div className="auth__sheet animate-in slide-in-from-bottom duration-300">
        <div className="auth__grip" />
        <button
          aria-label="Close"
          onClick={() => { setShowLoginModal(false); resetForm(); }}
          className="auth__x"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="auth__body">
          <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" width={116} height={116} className="auth__mark" unoptimized />

          {step === "phone" && (
            <>
              <h2 className="auth__h">Sign in to Bliss Bakery</h2>
              <p className="auth__sub">We&apos;ll text you a one-time code — no password to remember.</p>

              <div className="mt-5">
                <label className="auth__lbl">Mobile number</label>
                <div className="auth__phone">
                  <b>+91</b>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  />
                </div>
              </div>

              {error && <p className="auth__err">{error}</p>}

              <div className="auth__ch">
                <button type="button" aria-pressed={otpMethod === "whatsapp"} onClick={() => setOtpMethod("whatsapp")}>
                  <MessageCircle /> WhatsApp
                </button>
                <button type="button" aria-pressed={otpMethod === "sms"} onClick={() => setOtpMethod("sms")}>
                  <Phone /> SMS
                </button>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading || phone.length !== 10}
                className="btn btn--rose btn--block btn--lg"
                style={{ marginTop: 14 }}
              >
                {loading ? "Sending…" : "Send code"}
              </button>

              <p className="auth__note">
                By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
              </p>

              <div className="auth__trust">
                <span><span className="veg" />100% eggless</span>
                <span>FSSAI licensed</span>
              </div>
            </>
          )}

          {step === "otp" && (
            <>
              <button onClick={() => setStep("phone")} className="auth__back">
                <ArrowLeft /> Change number
              </button>
              <h2 className="auth__h" style={{ marginTop: 12 }}>Enter your code</h2>
              <p className="auth__sub">
                Sent via {otpMethod === "whatsapp" ? "WhatsApp" : "SMS"} to +91 {phone}
              </p>

              {devOtp && (
                <div className="auth__dev">
                  Test code <b>{devOtp}</b>
                </div>
              )}

              <div className="auth__otp">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    aria-label={`Digit ${i + 1}`}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && <p className="auth__err">{error}</p>}

              <button
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.join("").length !== 6}
                className="btn btn--rose btn--block btn--lg"
                style={{ marginTop: 18 }}
              >
                {loading ? "Verifying…" : "Verify & continue"}
              </button>

              {resendTimer > 0 ? (
                <p className="auth__note">Resend available in {resendTimer}s</p>
              ) : (
                <div className="auth__resend">
                  <button onClick={() => { setOtpMethod("whatsapp"); handleSendOtp(); }}>
                    <MessageCircle /> Resend on WhatsApp
                  </button>
                  <span style={{ color: "var(--line-2)" }}>·</span>
                  <button onClick={() => { setOtpMethod("sms"); handleSendOtp(); }}>
                    <Phone /> SMS
                  </button>
                </div>
              )}
            </>
          )}

          {step === "register" && (
            <>
              <h2 className="auth__h">Welcome to Bliss Bakery</h2>
              <p className="auth__sub">Just your name, so we can put it on the box.</p>

              <div className="mt-5" style={{ display: "grid", gap: 14 }}>
                <div>
                  <label className="auth__lbl">Full name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="auth__lbl">Email <span style={{ textTransform: "none", letterSpacing: 0 }}>· optional</span></label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {error && <p className="auth__err">{error}</p>}

              <button
                onClick={handleRegister}
                disabled={loading || name.trim().length < 2}
                className="btn btn--rose btn--block btn--lg"
                style={{ marginTop: 18 }}
              >
                {loading ? "Saving…" : "Continue"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
