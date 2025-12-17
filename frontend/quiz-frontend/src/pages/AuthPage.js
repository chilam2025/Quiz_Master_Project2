import React, { useState } from "react";
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

const linkStyle = {
  color: "#1f6fb2",
  cursor: "pointer",
  fontWeight: "600",
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
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

if (user?.role === "admin") {
  // show admin buttons
}

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const endpoint = mode === "login" ? "/login" : "/register";

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (mode === "register") {
        setSuccess("Registration successful! Please log in.");
        setMode("login");
        return;
      }

      // Login success: save user
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
    }
  }

  return (
    <div style={containerStyle}>
      <div style={backgroundOverlay} />
      <div style={cardStyle}>
        <h1 style={{ marginBottom: "20px", color: "#1f6fb2" }}>
          {mode === "login" ? "Login to QuizMaster" : "Register for QuizMaster"}
        </h1>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <p style={{ marginTop: "20px" }}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <span
                onClick={() => {
                  setMode("register");
                  setError("");
                  setSuccess("");
                }}
                style={{ color: "#4e54c8", cursor: "pointer" }}
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
                  setError("");
                  setSuccess("");
                }}
                style={{ color: "#4e54c8", cursor: "pointer" }}
              >
                Login here
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
