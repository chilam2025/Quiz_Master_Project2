import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../services/api";

console.log("API_URL =", API_URL);

const studentsIllustration =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iMzYwIiB2aWV3Qm94PSIwIDAgNTAwIDM2MCI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzNjAiIHJ4PSIyNCIgZmlsbD0iI2RmZjBmZiIvPjxyZWN0IHg9IjYwIiB5PSIyMTAiIHdpZHRoPSIxNDAiIGhlaWdodD0iNjAiIHJ4PSIxMiIgZmlsbD0iI2I4ZGNmZiIvPjxyZWN0IHg9IjMwMCIgeT0iMjEwIiB3aWR0aD0iMTQwIiBoZWlnaHQ9IjYwIiByeD0iMTIiIGZpbGw9IiNiOGRjZmYiLz48Y2lyY2xlIGN4PSIxMzAiIGN5PSIxNTAiIHI9IjM4IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMzcwIiBjeT0iMTUwIiByPSIzOCIgc3R5bGU9ImZpbGw6I2ZmZiIvPjxyZWN0IHg9IjExMCIgeT0iMTQwIiB3aWR0aD0iNDAiIGhlaWdodD0iNzAiIHJ4PSIxNiIgc3R5bGU9ImZpbGw6IzlmYzhmZiIvPjxyZWN0IHg9IjM1MCIgeT0iMTQwIiB3aWR0aD0iNDAiIGhlaWdodD0iNzAiIHJ4PSIxNiIgc3R5bGU9ImZpbGw6IzlmYzhmZiIvPjxyZWN0IHg9Ijg1IiB5PSIxODAiIHdpZHRoPSI5MCIgaGVpZ2h0PSIxOCIgcng9IjgiIHN0eWxlPSJmaWxsOiM2YWE4Zjc7Ii8+PHJlY3QgeD0iMzI1IiB5PSIxODAiIHdpZHRoPSI5MCIgaGVpZ2h0PSIxOCIgcng9IjgiIHN0eWxlPSJmaWxsOiM2YWE4Zjc7Ii8+PHJlY3QgeD0iMTAwIiB5PSIyMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMiIgcng9IjYiIHN0eWxlPSJmaWxsOiM4N2I3ZmY7Ii8+PHJlY3QgeD0iMzQwIiB5PSIyMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMiIgcng9IjYiIHN0eWxlPSJmaWxsOiM4N2I3ZmY7Ii8+PHJlY3QgeD0iMTE1IiB5PSIyNDIiIHdpZHRoPSIzMiIgaGVpZ2h0PSIxMCIgcng9IjQiIHN0eWxlPSJmaWxsOiM1N2E1ZmY7Ii8+PHJlY3QgeD0iMzU1IiB5PSIyNDIiIHdpZHRoPSIzMiIgaGVpZ2h0PSIxMCIgcng9IjQiIHN0eWxlPSJmaWxsOiM1N2E1ZmY7Ii8+PHBhdGggZD0iTTEzMCAxNDAgYy0xMCAwIC0xOCAtOCAtMTggLTE4IGExOCAxOCAwIDAgMSAzNiAwIGMwIDEwIC04IDE4IC0xOCAxOHoiIHN0eWxlPSJmaWxsOiM0ZjZmOWI7Ii8+PHBhdGggZD0iTTM3MCAxNDAgYy0xMCAwIC0xOCAtOCAtMTggLTE4IGExOCAxOCAwIDAgMSAzNiAwIGMwIDEwIC04IDE4IC0xOCAxOHoiIHN0eWxlPSJmaWxsOiM0ZjZmOWI7Ii8+PHJlY3QgeD0iMTE4IiB5PSIyNjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSI0MCIgcng9IjgiIHN0eWxlPSJmaWxsOiM2YWE4Zjc7Ii8+PHJlY3QgeD0iMzU4IiB5PSIyNjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSI0MCIgcng9IjgiIHN0eWxlPSJmaWxsOiM2YWE4Zjc7Ii8+PHJlY3QgeD0iMTQwIiB5PSIyNjAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIzMiIgcng9IjYiIHN0eWxlPSJmaWxsOiM4N2I3ZmY7Ii8+PHJlY3QgeD0iMzgwIiB5PSIyNjAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIzMiIgcng9IjYiIHN0eWxlPSJmaWxsOiM4N2I3ZmY7Ii8+PHJlY3QgeD0iNjAiIHk9IjkwIiB3aWR0aD0iMzgwIiBoZWlnaHQ9IjEyIiByeD0iNiIgc3R5bGU9ImZpbGw6I2NjZTZmZiIvPjxyZWN0IHg9IjkwIiB5PSIxMDUiIHdpZHRoPSIzMjAiIGhlaWdodD0iMTIiIHJ4PSI2IiBzdHlsZT0iZmlsbDojYjBkOGZmIi8+PC9zdmc+";

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "linear-gradient(135deg, #dff0ff, #c7e3ff 55%, #e7f5ff)",
  fontFamily: "'Poppins', sans-serif",
  padding: "20px",
  position: "relative",
  overflow: "hidden",
};

