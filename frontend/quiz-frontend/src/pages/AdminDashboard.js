import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
  padding: "50px",
  borderRadius: "18px",
  textAlign: "center",
  boxShadow: "0 16px 45px rgba(64,132,207,0.18)",
  width: "420px",
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
  marginTop: "15px",
  minWidth: "240px",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const secondaryButton = {
  ...buttonStyle,
  background: "linear-gradient(120deg, #6e8197, #8aa2b8)",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const handleCreateQuiz = () => {
    alert(
      "Quiz Creation is Under Development\n\n" +
        "This feature will be available soon.\n" +
        "Thank you for helping us test the admin tools!"
    );
  };

  return (
    <div style={pageStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={cardStyle}
      >
        <h1 style={{ color: "#1f6fb2", marginBottom: "10px" }}>
          Admin Dashboard
        </h1>

        <p style={{ color: "#2f557a", marginBottom: "30px" }}>
          Welcome, <strong>{user?.email}</strong>
        </p>

        <button
          style={buttonStyle}
          onClick={handleCreateQuiz}
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
          Create New Quiz
        </button>

        <br />

        <button
          style={secondaryButton}
          onClick={() => navigate("/select-role")}
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
          Back to Roles
        </button>
      </motion.div>
    </div>
  );
}
