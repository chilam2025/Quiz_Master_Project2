import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API_URL from "../services/api";

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e2f2ff 0%, #cde6ff 50%, #e8f4ff 100%)",
  padding: "24px 16px",
  fontFamily: "'Poppins', sans-serif",
  color: "#0f2b46",
};

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  borderRadius: "14px",
  padding: "16px",
  boxShadow: "0 10px 24px rgba(64,132,207,0.15)",
  border: "1px solid rgba(128,178,232,0.35)",
};

const buttonStyle = {
  padding: "14px 32px",
  fontSize: "16px",
  fontWeight: "600",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
  color: "white",
  boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

export default function HistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState({});
  const [quizTitles, setQuizTitles] = useState({});
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

        // Group attempts by quiz_id
        const grouped = {};
        const titles = {};

        data.forEach(attempt => {
          const quizId = attempt.quiz_id;
          if (!grouped[quizId]) {
            grouped[quizId] = [];
          }
          grouped[quizId].push(attempt);

          // Store quiz title if available
          if (attempt.quiz_title && !titles[quizId]) {
            titles[quizId] = attempt.quiz_title;
          }
        });

        setQuizAttempts(grouped);
        setQuizTitles(titles);

        // Calculate overall average
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

  const [average, setAverage] = useState(0);

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
    if (percent >= 80) return "linear-gradient(180deg, #57a5ff, #3d8fdc)";
    if (percent >= 50) return "linear-gradient(180deg, #7ac7ff, #5faee6)";
    return "linear-gradient(180deg, #a7d9ff, #85bce7)";
  };

  const getGraphBarColor = (index, total) => {
    const hue = 200 + (index * 40) % 160; // Blue-ish colors
    return `hsl(${hue}, 70%, 60%)`;
  };

  // Get quiz IDs sorted by most recent attempt
  const sortedQuizIds = Object.keys(quizAttempts).sort((a, b) => {
    const lastAttemptA = Math.max(...quizAttempts[a].map(a => new Date(a.timestamp)));
    const lastAttemptB = Math.max(...quizAttempts[b].map(a => new Date(a.timestamp)));
    return lastAttemptB - lastAttemptA;
  });

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", color: "#1f6fb2" }}>
          My Quiz History
        </h1>
        <p style={{ textAlign: "center", color: "#2f557a", marginBottom: "24px" }}>
          Track your performance for each quiz
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
              color: "#1f6fb2",
            }}
          >
            Loading history...
          </div>
        )}

        {!loading && attempts.length > 0 && (
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              boxShadow: "0 10px 22px rgba(64,132,207,0.15)",
              marginBottom: "24px",
              border: "1px solid rgba(128,178,232,0.35)",
            }}
          >
            <div style={{ fontSize: "14px", color: "#2f557a" }}>
              Overall Average Score
            </div>
            <div
              style={{
                fontSize: "34px",
                fontWeight: "700",
                color: "#1f6fb2",
              }}
            >
              {average}%
            </div>
            <div style={{ fontSize: "14px", color: "#2f557a", marginTop: "8px" }}>
              Total Attempts: {attempts.length} | Quizzes Taken: {sortedQuizIds.length}
            </div>
          </div>
        )}

        {/* Individual Quiz Graphs */}
        {sortedQuizIds.map(quizId => {
          const attemptsForQuiz = quizAttempts[quizId];
          const quizTitle = quizTitles[quizId] || `Quiz ${quizId}`;
          const sortedAttempts = [...attemptsForQuiz].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
          );

          const averageForQuiz = sortedAttempts.reduce((sum, a) =>
            (a.score / a.total) * 100 + sum, 0
          ) / sortedAttempts.length;

          return (
            <div
              key={quizId}
              style={{
                ...cardStyle,
                marginBottom: "32px",
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <h3 style={{
                  color: "#1f6fb2",
                  margin: 0,
                  fontSize: "18px"
                }}>
                  {quizTitle}
                </h3>
                <div style={{
                  fontSize: "14px",
                  color: "#2f557a",
                  fontWeight: "600"
                }}>
                  Average: {averageForQuiz.toFixed(2)}% | Attempts: {sortedAttempts.length}
                </div>
              </div>

              {/* Simple Graph */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{
                  fontSize: "14px",
                  color: "#2f557a",
                  marginBottom: "8px",
                  textAlign: "center"
                }}>
                  Performance Trend
                </h4>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: "8px",
                    height: "150px",
                    padding: "20px 10px 30px 10px",
                    background: "rgba(245, 250, 255, 0.7)",
                    borderRadius: "10px",
                    border: "1px solid rgba(128,178,232,0.2)",
                    position: "relative"
                  }}
                >
                  {/* Y-axis labels */}
                  <div style={{
                    position: "absolute",
                    left: "10px",
                    top: "20px",
                    bottom: "30px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#2f557a"
                  }}>
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>

                  {/* Graph bars */}
                  {sortedAttempts.map((attempt, index) => {
                    const percent = (attempt.score / attempt.total) * 100;
                    const barHeight = Math.max(percent * 0.8, 5); // Minimum height of 5%
                    return (
                      <motion.div
                        key={attempt.id || index}
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                        style={{
                          flex: 1,
                          background: getGraphBarColor(index, sortedAttempts.length),
                          borderRadius: "6px 6px 0 0",
                          minWidth: "40px",
                          maxWidth: "60px",
                          position: "relative"
                        }}
                        title={`Attempt ${index + 1}: ${percent.toFixed(1)}%
                          ${formatTimestamp(attempt.timestamp)}`}
                      >
                        {/* Percentage label on bar */}
                        <div style={{
                          position: "absolute",
                          top: "-25px",
                          left: "0",
                          right: "0",
                          textAlign: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#1f6fb2"
                        }}>
                          {percent.toFixed(0)}%
                        </div>

                        {/* Attempt number at bottom */}
                        <div style={{
                          position: "absolute",
                          bottom: "-25px",
                          left: "0",
                          right: "0",
                          textAlign: "center",
                          fontSize: "11px",
                          color: "#2f557a"
                        }}>
                          {index + 1}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Attempts List */}
              <div style={{
                marginTop: "16px",
                borderTop: "1px solid rgba(128,178,232,0.3)",
                paddingTop: "16px"
              }}>
                <h4 style={{
                  fontSize: "14px",
                  color: "#2f557a",
                  marginBottom: "12px"
                }}>
                  Individual Attempts
                </h4>
                <div style={{ display: "grid", gap: "12px" }}>
                  {sortedAttempts.map((attempt, index) => {
                    const percent = (attempt.score / attempt.total) * 100;
                    return (

                      <motion.div
                        key={attempt.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        style={{
                          padding: "12px",
                          background: "rgba(245, 250, 255, 0.7)",
                          borderRadius: "8px",
                          border: "1px solid rgba(128,178,232,0.2)",
                        }}
                      >
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px"
                        }}>
                          <div style={{ fontWeight: "600", color: "#1f6fb2" }}>
                            Attempt {index + 1}
                          </div>
                          <div style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: percent >= 70 ? "#2ecc71" : percent >= 50 ? "#f39c12" : "#e74c3c"
                          }}>
                            {percent.toFixed(2)}%
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            color: "#2f557a",
                            marginBottom: "4px"
                          }}
                        >
                          <span>Score</span>
                          <span>
                            {attempt.score}/{attempt.total}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            color: "#2f557a",
                          }}
                        >
                          <span>Date</span>
                          <span>{formatTimestamp(attempt.timestamp)}</span>
                        </div>

                        <div
                          style={{
                            height: "6px",
                            background: "#e5edf7",
                            borderRadius: "4px",
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
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {attempts.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ fontSize: "18px", color: "#2f557a", marginBottom: "20px" }}>
              No quiz attempts yet.
            </p>
            <button
              onClick={() => navigate("/quizzes")}
              style={buttonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 14px 28px rgba(64,132,207,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(64,132,207,0.25)";
              }}

            >
              Take Your First Quiz
            </button>
          </div>
        )}

        {attempts.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <button
              onClick={() => navigate("/quizzes")}
              style={buttonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 14px 28px rgba(64,132,207,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(64,132,207,0.25)";
              }}
            >
              Back to Quizzes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}