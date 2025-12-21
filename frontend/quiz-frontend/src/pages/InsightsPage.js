import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API_URL from "../services/api";

// ✅ Small hook to detect phone screens
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

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
  padding: "20px",
  boxShadow: "0 10px 24px rgba(64,132,207,0.15)",
  border: "1px solid rgba(128,178,232,0.35)",
};

const buttonStyle = {
  padding: "12px 18px",
  fontWeight: 600,
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
  color: "white",
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
  width: "100%",
};

const badgeIcon = {
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
};

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function InsightsPage() {
  const [leaders, setLeaders] = useState([]);
  const [weekRange, setWeekRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isMobile = useIsMobile(720); // ✅ tweak breakpoint if you want

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!token) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/leaderboard/weekly`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Unable to load leaderboard");
        }

        const data = await response.json();
        setLeaders(data.leaders || []);
        setWeekRange({ start: data.week_start, end: data.week_end });
      } catch (err) {
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [token, navigate]);

  const topThree = useMemo(() => leaders.slice(0, 3), [leaders]);

  // ✅ Responsive style blocks
  const headerWrapStyle = {
    textAlign: "center",
    marginBottom: "24px",
    padding: isMobile ? "0 4px" : 0,
  };

  const titleStyle = {
    color: "#1f6fb2",
    marginBottom: "6px",
    fontSize: isMobile ? "22px" : "30px",
    lineHeight: 1.2,
  };

  const subtitleStyle = {
    color: "#2f557a",
    margin: 0,
    fontSize: isMobile ? "13px" : "15px",
    lineHeight: 1.45,
  };

  const topBarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    marginBottom: "12px",
    gap: "12px",
    flexDirection: isMobile ? "column" : "row",
  };

  const actionsStyle = {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    width: isMobile ? "100%" : "auto",
  };

  const topThreeGridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  };

  const leaderRowStyle = {
    display: "grid",
    gap: "10px",
    background: "rgba(255,255,255,0.9)",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(128,178,232,0.35)",
    alignItems: "center",
    gridTemplateColumns: isMobile ? "1fr" : "60px 1fr 140px 120px",
  };

  const emailStyle = {
    color: "#0f2b46",
    fontWeight: 600,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header style={headerWrapStyle}>
          <h1 style={titleStyle}>Weekly Insights Leaderboard</h1>

          <p style={subtitleStyle}>
            Top performers ranked by average quiz scores. Ties are broken by the
            fastest completion time.
          </p>

          {weekRange && (
            <div style={{ color: "#2f557a", marginTop: "8px", fontSize: "13px" }}>
              {new Date(weekRange.start).toLocaleDateString()} —{" "}
              {new Date(weekRange.end).toLocaleDateString()} (resets weekly)
            </div>
          )}
        </header>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 10px" }}>
            <div style={{ fontSize: "18px", color: "#1f6fb2", marginBottom: "12px" }}>
              Building the latest leaderboard...
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                border: "4px solid #e2f2ff",
                borderTop: "4px solid #1f6fb2",
                borderRadius: "50%",
                margin: "0 auto",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div style={{ ...cardStyle, textAlign: "center" }}>
            <p style={{ color: "#d94b4b", marginBottom: "12px" }}>{error}</p>
            <button onClick={() => window.location.reload()} style={buttonStyle}>
              Retry
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                ...cardStyle,
                background:
                  "linear-gradient(135deg, rgba(87,165,255,0.1) 0%, rgba(122,199,255,0.1) 100%)",
              }}
            >
              <div style={topBarStyle}>
                <div>
                  <h3 style={{ margin: 0, color: "#1f6fb2" }}>Top performers</h3>
                  <p style={{ margin: 0, color: "#2f557a", fontSize: "13px" }}>
                    Weekly top 10 by average score
                  </p>
                </div>

                <div style={actionsStyle}>
                  <button style={buttonStyle} onClick={() => navigate("/quizzes")}>
                    Start a Quiz
                  </button>
                  <button
                    style={{
                      ...buttonStyle,
                      background: "linear-gradient(120deg, #6cb5ff, #8ad5ff)",
                    }}
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {leaders.length === 0 ? (
                <div style={{ textAlign: "center", color: "#2f557a", padding: "20px" }}>
                  No submissions yet this week. Complete a quiz to claim the top spot!
                </div>
              ) : (
                <>
                  {topThree.length > 0 && (
                    <div style={topThreeGridStyle}>
                      {topThree.map((leader) => (
                        <div
                          key={leader.user_id}
                          style={{
                            background: "rgba(255,255,255,0.9)",
                            borderRadius: "12px",
                            padding: "14px",
                            border: "1px solid rgba(128,178,232,0.35)",
                            boxShadow: "0 8px 18px rgba(64,132,207,0.12)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              marginBottom: "8px",
                            }}
                          >
                            <span style={{ fontSize: "22px" }}>
                              {badgeIcon[leader.badge]}
                            </span>
                            <div style={{ fontWeight: 700, color: "#1f6fb2", ...emailStyle }}>
                              {leader.email}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              color: "#2f557a",
                              fontSize: "13px",
                              gap: "12px",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700 }}>{leader.average_percentage}%</div>
                              <div>Avg score</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 700 }}>
                                {formatDuration(leader.average_duration_seconds)}
                              </div>
                              <div>Avg time</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {leaders.map((leader) => (
                      <div
                        key={`${leader.user_id}-${leader.rank}`}
                        style={leaderRowStyle}
                      >
                        {/* Desktop rank column OR Mobile header row */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontWeight: 700,
                            color: "#1f6fb2",
                            justifyContent: isMobile ? "space-between" : "flex-start",
                          }}
                        >
                          <span>#{leader.rank}</span>
                          {leader.badge && <span>{badgeIcon[leader.badge]}</span>}
                          {isMobile && (
                            <span style={{ color: "#1f6fb2", fontWeight: 800 }}>
                              {leader.average_percentage}% avg
                            </span>
                          )}
                        </div>

                        {/* Email */}
                        <div style={emailStyle}>{leader.email}</div>

                        {/* Desktop score column */}
                        {!isMobile && (
                          <div style={{ color: "#1f6fb2", fontWeight: 700 }}>
                            {leader.average_percentage}% avg
                          </div>
                        )}

                        {/* Time */}
                        <div
                          style={{
                            color: "#2f557a",
                            textAlign: isMobile ? "left" : "right",
                            fontSize: isMobile ? "13px" : "14px",
                          }}
                        >
                          ⏱ {formatDuration(leader.average_duration_seconds)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              style={cardStyle}
            >
              <h3 style={{ marginTop: 0, color: "#1f6fb2" }}>How it works</h3>
              <ul style={{ color: "#2f557a", paddingLeft: "20px", lineHeight: 1.6 }}>
                <li>Leaderboard resets every Monday based on the latest quiz attempts.</li>
                <li>Ranking uses average percentage across all quizzes taken this week.</li>
                <li>Ties are broken by the fastest average completion time.</li>
                <li>Top three performers earn a weekly badge.</li>
              </ul>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
