import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import API_URL from "../services/api";

export default function ResultsPage() {
  const { user_id, quiz_id } = useParams();
  const navigate = useNavigate();

  const [scoreData, setScoreData] = useState(null);
  const [average, setAverage] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!token || hasLoaded.current) return;
    hasLoaded.current = true;

    async function fetchResults() {
      try {
        const res = await fetch(`${API_URL}/users/${user_id}/attempts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const history = await res.json();

        if (history.length > 0) {
          const avg =
            history.reduce((sum, a) => sum + a.score, 0) / history.length;
          setAverage(avg.toFixed(2));
        }

        const latestAttempt = history
          .filter((a) => Number(a.quiz_id) === Number(quiz_id))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (!latestAttempt) {
          setScoreData({ score: 0, total: 0 });
          return;
        }

        setScoreData({
          score: latestAttempt.score,
          total: latestAttempt.total,
        });
      } catch (err) {
        console.error("Failed to load results:", err);
        setScoreData({ score: 0, total: 0 });
      }
    }

    fetchResults();
  }, [user_id, quiz_id, token]);

  if (!scoreData) {
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Loading results...
      </p>
    );
  }

  const isGood = scoreData.score >= 15;

  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px 20px",
        fontFamily: "'Poppins', sans-serif",
        minHeight: "80vh",
        background: "linear-gradient(135deg, #e2f2ff 0%, #cde6ff 50%, #e8f4ff 100%)",
      }}
    >
      {isGood && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}

      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          fontSize: "36px",
          color: isGood ? "#1f6fb2" : "#d94b4b",
        }}
      >
        {isGood ? "Congratulations!" : "Better luck next time!"}
      </motion.h1>

      <motion.p
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        style={{ fontSize: "24px", margin: "20px 0" }}
      >
        Your Score: {scoreData.score} / {scoreData.total}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        style={{ fontSize: "18px", color: "#2f557a" }}
      >
        {isGood
          ? "You did amazing! Keep it up."
          : "Don't worry, practice makes perfect."}
      </motion.p>

      <div style={{ color: "#2f557a", marginTop: "10px" }}>
        Average across attempts: {average}%
      </div>

      <motion.button
        onClick={() => navigate("/quizzes")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          marginTop: "40px",
          padding: "15px 30px",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
          boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
        }}
      >
        Go Back Home
      </motion.button>

      <motion.button
        onClick={() => navigate("/predict")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          marginTop: "20px",
          padding: "15px 30px",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(120deg, #6e8197, #8aa2b8)",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
          boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
        }}
      >
        See Predicted Score
      </motion.button>
    </div>
  );
}
