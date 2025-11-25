import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:5000";

export default function LoginRegisterPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("⚠️ Username and password are required.");
      return;
    }

    try {
      const endpoint = isLogin ? "login" : "register";
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (!isLogin) {
        // After successful registration, auto-switch to login
        setIsLogin(true);
        setUsername("");
        setPassword("");
        setError("✅ Registration successful! Please login now.");
        return;
      }

      // Login successful -> store token and redirect
      localStorage.setItem("user", JSON.stringify({
        user_id: data.user_id,
        username: data.username,
        token: data.token
      }));

      navigate("/quizzes");
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          width: "350px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "20px", color: "#4e54c8" }}>
          {isLogin ? "Login for QuizMaster" : "Register for QuizMaster"}
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          {error && <p style={{ color: error.includes("✅") ? "green" : "red" }}>{error}</p>}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p style={{ marginTop: "15px", color: "#555" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            style={{ color: "#4e54c8", cursor: "pointer", fontWeight: "bold" }}
          >
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}
