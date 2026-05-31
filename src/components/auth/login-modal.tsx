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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { setShowLoginModal(false); resetForm(); }}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={() => { setShowLoginModal(false); resetForm(); }}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-6 pt-8">
          {/* Logo — same as site header */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden relative">
              <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="64px" />
            </div>
          </div>

          {step === "phone" && (
            <>
              <h2 className="text-xl font-bold text-foreground text-center mb-1 font-serif">Sign in to Bliss Bakery</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                We&apos;ll send you a verification code
              </p>

              {/* Phone Input */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground block mb-1.5">Mobile Number</label>
                <div className="flex items-center border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                  <span className="px-3 py-3 bg-muted text-sm font-medium text-muted-foreground border-r border-border">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    className="flex-1 px-3 py-3 text-sm focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive mb-3">{error}</p>}

              {/* OTP Method Selector */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setOtpMethod("whatsapp")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all btn-press flex items-center justify-center gap-1.5 ${
                    otpMethod === "whatsapp"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-foreground border-border hover:border-green-400"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setOtpMethod("sms")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all btn-press flex items-center justify-center gap-1.5 ${
                    otpMethod === "sms"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  SMS
                </button>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading || phone.length !== 10}
                className={`w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  otpMethod === "whatsapp"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover"
                }`}
              >
                {otpMethod === "whatsapp" ? <MessageCircle className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                {loading ? "Sending..." : `Send OTP via ${otpMethod === "whatsapp" ? "WhatsApp" : "SMS"}`}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">Terms</a> and{" "}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <button onClick={() => setStep("phone")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-xl font-bold text-foreground text-center mb-1 font-serif">Enter OTP</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Sent via {otpMethod === "whatsapp" ? "WhatsApp" : "SMS"} to +91 {phone}
              </p>

              {devOtp && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg px-3 py-2 mb-4 text-center">
                  🔧 Dev OTP: <strong>{devOtp}</strong>
                </div>
              )}

              {/* OTP Inputs */}
              <div className="flex justify-center gap-2 mb-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && <p className="text-sm text-destructive text-center mb-3">{error}</p>}

              <button
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <p className="text-sm text-muted-foreground text-center mt-4">
                {resendTimer > 0 ? (
                  <>Resend OTP in {resendTimer}s</>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => { setOtpMethod("whatsapp"); handleSendOtp(); }} className="text-green-600 font-medium hover:underline flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Resend via WhatsApp
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button onClick={() => { setOtpMethod("sms"); handleSendOtp(); }} className="text-primary font-medium hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Resend via SMS
                    </button>
                  </div>
                )}
              </p>
            </>
          )}

          {step === "register" && (
            <>
              <h2 className="text-xl font-bold text-foreground text-center mb-1 font-serif">Welcome! 🎉</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Help us know you better
              </p>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Email (optional)</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive mb-3">{error}</p>}

              <button
                onClick={handleRegister}
                disabled={loading || name.trim().length < 2}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Continue"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