const cardStyle = {
  width: "400px",
  padding: "42px",
  background: "rgba(255,255,255,0.92)",
  borderRadius: "18px",
  boxShadow: "0 16px 45px rgba(64,132,207,0.18)",
  textAlign: "center",
  border: "1px solid rgba(128, 178, 232, 0.35)",
  position: "relative",
  zIndex: 1,
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "10px",
  border: "1px solid #c7d9ef",
  backgroundColor: "#f8fbff",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
  border: "none",
  borderRadius: "10px",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "10px",
  boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
};

const secondaryButtonStyle = (disabled) => ({
  width: "100%",
  padding: "12px",
  background: disabled ? "#e8f1ff" : "white",
  border: "1px solid #c7d9ef",
  borderRadius: "10px",
  color: disabled ? "#7a9cc0" : "#1f6fb2",
  fontSize: "15px",
  cursor: disabled ? "not-allowed" : "pointer",
  marginTop: "10px",
  boxShadow: "0 10px 25px rgba(64,132,207,0.12)",
});

const rowStyle = { display: "flex", gap: "10px", alignItems: "center" };
const smallText = { fontSize: "13px", color: "#3a5c7a", marginTop: "8px" };

const backgroundOverlay = {
  position: "absolute",
  inset: 0,
  backgroundImage: `url(${studentsIllustration}), url(${studentsIllustration})`,
  backgroundRepeat: "no-repeat, no-repeat",
  backgroundSize: "52% auto, 38% auto",
  backgroundPosition: "14% 24%, 86% 76%",
  opacity: 0.85,
  pointerEvents: "none",
  filter: "saturate(1.1)",
};

