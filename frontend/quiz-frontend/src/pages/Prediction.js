import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import API_URL from "../services/api";

const containerStyle = {
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e2f2ff 0%, #cde6ff 50%, #e8f4ff 100%)",
  fontFamily: "Poppins, sans-serif",
};

const cardStyle = (isMobile) => ({
  background: "rgba(255,255,255,0.95)",
  borderRadius: "18px",
  padding: isMobile ? "16px" : "25px",
  width: "92%",
  maxWidth: "900px",
  boxShadow: "0 16px 45px rgba(64,132,207,0.18)",
  textAlign: "center",
  border: "1px solid rgba(128,178,232,0.35)",
});

const titleStyle = (isMobile) => ({
  fontWeight: "bold",
  fontSize: isMobile ? "18px" : "22px",
  marginBottom: "8px",
  color: "#1f6fb2",
});

const subtitleStyle = (isMobile) => ({
  fontSize: isMobile ? "13px" : "14px",
  color: "#3a5c7a",
  marginBottom: "14px",
});

const statBox = (isMobile) => ({
  background: "#f5f8fc",
  padding: isMobile ? "12px" : "14px",
  borderRadius: "14px",
  fontSize: isMobile ? "14px" : "15px",
  marginBottom: "12px",
  boxShadow: "inset 0 2px 5px rgba(0,0,0,0.04)",
  border: "1px solid #c7d9ef",
  textAlign: "left",
});

const selectStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "10px",
  marginTop: "8px",
  border: "1px solid #c7d9ef",
  background: "white",
  outline: "none",
};

const progressBarContainer = {
  width: "100%",
  background: "#e0e9f5",
  borderRadius: "10px",
  overflow: "hidden",
  marginTop: "8px",
};

const progressBarFill = (percentage) => ({
  width: `${Math.max(0, Math.min(100, Number(percentage) || 0))}%`,
  background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
  height: "18px",
  borderRadius: "10px",
  transition: "width 0.45s ease-in-out",
});

const primaryButton = {
  background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
  padding: "12px 16px",
  border: "none",
  borderRadius: "12px",
  fontWeight: "bold",
  color: "white",
  cursor: "pointer",
  fontSize: "15px",
  boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  width: "100%",
};

const secondaryButton = {
  background: "white",
  padding: "12px 16px",
  border: "1px solid #c7d9ef",
  borderRadius: "12px",
  fontWeight: "bold",
  color: "#1f6fb2",
  cursor: "pointer",
  fontSize: "15px",
  boxShadow: "0 10px 25px rgba(64,132,207,0.10)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  width: "100%",
};

const buttonRow = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
  gap: "10px",
  marginTop: "10px",
});

const grid2 = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
  gap: "12px",
});

const miniGrid = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr",
  gap: "10px",
});

const miniCard = {
  background: "white",
  border: "1px solid #c7d9ef",
  borderRadius: "12px",
  padding: "10px",
  textAlign: "left",
  boxShadow: "0 10px 25px rgba(64,132,207,0.08)",
};

const miniLabel = { fontSize: "12px", color: "#3a5c7a" };
const miniValue = { fontSize: "16px", fontWeight: "bold", color: "#1f6fb2" };

function formatMaybeNumber(v, decimals = 2) {
  if (v === null || v === undefined) return "—";
  const num = Number(v);
  if (!Number.isFinite(num)) return "—";
  return num.toFixed(decimals);
}

function safeText(v, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

// ✅ Custom tooltip (shows difficulty if present)
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload?.[0]?.payload;
  const pct = payload?.[0]?.value;
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #c7d9ef",
        borderRadius: 10,
        padding: 10,
        boxShadow: "0 10px 25px rgba(64,132,207,0.12)",
      }}
    >
      <div style={{ fontWeight: "bold", color: "#1f6fb2" }}>{label}</div>
      <div style={{ marginTop: 4, color: "#3a5c7a" }}>
        Percentage: <strong>{formatMaybeNumber(pct, 2)}%</strong>
      </div>
      {row?.difficulty ? (
        <div style={{ marginTop: 4, color: "#3a5c7a" }}>
          Difficulty: <strong>{row.difficulty}</strong>
        </div>
      ) : null}
    </div>
  );
}

