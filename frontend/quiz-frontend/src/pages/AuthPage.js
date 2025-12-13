import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../services/api";
console.log("API_URL =", API_URL);

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        })
      );

      navigate("/quizzes");
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #4e54c8, #8f94fb)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          width: "380px",
          padding: "40px",
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "20px", color: "#4e54c8" }}>
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
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
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
