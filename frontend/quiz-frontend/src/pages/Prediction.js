import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,} from "recharts";
const API_URL = "http://127.0.0.1:5000";

export default function Prediction() {
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  async function getPrediction() {
    if (!user || !user.token) {
      navigate("/");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/predict?user_id=${user.user_id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      // User has never attempted any quiz
      if (res.status === 404) {
        setPrediction({ noAttempts: true });
        return;
      }

      const data = await res.json();

      setPrediction({
        ...data,
        predicted_percentage: data.prediction?.predicted_percentage,
        next_attempt_index: data.prediction?.next_attempt_index,
        predicted_score: data.prediction?.predicted_score,
        total_questions: data.prediction?.total_questions,
      });
    } catch (err) {
      console.error("Prediction error:", err);
    }
  }

  useEffect(() => {
    getPrediction();
  }, []);

  // ---------------- UI STYLES ----------------
  const containerStyle = {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #9be7ff, #c8d9ff)",
    fontFamily: "Poppins, sans-serif",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "15px",
    padding: "25px",
    width: "90%",
    maxWidth: "600px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
    textAlign: "center",
    animation: "fadeIn 0.8s ease-in-out",
    marginBottom: "20px",
  };

  const titleStyle = {
    fontWeight: "bold",
    fontSize: "22px",
    marginBottom: "15px",
    color: "#3A3A3A",
  };

  const statBox = {
    background: "#f6f7ff",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "16px",
    marginBottom: "10px",
    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.05)",
  };

  const backButton = {
    marginTop: "25px",
    background: "linear-gradient(90deg, #0066ff, #00c8ff)",
    padding: "12px 30px",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
  };

  const progressBarContainer = {
    width: "100%",
    background: "#e0e0e0",
    borderRadius: "10px",
    overflow: "hidden",
    marginTop: "8px",
  };

  const progressBarFill = (percentage) => ({
    width: `${percentage}%`,
    background: "linear-gradient(90deg, #0066ff, #00c8ff)",
    height: "20px",
    borderRadius: "10px",
    transition: "width 0.5s ease-in-out",
  });

  // ---------------- UI STATES ----------------

  // ⏳ Loading state
  if (!prediction) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Performance Prediction</h2>
          <p>Loading your prediction...</p>
        </div>
      </div>
    );
  }

  // ❌ User has not attempted ANY quiz
  if (prediction.noAttempts) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Performance Prediction</h2>

          <div style={statBox}>
            <strong>No performance prediction available.</strong>
            <br />
            You haven't attempted any quiz yet.
          </div>

          {/* ⭐ CTA Button */}
          <button
            style={{
              marginTop: "20px",
              background: "linear-gradient(90deg, #ff7b00, #ffbb00)",
              padding: "14px 35px",
              border: "none",
              borderRadius: "12px",
              fontWeight: "bold",
              color: "white",
              cursor: "pointer",
              fontSize: "18px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
              transition: "transform 0.2s ease",
            }}
            onClick={() => navigate("/quizzes")}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            🚀 Start Your First Quiz
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData =
    prediction.history?.map((h) => ({
      name: `Attempt ${h.attempt_index}`,
      percentage: h.percentage,
    })) || [];

  if (prediction.predicted_percentage !== undefined) {
    chartData.push({
      name: `Next Attempt`,
      percentage: prediction.predicted_percentage,
    });
  }

  // ---------------- MAIN UI ----------------
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Performance Prediction</h2>

        {prediction.message && (
          <div style={statBox}>
            <strong>Message:</strong> {prediction.message}
          </div>
        )}

        {prediction.predicted_percentage !== undefined && (
          <div style={statBox}>
            <strong>Predicted Percentage:</strong>{" "}
            {prediction.predicted_percentage}%
            <div style={progressBarContainer}>
              <div
                style={progressBarFill(prediction.predicted_percentage)}
              ></div>
            </div>
          </div>
        )}

        {prediction.predicted_score !== undefined &&
          prediction.total_questions !== undefined && (
            <div style={statBox}>
              <strong>Expected Score:</strong> {prediction.predicted_score} /{" "}
              {prediction.total_questions}
            </div>
          )}

        {prediction.next_attempt_index !== null &&
          prediction.next_attempt_index !== undefined && (
            <div style={statBox}>
              <strong>Next Attempt Index:</strong>{" "}
              {prediction.next_attempt_index}
            </div>
          )}

        {prediction.trend && (
          <div style={statBox}>
            <strong>Trend:</strong> {prediction.trend}
          </div>
        )}

        {prediction.recommendation && (
          <>
            <div style={statBox}>
              <strong>Difficulty Recommendation:</strong>{" "}
              {prediction.recommendation.difficulty}
            </div>
            <div style={statBox}>
              <strong>Reason:</strong> {prediction.recommendation.reason}
            </div>
          </>
        )}

        <div style={{ marginTop: "20px", height: "250px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#0066ff"
                strokeWidth={3}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <button style={backButton} onClick={() => navigate("/quizzes")}>
          Return to Quizzes
        </button>
      </div>
    </div>
  );
}
