import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { motion } from "framer-motion";

const API_URL = "https://quiz-master-project2-backend.onrender.com";

export default function HistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [average, setAverage] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const user_id = user?.user_id;

  useEffect(() => {
    async function fetchHistory() {
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/users/${user_id}/attempts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        // Ensure timestamp exists
        const dataWithTimestamp = data.map((a) => ({
          ...a,
          timestamp: a.timestamp || null,
        }));

        setAttempts(dataWithTimestamp);

        if (data.length > 0) {
          const avg =
            data.reduce((sum, a) => (a.score / a.total) * 100 + sum, 0) /
            data.length;
          setAverage(avg.toFixed(2));
        }
      } catch (err) {
        console.error("History error:", err);
      }
    }

    fetchHistory();
  }, [token, user_id]);

  // Convert backend timestamp to local string
  const formatTimestamp = (ts) => {
    if (!ts) return "-";
    const date = new Date(ts);
    return isNaN(date)
      ? "-"
      : date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
  };

  // Color bars based on percentage
  const getBarColor = (percentScore) => {
    if (percentScore >= 80) return "linear-gradient(180deg, #76ff7a, #4CAF50)"; // green
    if (percentScore >= 50) return "linear-gradient(180deg, #fff176, #fbc02d)"; // yellow
    return "linear-gradient(180deg, #ff8a80, #f44336)"; // red
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "'Poppins', sans-serif",
        background: "#f0f4f8",
        minHeight: "100vh",
      }}
    >
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <h1
        style={{
          textAlign: "center",
          color: "#4e54c8",
          marginBottom: "30px",
        }}
      >
        📚 My Quiz History
      </h1>

      {/* Table Headers */}
      {attempts.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 2fr",
            gap: "10px",
            fontWeight: "600",
            color: "#555",
            borderBottom: "2px solid #ccc",
            paddingBottom: "8px",
          }}
        >
          <div>Quiz ID</div>
          <div>% Score</div>
          <div>Score</div>
          <div>Attempted On</div>
        </div>
      )}

      {/* User Results History */}
      <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
        {attempts.length === 0 ? (
          <p style={{ textAlign: "center" }}>No attempts yet.</p>
        ) : (
          attempts.map((a, index) => {
            const percentScore = (a.score / a.total) * 100;
            return (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 2fr",
                  gap: "10px",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  background: "#fff",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
                  alignItems: "center",
                }}
              >
                <div>Quiz {a.quiz_id}</div>
                <div>{percentScore.toFixed(2)}%</div>
                <div>
                  {a.score} / {a.total}
                </div>
                <div>{formatTimestamp(a.timestamp)}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Average Score */}
      {attempts.length > 0 && (
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <h3 style={{ fontSize: "20px" }}>Average Score: {average}%</h3>
        </div>
      )}

      {/* Animated Bar Chart */}
      {attempts.length > 0 && (
        <div style={{ marginTop: "50px" }}>
          <h2 style={{ marginBottom: "20px", color: "#333" }}>Score Trend</h2>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-end",
              justifyContent: "center",
              minHeight: "150px",
            }}
          >
            {attempts.map((a, index) => {
              const percentScore = (a.score / a.total) * 100;
              return (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${percentScore}px` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  style={{
                    width: "35px",
                    background: getBarColor(percentScore),
                    borderRadius: "8px",
                    position: "relative",
                    cursor: "pointer",
                  }}
                  title={`Quiz ${a.quiz_id}: ${percentScore.toFixed(2)}%`}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "-20px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "12px",
                      color: "#333",
                    }}
                  >
                    {percentScore.toFixed(0)}%
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Back to Home Button */}
      <div style={{ textAlign: "center", marginTop: "60px" }}>
        <button
          onClick={() => navigate("/quizzes")}
          style={{
            padding: "14px 28px",
            fontSize: "16px",
            fontWeight: "600",
            border: "none",
            borderRadius: "8px",
            background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
            transition: "0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
}
