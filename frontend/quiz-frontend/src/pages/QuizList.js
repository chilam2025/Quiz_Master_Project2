import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllQuizzes } from "../services/api";
import { motion } from "framer-motion";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchQuizzes() {
      const data = await getAllQuizzes();
      setQuizzes(data);
    }
    fetchQuizzes();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const actionButtonStyle = {
    width: "260px",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    fontSize: "15px",
    cursor: "pointer",
    color: "white",
    background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    marginBottom: "12px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        fontFamily: "'Poppins', sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "50px 20px",
      }}
    >
      {/* ===== QUIZ LIST ===== */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: "30px", color: "#4e54c8" }}>
          Available Quizzes
        </h1>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          {quizzes.map((quiz) => (
            <motion.div
              key={quiz.id}
              onClick={() => navigate(`/quiz/${quiz.id}`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "15px",
                cursor: "pointer",
                width: "220px",
                textAlign: "center",
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ color: "#4e54c8", marginBottom: "10px" }}>
                {quiz.title}
              </h2>
              <p style={{ color: "#555", fontSize: "14px" }}>
                {quiz.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ===== ACTION PANEL ===== */}
      <div
        style={{
          marginTop: "50px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <button
          style={actionButtonStyle}
          onClick={() => navigate("/select-role")}
        >
          🔙 Back to Roles
        </button>

        <button
          style={actionButtonStyle}
          onClick={() => navigate("/history")}
        >
          📊 View My History
        </button>

        <button
          style={actionButtonStyle}
          onClick={() => navigate("/predict")}
        >
          📈 View My Prediction
        </button>

        <button
          style={{
            ...actionButtonStyle,
            background: "#999",
            marginTop: "10px",
          }}
          onClick={handleLogout}
        >
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}
