import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    <div style={{ maxWidth: "700px", margin: "40px auto", textAlign: "center" }}>
      <h2>Hello {user.email}</h2>

      <p>
        Question {currentQuestionIndex + 1} of {questions.length}
      </p>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px" }}>
        <p><b>{question.question}</b></p>

        {question.options.map((opt, i) => (
          <label key={i} style={{ display: "block", margin: "10px 0" }}>
            <input
              type="radio"
              checked={answers[question.id] === i}
              onChange={() => handleAnswerSelect(i)}
            />{" "}
            {opt}
          </label>
        ))}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "20px" }}>
        {currentQuestionIndex > 0 && (
          <button onClick={handlePrev}>Previous</button>
        )}
        {currentQuestionIndex < questions.length - 1 ? (
          <button onClick={handleNext}>Next</button>
        ) : (
          <button onClick={handleSubmit}>Submit Quiz</button>
        )}
      </div>
    </div>
  );
}
