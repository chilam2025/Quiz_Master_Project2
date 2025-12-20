import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllQuizzes } from "../services/api";
import { motion } from "framer-motion";

const API_URL = "http://127.0.0.1:5000";

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e2f2ff 0%, #cde6ff 50%, #e8f4ff 100%)",
  fontFamily: "'Poppins', sans-serif",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "50px 20px",
};

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  padding: "30px",
  borderRadius: "15px",
  cursor: "pointer",
  width: "240px",
  textAlign: "center",
  boxShadow: "0 12px 30px rgba(64,132,207,0.18)",
  border: "1px solid rgba(128,178,232,0.35)",
};

const actionButtonStyle = {
  width: "260px",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  fontSize: "15px",
  cursor: "pointer",
  color: "white",
  background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
  boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const menuItemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 14px",
  background: "white",
  border: "none",
  borderBottom: "1px solid #eef3f9",
  color: "#0f2b46",
  cursor: "pointer",
};

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <div style={pageStyle}>
      {/* Top-left menu */}
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 10 }}>
        <button
          aria-label="Open menu"
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
            border: "1px solid #57a5ff",
            borderRadius: "10px",
            padding: "10px",
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(64,132,207,0.25)",
          }}
        >
          <div style={{ width: 24, height: 2, background: "white", marginBottom: 5, borderRadius: 999 }} />
          <div style={{ width: 24, height: 2, background: "white", marginBottom: 5, borderRadius: 999 }} />
          <div style={{ width: 24, height: 2, background: "white", borderRadius: 999 }} />
        </button>

        {menuOpen && (
          <div
            style={{
              marginTop: 8,
              background: "white",
              border: "1px solid #c7d9ef",
              borderRadius: "12px",
              boxShadow: "0 10px 24px rgba(64,132,207,0.18)",
              overflow: "hidden",
              minWidth: "180px",
            }}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/predict");
              }}
              style={menuItemStyle}
            >
              See Prediction
            </button>
              <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/insights");
              }}
              style={menuItemStyle}
            >
              Insights Dashboard
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/history");
              }}
              style={menuItemStyle}
            >
              See History
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/select-role");
              }}
              style={menuItemStyle}
            >
              Back to Roles
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              style={{ ...menuItemStyle, color: "#d94b4b" }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: "30px", color: "#1f6fb2" }}>
          Available Quizzes
        </h1>
        <p style={{ color: "#2f557a", marginBottom: "20px" }}>
          Tap a quiz to choose your difficulty.
        </p>

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
              onClick={() =>
                setActiveQuizId((prev) => (prev === quiz.id ? null : quiz.id))
              }
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={cardStyle}
            >
              <h2 style={{ color: "#1f6fb2", marginBottom: "10px" }}>
                {quiz.title}
              </h2>
              <p style={{ color: "#365d83", fontSize: "14px" }}>
                {quiz.description}
              </p>

              {activeQuizId === quiz.id && (
                <div style={{ marginTop: "14px" }}>
                  <p style={{ marginBottom: "8px", color: "#2f557a" }}>
                    Choose difficulty
                  </p>
                  {["Very Easy", "Easy", "Medium", "Hard"].map((level) => (
                    <button
                      key={level}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/quiz/${quiz.id}?difficulty=${encodeURIComponent(
                            level
                          )}`
                        );
                      }}
                      style={{
                        margin: "4px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid #57a5ff",
                        background: "#f5f8fc",
                        color: "#0f2b46",
                        cursor: "pointer",
                        fontSize: "13px",
                        transition:
                          "transform 0.15s ease, box-shadow 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 18px rgba(64,132,207,0.18)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
