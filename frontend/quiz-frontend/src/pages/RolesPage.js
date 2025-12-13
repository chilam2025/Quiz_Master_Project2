import React from "react";
import { useNavigate } from "react-router-dom";

export default function RoleSelectPage() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Choose how you want to continue</h1>

      <button
        style={{ padding: "15px", margin: "20px", width: "200px" }}
        onClick={() => navigate("/quizzes")}
      >
        👤 Regular User
      </button>

      <button
        style={{ padding: "15px", margin: "20px", width: "200px" }}
        onClick={() => navigate("/admin")}
      >
        🛠️ Admin
      </button>
    </div>
  );
}
