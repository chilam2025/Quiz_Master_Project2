import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API_URL from "../services/api";

function useIsMobile(breakpoint = 720) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e2f2ff 0%, #cde6ff 50%, #e8f4ff 100%)",
    padding: "22px 14px",
    fontFamily: "'Poppins', sans-serif",
    color: "#0f2b46",
  },
  wrap: {
    maxWidth: "1050px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "18px",
    padding: "0 6px",
  },
  title: (isMobile) => ({
    color: "#1f6fb2",
    margin: "0 0 6px 0",
    fontSize: isMobile ? "22px" : "30px",
    lineHeight: 1.2,
    fontWeight: 800,
    letterSpacing: "-0.2px",
  }),
  sub: (isMobile) => ({
    color: "#2f557a",
    margin: 0,
    fontSize: isMobile ? "13px" : "15px",
    lineHeight: 1.45,
    maxWidth: "780px",
    marginInline: "auto",
  }),
  // ✅ NEW: notice banner
  notice: (isMobile) => ({
    marginTop: "10px",
    padding: isMobile ? "10px 12px" : "10px 16px",
    borderRadius: "10px",
    background: "rgba(87,165,255,0.12)",
    color: "#1f6fb2",
    fontSize: isMobile ? "12.5px" : "13.5px",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    maxWidth: "720px",
    marginInline: "auto",
  }),
  week: {
    color: "#2f557a",
    marginTop: "8px",
    fontSize: "12.5px",
    opacity: 0.95,
  },
  card: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 14px 32px rgba(64,132,207,0.14)",
    border: "1px solid rgba(128,178,232,0.35)",
    overflow: "hidden",
  },
  heroCard: {
    background:
      "linear-gradient(135deg, rgba(87,165,255,0.12) 0%, rgba(122,199,255,0.10) 100%)",
  },
  topBar: (isMobile) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    gap: "12px",
    flexDirection: isMobile ? "column" : "row",
    marginBottom: "12px",
  }),
  topBarLeftTitle: {
    margin: 0,
    color: "#1f6fb2",
    fontWeight: 800,
    fontSize: "18px",
  },
  topBarLeftSub: {
    margin: "4px 0 0 0",
    color: "#2f557a",
    fontSize: "13px",
  },
  actions: (isMobile) => ({
    display: "grid",
    gap: "10px",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    width: isMobile ? "100%" : "auto",
  }),
  btn: {
    padding: "12px 16px",
    fontWeight: 700,
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(64,132,207,0.22)",
    width: "100%",
    transition: "transform 0.15s ease",
  },
  btnAlt: {
    background: "linear-gradient(120deg, #6cb5ff, #8ad5ff)",
  },
  topThreeGrid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  }),
  miniCard: {
    background: "rgba(255,255,255,0.92)",
    borderRadius: "14px",
    padding: "14px",
    border: "1px solid rgba(128,178,232,0.35)",
    boxShadow: "0 10px 22px rgba(64,132,207,0.10)",
  },
  email: {
    fontWeight: 700,
    color: "#123a5c",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  badge: { fontSize: "22px" },
  miniRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "10px",
    color: "#2f557a",
    fontSize: "13px",
  },
  row: (isMobile) => ({
    display: "grid",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(128,178,232,0.35)",
    alignItems: "center",
    gridTemplateColumns: isMobile ? "1fr" : "68px 1fr 160px 140px",
  }),
  rank: (isMobile) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: isMobile ? "space-between" : "flex-start",
    gap: "8px",
    fontWeight: 800,
    color: "#1f6fb2",
  }),
  score: {
    fontWeight: 800,
    color: "#1f6fb2",
  },
  time: (isMobile) => ({
    textAlign: isMobile ? "left" : "right",
    color: "#2f557a",
    fontSize: "13.5px",
  }),
  empty: {
    textAlign: "center",
    color: "#2f557a",
    padding: "22px 10px",
    fontSize: "14px",
  },
  error: {
    textAlign: "center",
    color: "#d94b4b",
    marginBottom: "12px",
    fontWeight: 600,
  },
  spinnerWrap: {
    textAlign: "center",
    padding: "60px 10px",
  },
  spinnerText: {
    fontSize: "18px",
    color: "#1f6fb2",
    marginBottom: "12px",
    fontWeight: 700,
  },
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
  const isMobile = useIsMobile(720);

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

        if (!response.ok) throw new Error("Unable to load leaderboard");

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

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <header style={styles.header}>
          <h1 style={styles.title(isMobile)}>Weekly Leaderboard</h1>
          <p style={styles.sub(isMobile)}>
            Top 10 students ranked by performance this week.
          </p>

          {/* ✅ NEW banner message */}
          <div style={styles.notice(isMobile)}>
            <span>🔔</span>
            <span>
              Attempt at least <strong>3 quizzes</strong> (including{" "}
              <strong>Medium or Hard</strong>) to appear on the leaderboard.
            </span>
          </div>

          {weekRange && (
            <div style={styles.week}>
              {new Date(weekRange.start).toLocaleDateString()} —{" "}
              {new Date(weekRange.end).toLocaleDateString()}
            </div>
          )}
        </header>

        {loading ? (
          <div style={styles.spinnerWrap}>
            <div style={styles.spinnerText}>Loading leaderboard...</div>
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
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : error ? (
          <div style={styles.card}>
            <div style={styles.error}>{error}</div>
            <button onClick={() => window.location.reload()} style={styles.btn}>
              Retry
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ ...styles.card, ...styles.heroCard }}
          >
            <div style={styles.topBar(isMobile)}>
              <div>
                <h3 style={styles.topBarLeftTitle}>Top Performers</h3>
                <p style={styles.topBarLeftSub}>This week’s top 10 results</p>
              </div>

              <div style={styles.actions(isMobile)}>
                <button style={styles.btn} onClick={() => navigate("/quizzes")}>
                  Start a Quiz
                </button>
                <button
                  style={{ ...styles.btn, ...styles.btnAlt }}
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </button>
              </div>
            </div>

            {leaders.length === 0 ? (
              <div style={styles.empty}>
                No eligible students yet. Attempt more quizzes to appear here.
              </div>
            ) : (
              <>
                {topThree.length > 0 && (
                  <div style={styles.topThreeGrid(isMobile)}>
                    {topThree.map((leader) => (
                      <div key={leader.user_id} style={styles.miniCard}>
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <span style={styles.badge}>
                            {badgeIcon[leader.badge]}
                          </span>
                          <div style={styles.email}>{leader.email}</div>
                        </div>

                        <div style={styles.miniRow}>
                          <div>
                            <div style={styles.score}>
                              {(leader.weighted_score ??
                                leader.average_percentage) ?? "—"}
                              %
                            </div>
                            <div>Score</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800 }}>
                              {leader.avg_time_ratio != null
                                ? `${leader.avg_time_ratio}x`
                                : formatDuration(
                                    leader.average_duration_seconds
                                  )}
                            </div>
                            <div>Speed</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {leaders.map((leader) => (
                    <div
                      key={`${leader.user_id}-${leader.rank}`}
                      style={styles.row(isMobile)}
                    >
                      <div style={styles.rank(isMobile)}>
                        <span>#{leader.rank}</span>
                        {leader.badge && <span>{badgeIcon[leader.badge]}</span>}
                        {isMobile && (
                          <span style={styles.score}>
                            {(leader.weighted_score ??
                              leader.average_percentage) ?? "—"}
                            %
                          </span>
                        )}
                      </div>

                      <div style={styles.email}>{leader.email}</div>

                      {!isMobile && (
                        <div style={styles.score}>
                          {(leader.weighted_score ??
                            leader.average_percentage) ?? "—"}
                          % avg
                        </div>
                      )}

                      <div style={styles.time(isMobile)}>
                        ⏱{" "}
                        {leader.avg_time_ratio != null
                          ? `${leader.avg_time_ratio}x expected`
                          : formatDuration(leader.average_duration_seconds)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
