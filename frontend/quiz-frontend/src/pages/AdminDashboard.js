import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const handleCreateQuiz = () => {
    alert(
      "🛠️ Quiz Creation is Under Development\n\n" +
      "This feature will be available soon.\n" +
      "Thank you for helping us test the admin tools!"
    );
  };

  const buttonStyle = {
    padding: "14px 28px",
    borderRadius: "10px",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "white",
    background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    marginTop: "15px",
    minWidth: "240px",
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
          width: "400px",
        }}
      >
        <h1 style={{ color: "#4e54c8", marginBottom: "10px" }}>
          🛠️ Admin Dashboard
        </h1>

        <p style={{ color: "#555", marginBottom: "30px" }}>
          Welcome, <strong>{user?.email}</strong>
        </p>

        <button style={buttonStyle} onClick={handleCreateQuiz}>
          ➕ Create New Quiz
        </button>

        <br />

        <button
          style={{ ...buttonStyle, background: "#999" }}
          onClick={() => navigate("/select-role")}
        >
          🔙 Back to Roles
        </button>
      </div>
    </div>
  );
}
