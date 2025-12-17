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
  const [average, setAverage] = useState(0);
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
    if (percent >= 80) return "linear-gradient(180deg, #57a5ff, #3d8fdc)";
    if (percent >= 50) return "linear-gradient(180deg, #7ac7ff, #5faee6)";
    return "linear-gradient(180deg, #a7d9ff, #85bce7)";
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", color: "#1f6fb2" }}>
          My Quiz History
        </h1>
        <p style={{ textAlign: "center", color: "#2f557a", marginBottom: "24px" }}>
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
              Average Score
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
          </div>
        )}

        <div style={{ display: "grid", gap: "16px" }}>
          {attempts.length === 0 && !loading ? (
            <p style={{ textAlign: "center" }}>No attempts yet.</p>
          ) : (
            attempts.map((a, index) => {
              const percent = (a.score / a.total) * 100;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  style={cardStyle}
                >
                  <div style={{ fontWeight: "600" }}>
                    Quiz {a.quiz_id}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      color: "#2f557a",
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
                      color: "#2f557a",
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
                      color: "#2f557a",
                    }}
                  >
                    <span>Date</span>
                    <span>{formatTimestamp(a.timestamp)}</span>
                  </div>

                  <div
                    style={{
                      height: "8px",
                      background: "#e5edf7",
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
                </motion.div>
              );
            })
          )}
        </div>

        {attempts.length > 0 && (
          <div
            style={{
              marginTop: "30px",
              background: "rgba(255,255,255,0.95)",
              padding: "20px",
              borderRadius: "14px",
              boxShadow: "0 10px 22px rgba(64,132,207,0.15)",
              border: "1px solid rgba(128,178,232,0.35)",
            }}
          >
            <h3 style={{ marginBottom: "16px", color: "#1f6fb2" }}>
              Score Trend
            </h3>

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
      </div>
    </div>
  );
}
