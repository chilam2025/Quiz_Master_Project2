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

const API_URL = "http://127.0.0.1:5000";

const containerStyle = {
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e2f2ff 0%, #cde6ff 50%, #e8f4ff 100%)",
  fontFamily: "Poppins, sans-serif",
};

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  borderRadius: "18px",
  padding: "25px",
  width: "92%",
  maxWidth: "900px",
  boxShadow: "0 16px 45px rgba(64,132,207,0.18)",
  textAlign: "center",
  border: "1px solid rgba(128,178,232,0.35)",
};

const titleStyle = {
  fontWeight: "bold",
  fontSize: "22px",
  marginBottom: "8px",
  color: "#1f6fb2",
};

const subtitleStyle = {
  fontSize: "14px",
  color: "#3a5c7a",
  marginBottom: "14px",
};

const statBox = {
  background: "#f5f8fc",
  padding: "14px",
  borderRadius: "14px",
  fontSize: "15px",
  marginBottom: "12px",
  boxShadow: "inset 0 2px 5px rgba(0,0,0,0.04)",
  border: "1px solid #c7d9ef",
  textAlign: "left",
};

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
  width: `${Math.max(0, Math.min(100, percentage))}%`,
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

const buttonRow = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginTop: "10px",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const miniGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "10px",
};

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