export default function AuthPage() {
  const navigate = useNavigate();

  // UI mode
  const [mode, setMode] = useState("login"); // login | register
  const [step, setStep] = useState("auth"); // auth | otp

  // form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // show/hide password
  const [showPassword, setShowPassword] = useState(false);

  // OTP
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // status
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  // countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const title = useMemo(() => {
    if (step === "otp") return "Verify your Email";
    return mode === "login" ? "Login to QuizMaster" : "Register for QuizMaster";
  }, [mode, step]);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);

    const endpoint = mode === "login" ? "/login" : "/register";

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      // REGISTER: should return requires_verification true
      if (mode === "register") {
        if (!res.ok) {
          setError(data.error || "Registration failed");
          return;
        }
        if (data.requires_verification) {
          setSuccess("OTP sent to your email. Enter it below.");
          setStep("otp");
          setCooldown(30);
          return;
        }

        // fallback (if you still allow direct register)
        setSuccess("Registration successful! Please log in.");
        setMode("login");
        return;
      }

      // LOGIN
      if (!res.ok) {
        // if not verified, backend should return 403 + requires_verification
        if (res.status === 403 && data.requires_verification) {
          setSuccess("Your email is not verified. Enter the OTP we sent you.");
          setStep("otp");
          setCooldown(30);
          return;
        }
        setError(data.error || "Login failed");
        return;
      }

      // login success
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: data.email,
          token: data.token,
          user_id: data.user_id,
          role: data.role,
        })
      );
      navigate("/select-role");
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);

    try {
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "OTP verification failed");
        return;
      }

      // if backend returns token after verify, log user in
      if (data.token) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: data.email,
            token: data.token,
            user_id: data.user_id,
            role: data.role,
          })
        );
        navigate("/select-role");
        return;
      }

      // fallback: no token returned
      setSuccess("Verified! Please log in now.");
      setStep("auth");
      setMode("login");
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setBusy(false);
    }
  }

  async function handleResendOtp() {
    resetMessages();
    setBusy(true);

    try {
      const res = await fetch(`${API_URL}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to resend OTP");
        return;
      }

      setSuccess("OTP resent. Check your email.");
      setCooldown(30);
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={containerStyle}>
      <div style={backgroundOverlay} />
      <div style={cardStyle}>
        <h1 style={{ marginBottom: "14px", color: "#1f6fb2" }}>{title}</h1>

        {error && <p style={{ color: "#d94b4b" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a" }}>{success}</p>}

        {/* ==================== AUTH STEP ==================== */}
        {step === "auth" && (
          <>
            <form onSubmit={handleAuthSubmit}>
              <input
                type="text"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />

              <div style={{ ...rowStyle, marginBottom: "15px" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    padding: "12px 12px",
                    borderRadius: "10px",
                    border: "1px solid #c7d9ef",
                    background: "white",
                    cursor: "pointer",
                    color: "#1f6fb2",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button type="submit" style={{ ...buttonStyle, opacity: busy ? 0.75 : 1 }} disabled={busy}>
                {busy ? "Please wait..." : mode === "login" ? "Login" : "Register"}
              </button>
            </form>

            <p style={{ marginTop: "20px" }}>
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <span
                    onClick={() => {
                      setMode("register");
                      resetMessages();
                    }}
                    style={{ color: "#4e54c8", cursor: "pointer", fontWeight: 600 }}
                  >
                    Register here
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span
                    onClick={() => {
                      setMode("login");
                      resetMessages();
                    }}
                    style={{ color: "#4e54c8", cursor: "pointer", fontWeight: 600 }}
                  >
                    Login here
                  </span>
                </>
              )}
            </p>

            {/* Optional manual OTP link */}
            <p style={smallText}>
              Didn’t get verified?{" "}
              <span
                onClick={() => {
                  resetMessages();
                  setStep("otp");
                  setCooldown(0);
                }}
                style={{ color: "#1f6fb2", cursor: "pointer", fontWeight: 700 }}
              >
                Enter OTP
              </span>
            </p>
          </>
        )}

        {/* ==================== OTP STEP ==================== */}
        {step === "otp" && (
          <>
            <p style={{ color: "#3a5c7a", marginBottom: "16px", fontSize: "14px" }}>
              Enter the 6-digit code sent to <b>{email || "your email"}</b>.
            </p>

            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                style={inputStyle}
              />

              <button type="submit" style={{ ...buttonStyle, opacity: busy ? 0.75 : 1 }} disabled={busy}>
                {busy ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <button
              type="button"
              style={secondaryButtonStyle(cooldown > 0 || busy)}
              disabled={cooldown > 0 || busy}
              onClick={handleResendOtp}
            >
              {cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
            </button>

            <button
              type="button"
              style={secondaryButtonStyle(false)}
              onClick={() => {
                resetMessages();
                setStep("auth");
                setOtp("");
              }}
            >
              Back to Login/Register
            </button>

            <p style={smallText}>
              Tip: Check spam/junk folder if you don’t see the email.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
