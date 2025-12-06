import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { motion } from "framer-motion";

const API_URL = "https://quiz-master-app-psrq.onrender.com";

export default function ResultsPage() {
  const { user_id, quiz_id } = useParams();
  const [scoreData, setScoreData] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [average, setAverage] = useState(0);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    async function fetchScore() {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/users/${user_id}/attempts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const history = await res.json();
        setAttempts(history);

// Compute average score
        if (history.length > 0) {
          const avg =
            history.reduce((sum, a) => sum + a.score, 0) / history.length;
          setAverage(avg.toFixed(2));
}
        const attempt = history.find((a) => a.quiz_id === parseInt(quiz_id));

        const resQuiz = await fetch(`${API_URL}/quizzes/${quiz_id}`);
        const quizData = await resQuiz.json();
        const totalQuestions = quizData.questions.length;

        setScoreData({
          score: attempt ? attempt.score : 0,
          total: totalQuestions,
        });
      } catch (err) {
        console.error(err);
        setScoreData({ score: 0, total: 1 });
      }
    }
    fetchScore();
  }, [user_id, quiz_id, token]);

  if (!scoreData)
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Loading results...
      </p>
    );

  const showThumbsDown = scoreData.score < 15;
  const isGood = !showThumbsDown;

  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px",
        fontFamily: "'Poppins', sans-serif",
        minHeight: "80vh",
        background: "#f0f4f8",
      }}
    >
      {isGood && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
        />
      )}

      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{ fontSize: "36px", color: isGood ? "#4CAF50" : "#FF3B3B" }}
      >
        {isGood ? "🎉 Congratulations!" : "😢 Better luck next time!"}
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
        style={{ fontSize: "18px", color: "#555" }}
      >
        {isGood
          ? "You did amazing! Keep it up 👍"
          : "Don't worry, practice makes perfect 💪"}
      </motion.p>

      {showThumbsDown && (
        <motion.img
          src="/thumbs-down.png"
          alt="Try Again"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          style={{ width: "120px", marginTop: "20px" }}
        />
      )}

      <motion.button
        onClick={() => navigate("/quizzes")}   // ← ADDED THIS LINE ONLY
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          marginTop: "40px",
          padding: "15px 30px",
          borderRadius: "8px",
          border: "none",
          background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
          boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
        }}
      >
        Go Back Home
      </motion.button>
    </div>
  );
}