export default function Prediction() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [prediction, setPrediction] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const [goal, setGoal] = useState(80);

  async function loadQuizzes() {
    try {
      const res = await fetch(`${API_URL}/quizzes`, { method: "GET" });
      const data = await res.json();
      setQuizzes(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedQuizId(String(data[0].id));
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

      const gated =
        data?.attempts_found !== undefined &&
        data?.attempts_required !== undefined &&
        data?.attempts_found < data?.attempts_required;

      setPrediction({
        ...data,
        gated,
        predicted_percentage: data.prediction?.predicted_percentage,
        next_attempt_index: data.prediction?.next_attempt_index,
        predicted_score: data.prediction?.predicted_score,
        total_questions: data.prediction?.total_questions,
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

  const chartData =
    prediction?.history?.map((h) => ({
      name: `Attempt ${h.attempt_index ?? ""}`.trim(),
      percentage: h.percentage,
    })) || [];

  if (prediction?.predicted_percentage !== undefined) {
    chartData.push({ name: "Next Attempt", percentage: prediction.predicted_percentage });
  }

  const bestPct = prediction?.summary?.best_percentage;
  const avgPct = prediction?.summary?.average_percentage;
  const lastPct = prediction?.summary?.last_percentage;

  const attemptsFound =
    prediction?.attempt_gate?.attempts_found ?? prediction?.attempts_found;
  const attemptsRequired =
    prediction?.attempt_gate?.attempts_required ?? prediction?.attempts_required;

  const progressGate = prediction?.progress;

  const recommendedDifficulty =
    prediction?.recommendation?.next_quiz_difficulty || "Medium";

  // ✅ FIXED: correct route based on your QuizPage.js
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
        <div style={cardStyle}>
          <h2 style={titleStyle}>Performance Prediction</h2>
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (!quizzes.length) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Performance Prediction</h2>
          <div style={statBox}>
            <strong>No quizzes found.</strong>
            <br />
            Please create a quiz first.
          </div>
          <button style={primaryButton} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onClick={() => navigate("/quizzes")}>
            Return to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={cardStyle}
      >
        <h2 style={titleStyle}>Performance Prediction</h2>

        <div style={subtitleStyle}>
          {prediction?.quiz?.title
            ? `Showing prediction for: ${prediction.quiz.title}`
            : selectedQuiz?.title
            ? `Showing prediction for: ${selectedQuiz.title}`
            : ""}
        </div>

        {/* Selector + summary */}
        <div style={grid2}>
          <div style={statBox}>
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

          <div style={{ ...statBox, padding: 14 }}>
            <strong>Quick Summary</strong>
            <div style={{ marginTop: 10, ...miniGrid }}>
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
            </div>
          </div>
        </div>

        {loadingPrediction && (
          <div style={statBox}>
            <strong>Loading prediction...</strong>
          </div>
        )}

        {/* Gate */}
        {prediction?.gated && !loadingPrediction && (
          <div style={statBox}>
            <strong>Unlock prediction</strong>
            <div style={{ marginTop: 6 }}>
              Attempts: <strong>{attemptsFound ?? 0}</strong> /{" "}
              <strong>{attemptsRequired ?? 2}</strong>
            </div>
            <div style={progressBarContainer}>
              <div style={progressBarFill(Number(progressGate ?? 0))} />
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "#3a5c7a" }}>
              Do {Math.max(0, (attemptsRequired ?? 2) - (attemptsFound ?? 0))} more attempt(s) to unlock prediction.
            </div>
            <div style={buttonRow}>
              <button style={primaryButton} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onClick={() => navigate(`/quiz/${selectedQuizId}?difficulty=Medium`)}>
                Attempt This Quiz
              </button>
              <button style={secondaryButton} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onClick={() => getPrediction(selectedQuizId, goal)}>
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Normal */}
        {!prediction?.gated && prediction && !loadingPrediction && (
          <>
            <div style={grid2}>
              <div style={statBox}>
                <strong>Predicted Percentage:</strong>{" "}
                {prediction.predicted_percentage !== undefined
                  ? `${prediction.predicted_percentage}%`
                  : "—"}
                <div style={progressBarContainer}>
                  <div style={progressBarFill(Number(prediction.predicted_percentage ?? 0))} />
                </div>
              </div>

              <div style={statBox}>
                <strong>Expected Score:</strong>{" "}
                {prediction.predicted_score !== undefined && prediction.total_questions !== undefined
                  ? `${prediction.predicted_score} / ${prediction.total_questions}`
                  : "—"}
                <div style={{ marginTop: 8, fontSize: 14, color: "#3a5c7a" }}>
                  Recommended difficulty: <strong>{recommendedDifficulty}</strong>
                </div>
              </div>
            </div>

            {/* Goal (FIXED message) */}
            <div style={statBox}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>Set a Goal</strong>
                <span style={{ fontWeight: "bold", color: "#1f6fb2" }}>{goal}%</span>
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
                  <span>✅ You’re predicted to reach this goal by the next attempt.</span>
                ) : prediction?.goal?.estimated_attempts_needed !== null &&
                  prediction?.goal?.estimated_attempts_needed !== undefined ? (
                  <span>
                    Estimated attempts to reach {formatMaybeNumber(prediction.goal.target_percentage, 0)}%:{" "}
                    <strong>{prediction.goal.estimated_attempts_needed}</strong>
                  </span>
                ) : (
                  <span>{prediction?.goal?.note || "Try more attempts to improve the estimate."}</span>
                )}
              </div>
            </div>

            {/* Recommendation + Action */}
            <div style={statBox}>
              <strong>Next Action</strong>
              <div style={{ marginTop: 6, fontSize: 14, color: "#3a5c7a" }}>
                Start your next attempt with the recommended difficulty.
              </div>

              <div style={buttonRow}>
                <button style={primaryButton} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onClick={startRecommendedQuiz}>
                  Start Recommended Quiz
                </button>
                <button style={secondaryButton} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onClick={() => getPrediction(selectedQuizId, goal)}>
                  Refresh
                </button>
              </div>
            </div>

            {/* Chart */}
            <div style={{ marginTop: 12, height: 280, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#57a5ff" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Bottom nav */}
        <div style={buttonRow}>
          <button style={secondaryButton} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onClick={() => navigate("/quizzes")}>
            Return to Quizzes
          </button>
          <button style={secondaryButton} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to Top
          </button>
        </div>
      </motion.div>
    </div>
  );
}
