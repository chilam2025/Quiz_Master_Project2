import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:5000";

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  // 🔹 Fetch ALL questions once
  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`${API_URL}/quizzes/${id}`);
        const data = await res.json();

        if (res.ok) {
          setQuiz(data);
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchQuiz();
  }, [id]);

  if (!quiz)
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Loading questions...
      </p>
    );

  const question = quiz.questions[currentQuestionIndex];

  const handleAnswerSelect = (optionIndex) => {
    setAnswers({ ...answers, [question.id]: optionIndex });
    setError("");
  };

  const handleNext = () => {
    if (answers[question.id] === undefined) {
      setError("⚠️ Please choose an answer before moving on.");
      return;
    }
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0)
      setCurrentQuestionIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!token) {
      alert("You must login first.");
      return;
    }

    if (Object.keys(answers).length !== quiz.questions.length) {
      setError("⚠️ Please answer all questions before submitting.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/quizzes/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: quiz.questions.map((q) => answers[q.id]),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        navigate(`/results/${data.user_id}/${data.quiz_id}`);
      } else {
        alert(data.error || "Error submitting quiz");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "50px auto",
        fontFamily: "'Poppins', sans-serif",
        textAlign: "center",
        padding: "30px",
        background: "#f0f4f8",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ color: "#4e54c8" }}>{quiz.title}</h1>

      <p style={{ marginBottom: "20px" }}>
        Question {currentQuestionIndex + 1} of {quiz.questions.length}
      </p>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          textAlign: "left",
        }}
      >
        <p style={{ fontWeight: "bold" }}>{question.question}</p>

        {question.options.map((opt, i) => (
          <label
            key={i}
            style={{
              display: "block",
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "8px",
              background:
                answers[question.id] === i ? "#8f94fb" : "#f5f5f5",
              color: answers[question.id] === i ? "white" : "#333",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name={`q_${question.id}`}
              checked={answers[question.id] === i}
              onChange={() => handleAnswerSelect(i)}
              style={{ marginRight: "10px" }}
            />
            {opt}
          </label>
        ))}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "20px" }}>
        {currentQuestionIndex > 0 && (
          <button onClick={handlePrev}>Previous</button>
        )}

        {currentQuestionIndex < quiz.questions.length - 1 && (
          <button onClick={handleNext} style={{ marginLeft: "10px" }}>
            Next
          </button>
        )}

        {currentQuestionIndex === quiz.questions.length - 1 && (
          <button onClick={handleSubmit} style={{ marginLeft: "10px" }}>
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