export default function Prediction() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [prediction, setPrediction] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const [goal, setGoal] = useState(80);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 600 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function loadQuizzes() {
    try {
      const res = await fetch(`${API_URL}/quizzes`, {
        method: "GET",
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      const data = await res.json();
      setQuizzes(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0)
        setSelectedQuizId(String(data[0].id));
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      setQuizzes([]);
    }
  }

  async function getPrediction(quizId, goalPct) {
    if (!user?.token) {
      navigate("/");
      return;
    }
    if (!quizId) return;

    setLoadingPrediction(true);
    try {
      const url = `${API_URL}/predict?user_id=${user.user_id}&quiz_id=${quizId}&goal=${goalPct}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      const data = await res.json();

      const attemptsFound =
        data?.attempt_gate?.attempts_found ?? data?.attempts_found ?? 0;
      const attemptsRequired =
        data?.attempt_gate?.attempts_required ?? data?.attempts_required ?? 2;

      const gated = Number(attemptsFound) < Number(attemptsRequired);

      const lastDiff =
        data?.prediction?.based_on_last_difficulty ??
        data?.based_on_last_difficulty ??
        null;

      setPrediction({
        ...data,
        gated,
        predicted_percentage: data?.prediction?.predicted_percentage,
        next_attempt_index: data?.prediction?.next_attempt_index,
        predicted_score: data?.prediction?.predicted_score,
        total_questions: data?.prediction?.total_questions,
        based_on_last_difficulty: lastDiff,
        selectedQuizId: quizId,
      });
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoadingPrediction(false);
    }
  }

  useEffect(() => {
    if (!user?.token) {
      navigate("/");
      return;
    }
    (async () => {
      await loadQuizzes();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedQuizId) getPrediction(selectedQuizId, goal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuizId]);

  useEffect(() => {
    if (!selectedQuizId) return;
    const t = setTimeout(() => getPrediction(selectedQuizId, goal), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal]);

  const selectedQuiz = useMemo(
    () => quizzes.find((q) => String(q.id) === String(selectedQuizId)),
    [quizzes, selectedQuizId]
  );

  const recommendedDifficulty =
    prediction?.recommendation?.next_quiz_difficulty ?? "Medium";

  const chartData =
    prediction?.history?.map((h) => ({
      name: `Attempt ${h.attempt_index ?? ""}`.trim(),
      percentage: h.percentage,
      difficulty: h.difficulty,
    })) || [];

  // ✅ FIX: Next Attempt should show RECOMMENDED difficulty, not last attempted difficulty
  if (prediction?.predicted_percentage !== undefined) {
    chartData.push({
      name: "Next Attempt",
      percentage: prediction.predicted_percentage,
      difficulty: prediction?.recommendation?.next_quiz_difficulty ?? null,
    });
  }

  const bestPct = prediction?.summary?.best_percentage;
  const avgPct = prediction?.summary?.average_percentage;
  const lastPct = prediction?.summary?.last_percentage;

  const attemptsFound =
    prediction?.attempt_gate?.attempts_found ?? prediction?.attempts_found ?? 0;
  const attemptsRequired =
    prediction?.attempt_gate?.attempts_required ??
    prediction?.attempts_required ??
    2;

  const progressGate =
    prediction?.progress ??
    Math.round((Number(attemptsFound) / Number(attemptsRequired)) * 100);

  function startRecommendedQuiz() {
    const qid = selectedQuizId;
    const diff = recommendedDifficulty || "Medium";
    navigate(`/quiz/${qid}?difficulty=${encodeURIComponent(diff)}`);
  }

  function hoverOn(e) {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 14px 28px rgba(64,132,207,0.25)";
  }
  function hoverOff(e) {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 10px 25px rgba(64,132,207,0.25)";
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle(isMobile)}>
          <h2 style={titleStyle(isMobile)}>Performance Prediction</h2>
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (!quizzes.length) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle(isMobile)}>
          <h2 style={titleStyle(isMobile)}>Performance Prediction</h2>
          <div style={statBox(isMobile)}>
            <strong>No quizzes found.</strong>
            <br />
            Please create a quiz first.
          </div>
          <button
            style={primaryButton}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
            onClick={() => navigate("/quizzes")}
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const confLabel = prediction?.confidence?.label;
  const confReason = prediction?.confidence?.reason;
  const insightLabel = prediction?.insight?.label;
  const insightReason = prediction?.insight?.reason;
  const streakDays = prediction?.streak ?? 0;

  return (
    <div style={containerStyle}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={cardStyle(isMobile)}
      >
        <h2 style={titleStyle(isMobile)}>Performance Prediction</h2>

        <div style={subtitleStyle(isMobile)}>
          {prediction?.quiz?.title
            ? `Showing prediction for: ${prediction.quiz.title}`
            : selectedQuiz?.title
            ? `Showing prediction for: ${selectedQuiz.title}`
            : ""}
        </div>

        <div style={grid2(isMobile)}>
          <div style={statBox(isMobile)}>
            <strong>Select Quiz:</strong>
            <select
              style={selectStyle}
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
            {(prediction?.quiz?.description || selectedQuiz?.description) ? (
              <div style={{ marginTop: 8, fontSize: 14, color: "#3a5c7a" }}>
                {prediction?.quiz?.description || selectedQuiz?.description}
              </div>
            ) : null}
          </div>

          <div style={statBox(isMobile)}>
            <strong>Quick Summary</strong>
            <div style={{ marginTop: 10, ...miniGrid(isMobile) }}>
              <div style={miniCard}>
                <div style={miniLabel}>Best</div>
                <div style={miniValue}>{formatMaybeNumber(bestPct, 2)}%</div>
              </div>
              <div style={miniCard}>
                <div style={miniLabel}>Average</div>
                <div style={miniValue}>{formatMaybeNumber(avgPct, 2)}%</div>
              </div>
              <div style={miniCard}>
                <div style={miniLabel}>Last</div>
                <div style={miniValue}>{formatMaybeNumber(lastPct, 2)}%</div>
              </div>
              <div style={miniCard}>
                <div style={miniLabel}>Streak</div>
                <div style={miniValue}>{streakDays} day(s)</div>
              </div>
            </div>
          </div>
        </div>

        {loadingPrediction && (
          <div style={statBox(isMobile)}>
            <strong>Loading prediction...</strong>
          </div>
        )}

        {prediction?.gated && !loadingPrediction && (
          <div style={statBox(isMobile)}>
            <strong>Unlock prediction</strong>
            <div style={{ marginTop: 6 }}>
              Attempts: <strong>{attemptsFound}</strong> /{" "}
              <strong>{attemptsRequired}</strong>
            </div>
            <div style={progressBarContainer}>
              <div style={progressBarFill(progressGate)} />
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "#3a5c7a" }}>
              Do {Math.max(0, attemptsRequired - attemptsFound)} more attempt(s)
              to unlock prediction.
            </div>
            <div style={buttonRow(isMobile)}>
              <button
                style={primaryButton}
                onMouseEnter={hoverOn}
                onMouseLeave={hoverOff}
                onClick={() => {
                  const diff =
                    prediction?.recommendation?.next_quiz_difficulty ?? "Medium";
                  navigate(
                    `/quiz/${selectedQuizId}?difficulty=${encodeURIComponent(
                      diff
                    )}`
                  );
                }}
              >
                Attempt This Quiz
              </button>
              <button
                style={secondaryButton}
                onMouseEnter={hoverOn}
                onMouseLeave={hoverOff}
                onClick={() => getPrediction(selectedQuizId, goal)}
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {!prediction?.gated && prediction && !loadingPrediction && (
          <>
            <div style={grid2(isMobile)}>
              <div style={statBox(isMobile)}>
                <strong>Predicted Percentage:</strong>{" "}
                {prediction.predicted_percentage !== undefined
                  ? `${prediction.predicted_percentage}%`
                  : "—"}
                <div style={progressBarContainer}>
                  <div
                    style={progressBarFill(
                      Number(prediction.predicted_percentage ?? 0)
                    )}
                  />
                </div>

                <div style={{ marginTop: 8, fontSize: 13, color: "#3a5c7a" }}>
                  Based on last difficulty:{" "}
                  <strong>
                    {safeText(prediction.based_on_last_difficulty, "Unknown")}
                  </strong>
                </div>

                {/* ✅ Extra clarity */}
                <div style={{ marginTop: 6, fontSize: 13, color: "#3a5c7a" }}>
                  Recommended next difficulty:{" "}
                  <strong>{safeText(recommendedDifficulty, "Unknown")}</strong>
                </div>
              </div>

              <div style={statBox(isMobile)}>
                <strong>Expected Score:</strong>{" "}
                {prediction.predicted_score !== undefined &&
                prediction.total_questions !== undefined
                  ? `${prediction.predicted_score} / ${prediction.total_questions}`
                  : "—"}
                <div style={{ marginTop: 8, fontSize: 14, color: "#3a5c7a" }}>
                  Recommended difficulty: <strong>{recommendedDifficulty}</strong>
                </div>
              </div>
            </div>

            <div style={grid2(isMobile)}>
              <div style={statBox(isMobile)}>
                <strong>Confidence</strong>
                <div
                  style={{
                    marginTop: 6,
                    color: "#1f6fb2",
                    fontWeight: "bold",
                  }}
                >
                  {safeText(confLabel)}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#3a5c7a" }}>
                  {safeText(confReason, "")}
                </div>
              </div>

              <div style={statBox(isMobile)}>
                <strong>Insight</strong>
                <div
                  style={{
                    marginTop: 6,
                    color: "#1f6fb2",
                    fontWeight: "bold",
                  }}
                >
                  {safeText(insightLabel)}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#3a5c7a" }}>
                  {safeText(insightReason, "")}
                </div>
              </div>
            </div>

            <div style={statBox(isMobile)}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <strong>Set a Goal</strong>
                <span style={{ fontWeight: "bold", color: "#1f6fb2" }}>
                  {goal}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                style={{ width: "100%", marginTop: 10 }}
              />

              <div style={{ marginTop: 10, fontSize: 14, color: "#3a5c7a" }}>
                {prediction?.goal?.estimated_attempts_needed === 0 ? (
                  <span>You’re predicted to reach this goal by the next attempt.</span>
                ) : prediction?.goal?.estimated_attempts_needed !== null &&
                  prediction?.goal?.estimated_attempts_needed !== undefined ? (
                  <span>
                    Estimated attempts to reach{" "}
                    {formatMaybeNumber(prediction.goal.target_percentage, 0)}%:{" "}
                    <strong>{prediction.goal.estimated_attempts_needed}</strong>
                  </span>
                ) : (
                  <span>
                    {prediction?.goal?.note ||
                      "Try more attempts to improve the estimate."}
                  </span>
                )}
              </div>
            </div>

            <div style={statBox(isMobile)}>
              <strong>Next Action</strong>
              <div style={{ marginTop: 6, fontSize: 14, color: "#3a5c7a" }}>
                Start your next attempt with the recommended difficulty.
              </div>

              <div style={buttonRow(isMobile)}>
                <button
                  style={primaryButton}
                  onMouseEnter={hoverOn}
                  onMouseLeave={hoverOff}
                  onClick={startRecommendedQuiz}
                >
                  Start Recommended Quiz
                </button>
                <button
                  style={secondaryButton}
                  onMouseEnter={hoverOn}
                  onMouseLeave={hoverOff}
                  onClick={() => getPrediction(selectedQuizId, goal)}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                height: isMobile ? 220 : 280,
                width: "100%",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={isMobile ? -25 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 50 : 30}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#57a5ff"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <div style={buttonRow(isMobile)}>
          <button
            style={secondaryButton}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
            onClick={() => navigate("/quizzes")}
          >
            Return to Quizzes
          </button>
          <button
            style={secondaryButton}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to Top
          </button>
        </div>
      </motion.div>
    </div>
  );
}
