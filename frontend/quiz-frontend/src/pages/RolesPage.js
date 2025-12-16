import React from "react";
import { useNavigate } from "react-router-dom";

export default function RolesPage() {
  const navigate = useNavigate();

  const buttonStyle = {
    padding: "14px 28px",
    borderRadius: "10px",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "white",
    background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    margin: "10px",
    minWidth: "220px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "50px",
          borderRadius: "16px",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          width: "350px",
        }}
      >
        <h1 style={{ color: "#4e54c8", marginBottom: "25px" }}>
          Select Your Role
        </h1>

        <button
          style={buttonStyle}
          onClick={() => navigate("/quizzes")}
        >
          👤 Regular User
        </button>

        <br />

        <button
          style={buttonStyle}
          onClick={() => navigate("/admin")}
        >
          🛠️ Admin
        </button>
      </div>
    </div>
  );
}
