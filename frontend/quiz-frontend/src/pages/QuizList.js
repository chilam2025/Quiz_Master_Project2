import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:5000";

export default function QuizList() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const res = await fetch(`${API_URL}/quizzes`);
        const data = await res.json();
        setQuizzes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuizzes();
  }, []);

  const handleQuizClick = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  if (!user) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "100px",
          fontFamily: "'Poppins', sans-serif",
          color: "#333",
        }}
      >
        <h2>Please login to access quizzes</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        textAlign: "center",
        minHeight: "100vh",
        padding: "50px 20px",
        fontFamily: "'Poppins', sans-serif",
        background: "#f5faff",
        color: "#003366",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        Hello {user.username}, are you ready to take a fun quiz?
      </h1>

      {loading ? (
        <p>Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <p>No quizzes available at the moment.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              onClick={() => handleQuizClick(quiz.id)}
              style={{
                cursor: "pointer",
                width: "300px",
                padding: "20px",
                borderRadius: "12px",
                background: "#ffffff",
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,0,0,0.1)";
              }}
            >
              <h2 style={{ marginBottom: "10px", color: "#003366" }}>{quiz.title}</h2>
              <p style={{ color: "#555", fontSize: "14px" }}>{quiz.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
