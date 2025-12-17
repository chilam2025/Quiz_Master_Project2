import React from "react";
import { useNavigate } from "react-router-dom";

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e2f2ff 0%, #cde6ff 50%, #e8f4ff 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "'Poppins', sans-serif",
  color: "#0f2b46",
  padding: "20px",
};

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  padding: "50px 45px",
  borderRadius: "18px",
  textAlign: "center",
  boxShadow: "0 16px 45px rgba(64,132,207,0.18)",
  width: "380px",
  border: "1px solid rgba(128,178,232,0.35)",
};

const buttonStyle = {
  padding: "14px 28px",
  borderRadius: "12px",
  border: "none",
  fontSize: "16px",
  cursor: "pointer",
  color: "white",
  background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
  boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
  margin: "10px",
  minWidth: "240px",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

export default function RolesPage() {
  const navigate = useNavigate();

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: "#1f6fb2", marginBottom: "15px" }}>
          Select Your Role
        </h1>
        <p style={{ color: "#2f557a", marginBottom: "25px" }}>
          Choose how you want to explore QuizMaster today.
        </p>

        <button
          style={buttonStyle}
          onClick={() => navigate("/quizzes")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 14px 28px rgba(64,132,207,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 10px 25px rgba(64,132,207,0.25)";
          }}
        >
          Regular User
        </button>

        <br />

        <button
          style={buttonStyle}
          onClick={() => navigate("/admin")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 14px 28px rgba(64,132,207,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 10px 25px rgba(64,132,207,0.25)";
          }}
        >
          Admin
        </button>
      </div>
    </div>
  );
}
