import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API_URL from "../services/api";

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const difficulty =
    new URLSearchParams(window.location.search).get("difficulty") || "Medium";

  // ✅ STEP 1: start quiz (create attempt)
  const startQuiz = async () => {
    const res = await fetch(`${API_URL}/quizzes/${id}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ difficulty }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to start quiz");
  };

  // ✅ STEP 2: fetch questions
  const fetchQuestions = async () => {
    const res = await fetch(
      `${API_URL}/quizzes/${id}/questions/random/${difficulty}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch questions");

    return data.questions || [];
  };

  useEffect(() => {
    async function loadQuiz() {
      if (!token) return;

      try {
        setLoading(true);
        setError("");

        await startQuiz();                 // 🔑 CRITICAL
        const qs = await fetchQuestions();

        if (qs.length === 0) {
          setError("No questions available. Try again.");
        }

        setQuestions(qs);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [id, difficulty, token]);

  // ---------------- UI STATES ----------------

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Loading questions...
      </p>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <p style={{ color: "red" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#4e54c8",
            color: "white",
            cursor: "pointer",
          }}
        >
          Retry Quiz
        </button>
      </div>
    );
  }

  const question = questions[currentQuestionIndex];

  // ---------------- HANDLERS ----------------

  const handleAnswerSelect = (optionIndex) => {
    setAnswers({ ...answers, [question.id]: optionIndex });
    setError("");
  };

  const handleNext = () => {
    if (answers[question.id] === undefined) {
      setError("⚠️ Please choose an answer.");
      return;
    }
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentQuestionIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (questions.some((q) => answers[q.id] === undefined)) {
      setError("⚠️ Answer all questions.");
      return;
    }

    const answersList = questions.map((q) => answers[q.id]);

    try {
      const res = await fetch(`${API_URL}/quizzes/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: answersList }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      navigate(`/results/${data.user_id}/${data.quiz_id}`);
    } catch (err) {
      alert(err.message || "Submission failed");
    }
  };

  // ---------------- UI ----------------

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "40px auto",
        textAlign: "center",
        background: "linear-gradient(135deg, #e2f2ff 0%, #cde6ff 50%, #e8f4ff 100%)",
        padding: "30px",
        borderRadius: "16px",
        boxShadow: "0 16px 40px rgba(64,132,207,0.18)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <h2 style={{ color: "#1f6fb2" }}>Hello {user.email}</h2>

      <p>
        Question {currentQuestionIndex + 1} of {questions.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          style={{
            background: "rgba(255,255,255,0.95)",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid rgba(128,178,232,0.35)",
            boxShadow: "0 10px 24px rgba(64,132,207,0.15)",
          }}
        >
          <p><b>{question.question}</b></p>

          {question.options.map((opt, i) => (
            <label
              key={i}
              style={{
                display: "block",
                margin: "10px 0",
                padding: "10px 12px",
                borderRadius: "10px",
                background:
                  answers[question.id] === i ? "linear-gradient(120deg, #57a5ff, #7ac7ff)" : "#f5f8fc",
                color: answers[question.id] === i ? "white" : "#0f2b46",
                cursor: "pointer",
                border: answers[question.id] === i ? "none" : "1px solid #c7d9ef",
              }}
            >
              <input
                type="radio"
                checked={answers[question.id] === i}
                onChange={() => handleAnswerSelect(i)}
                style={{ marginRight: "10px" }}
              />{" "}
              {opt}
            </label>
          ))}
        </motion.div>
      </AnimatePresence>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "20px" }}>
        {currentQuestionIndex > 0 && (
          <button
            onClick={handlePrev}
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
              marginRight: "8px",
            }}
          >
            Previous
          </button>
        )}
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
            }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
            }}
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
