import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllQuizzes } from "../services/api";
import { motion } from "framer-motion";

const API_URL = "http://127.0.0.1:5000";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchQuizzes() {
      const data = await getAllQuizzes();
      setQuizzes(data || []);
    }
    fetchQuizzes();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
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
  };

  // Optional helper (not used here directly)
  const fetchRandomQuestion = async (quizId, difficulty) => {
    try {
      const res = await fetch(
        `${API_URL}/quizzes/${quizId}/questions/random/${difficulty}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch question");
      }

      const data = await res.json();
      return data.question;
    } catch (error) {
      console.error("Random question fetch error:", error);
      return null;
    }
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
              onClick={() => setSelectedQuiz(quiz)}
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

        {/* ===== DIFFICULTY MODAL ===== */}
        {selectedQuiz && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              marginTop: "40px",
              background: "white",
              padding: "30px",
              borderRadius: "15px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
              textAlign: "center",
              maxWidth: "400px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <h2 style={{ color: "#4e54c8" }}>{selectedQuiz.title}</h2>
            <p>Select Difficulty Level</p>

            {[
              "Very Easy",
              "Easy",
              "Medium",
              "Hard",
            ].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedDifficulty(level)}
                style={{
                  margin: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border:
                    selectedDifficulty === level
                      ? "2px solid #4e54c8"
                      : "1px solid #ccc",
                  background:
                    selectedDifficulty === level
                      ? "#4e54c8"
                      : "#f0f4f8",
                  color:
                    selectedDifficulty === level ? "white" : "#333",
                  cursor: "pointer",
                }}
              >
                {level}
              </button>
            ))}

            <div style={{ marginTop: "20px" }}>
              <button
                disabled={!selectedDifficulty}
                onClick={() =>
                  navigate(
                    `/quiz/${selectedQuiz.id}?difficulty=${encodeURIComponent(
                      selectedDifficulty
                    )}`
                  )
                }
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: selectedDifficulty ? "#8f94fb" : "#ccc",
                  color: "white",
                  cursor: selectedDifficulty ? "pointer" : "not-allowed",
                  fontSize: "16px",
                }}
              >
                Start Quiz
              </button>

              <button
                onClick={() => {
                  setSelectedQuiz(null);
                  setSelectedDifficulty("");
                }}
                style={{
                  marginLeft: "10px",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ff7e5f",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "40px",
          gap: "12px",
        }}
      >
        <button
          onClick={() => navigate("/history")}
          style={actionButtonStyle}
        >
          📊 View My History
        </button>

        <button
          onClick={() => navigate("/predict")}
          style={actionButtonStyle}
        >
          📈 View My Prediction
        </button>

        <button
          onClick={handleLogout}
          style={{
            ...actionButtonStyle,
            background: "#999",
          }}
        >
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}
