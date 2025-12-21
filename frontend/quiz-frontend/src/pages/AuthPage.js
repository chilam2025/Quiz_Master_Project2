import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../services/api";

// IMPORTANT: put your Google OAuth Client ID here OR load from env
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "459514600274-7g38fh3gra42c78fk4md2e21hfff3ing.apps.googleusercontent.com";

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
  width: "420px",
  padding: "42px",
  background: "rgba(255,255,255,0.92)",
  borderRadius: "18px",
  boxShadow: "0 16px 45px rgba(64,132,207,0.18)",
  textAlign: "center",
  border: "1px solid rgba(128, 178, 232, 0.35)",
  position: "relative",
  zIndex: 1,
};

const googleBtnWrap = {
  display: "flex",
  justifyContent: "center",
  marginTop: "14px",
};

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

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  // ✅ NEW: wait for Google script to be ready
  const [googleReady, setGoogleReady] = useState(false);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function handleGoogleCredentialResponse(response) {
    resetMessages();
    setBusy(true);

    try {
      const idToken = response?.credential;
      if (!idToken) {
        setError("Google login failed: missing token");
        return;
      }

      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Google auth failed");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          email: data.email,
          token: data.token,
          user_id: data.user_id,
          role: data.role,
        })
      );

      setSuccess("Signed in successfully!");
      navigate("/select-role");
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setBusy(false);
    }
  }

  // ✅ NEW: Poll for Google script load (fixes first-load issue in Docker/Nginx)
  useEffect(() => {
    let tries = 0;
    const maxTries = 40; // 10 seconds

    const timer = setInterval(() => {
      const ok =
        window.google &&
        window.google.accounts &&
        window.google.accounts.id;

      if (ok) {
        setGoogleReady(true);
        clearInterval(timer);
      } else {
        tries += 1;
        if (tries >= maxTries) {
          setGoogleReady(false);
          clearInterval(timer);
        }
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

  // ✅ Init google ONLY after script ready
  useEffect(() => {
    if (!googleReady) return;

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("PASTE_")) {
      setError(
        "Missing Google Client ID. Set REACT_APP_GOOGLE_CLIENT_ID or paste it in AuthPage."
      );
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
      });

      const btnDiv = document.getElementById("googleBtn");
      if (btnDiv) {
        btnDiv.innerHTML = "";
        window.google.accounts.id.renderButton(btnDiv, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: "320",
        });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to initialize Google Sign-In.");
    }
  }, [googleReady]); // important dependency

  return (
    <div style={containerStyle}>
      <div style={backgroundOverlay} />

      <div style={cardStyle}>
        <h1 style={{ marginBottom: "8px", color: "#1f6fb2" }}>
          Welcome to QuizMaster
        </h1>
        <p style={{ marginTop: 0, color: "#3a5c7a", fontSize: "14px" }}>
          Sign in with Google to continue.
        </p>

        {/* ✅ show loading instead of scary error */}
        {!googleReady && !error && (
          <p style={{ color: "#2f557a", fontWeight: 600 }}>
            Loading Google Sign-In…
          </p>
        )}

        {error && <p style={{ color: "#d94b4b" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a" }}>{success}</p>}

        <div style={googleBtnWrap}>
          <div id="googleBtn" />
        </div>

        {busy && (
          <p style={{ fontSize: "12px", color: "#2f557a", marginTop: "10px" }}>
            Signing you in…
          </p>
        )}

        <p style={{ fontSize: "12px", color: "#3a5c7a", marginTop: "14px" }}>
          By continuing, you agree to sign in using your Google account.
        </p>
      </div>
    </div>
  );
}
