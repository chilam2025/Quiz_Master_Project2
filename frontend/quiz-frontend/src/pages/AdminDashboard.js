import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (user.role !== "admin") {
      alert("Access denied: Admins only");
      navigate("/quizzes");
    }
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🛠️ Admin Dashboard</h1>

      <button onClick={() => navigate("/admin/create-quiz")}>
        Create New Quiz
      </button>
    </div>
  );
}
