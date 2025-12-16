import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import API_URL from "../services/api";

export default function HistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [average, setAverage] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const user_id = user?.user_id;

useEffect(() => {
  async function fetchHistory() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/users/${user_id}/attempts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setAttempts(data);

      if (data.length > 0) {
        const avg =
          data.reduce((sum, a) => (a.score / a.total) * 100 + sum, 0) /
          data.length;
        setAverage(avg.toFixed(2));
      }
    } catch (err) {
      console.error("History error:", err);
    } finally {
      setLoading(false);
    }
  }

  fetchHistory();
}, [token, user_id]);


  const formatTimestamp = (ts) => {
    if (!ts) return "-";
    const date = new Date(ts);
    return isNaN(date)
      ? "-"
      : date.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const getBarColor = (percent) => {
    if (percent >= 80) return "#4CAF50";
    if (percent >= 50) return "#fbc02d";
    return "#f44336";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6fb",
        padding: "24px 16px",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <h1 style={{ textAlign: "center", color: "#4e54c8" }}>
          My Quiz History
        </h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
          Track your performance over time
        </p>
        {loading && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "60vh",
      fontSize: "18px",
      fontWeight: "600",
      color: "#4e54c8",
    }}
  >
    Loading history...
  </div>
)}


        {/* Average */}
        {attempts.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
              marginBottom: "30px",
            }}
          >
            <div style={{ fontSize: "14px", color: "#777" }}>
              Average Score
            </div>
            <div
              style={{
                fontSize: "34px",
                fontWeight: "700",
                color: "#4e54c8",
              }}
            >
              {average}%
            </div>
          </div>
        )}

        {/* History Cards (Responsive) */}
        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          {attempts.length === 0 ? (
            <p style={{ textAlign: "center" }}>No attempts yet.</p>
          ) : (
            attempts.map((a, index) => {
              const percent = (a.score / a.total) * 100;
              return (
                <div
                  key={index}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    padding: "16px",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontWeight: "600" }}>
                    Quiz {a.quiz_id}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      color: "#555",
                    }}
                  >
                    <span>Score</span>
                    <span>
                      {a.score}/{a.total}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      color: "#555",
                    }}
                  >
                    <span>Percentage</span>
                    <span>{percent.toFixed(2)}%</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      color: "#777",
                    }}
                  >
                    <span>Date</span>
                    <span>{formatTimestamp(a.timestamp)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      height: "8px",
                      background: "#eee",
                      borderRadius: "6px",
                      overflow: "hidden",
                      marginTop: "8px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${percent}%`,
                        background: getBarColor(percent),
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chart */}
        {attempts.length > 0 && (
          <div
            style={{
              marginTop: "40px",
              background: "white",
              padding: "20px",
              borderRadius: "14px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ marginBottom: "16px" }}>Score Trend</h3>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "10px",
                overflowX: "auto",
                paddingBottom: "10px",
              }}
            >
              {attempts.map((a, index) => {
                const percent = (a.score / a.total) * 100;
                return (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${percent}px` }}
                    transition={{ duration: 0.6 }}
                    style={{
                      minWidth: "30px",
                      background: getBarColor(percent),
                      borderRadius: "8px",
                    }}
                    title={`${percent.toFixed(2)}%`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Button */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={() => navigate("/quizzes")}
            style={{
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: "600",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
              color: "white",
            }}
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    </div>
  );
}
