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

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", paddingTop: "50px", paddingBottom: "50px", background: "#f0f4f8", fontFamily: "'Poppins', sans-serif", justifyContent: "space-between" }}>
      <div>
        <h1 style={{ marginBottom: "30px", color: "#4e54c8" }}>Available Quizzes</h1>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px" }}>
          {quizzes.map((quiz) => (
            <motion.div
              key={quiz.id}
              onClick={() => navigate(`/quiz/${quiz.id}`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ background: "white", padding: "30px", borderRadius: "15px", cursor: "pointer", width: "220px", textAlign: "center", boxShadow: "0 5px 15px rgba(0,0,0,0.1)", transition: "box-shadow 0.3s, transform 0.3s" }}
            >
              <h2 style={{ color: "#4e54c8", marginBottom: "10px" }}>{quiz.title}</h2>
              <p style={{ color: "#555", fontSize: "14px" }}>{quiz.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Logout button at bottom center */}
      <button
        onClick={handleLogout}
        style={{ marginTop: "40px", padding: "12px 30px", borderRadius: "8px", border: "none", background: "linear-gradient(90deg, #4e54c8, #8f94fb)", color: "white", fontSize: "16px", cursor: "pointer", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
      >
        Log Out
      </button>
    </div>
  );
}
