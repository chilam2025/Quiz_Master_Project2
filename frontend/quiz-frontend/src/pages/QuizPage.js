import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "https://quiz-master-project2-backend.onrender.com";

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const res = await fetch(`${API_URL}/quizzes/${id}/question/${currentQuestionIndex}`);
        const data = await res.json();
        if (res.ok) {
          setQuestion(data);
          setTotalQuestions(data.total_questions);
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchQuestion();
  }, [id, currentQuestionIndex]);

  if (!question)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading question...</p>;

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
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!token) {
      alert("You must login first.");
      return;
    }
    if (answers[question.id] === undefined) {
      setError("⚠️ Please choose an answer before submitting.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/quizzes/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: Object.values(answers),
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
      {user && (
        <h2
          style={{
            marginBottom: "30px",
            fontSize: "22px",
            background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
            color: "white",
            padding: "15px",
            borderRadius: "10px",
            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          Hello {user.email}, are you ready to take a fun quiz?
        </h2>
      )}

      <h1 style={{ marginBottom: "15px", color: "#4e54c8" }}>Quiz</h1>
      <p style={{ marginBottom: "30px", color: "#555", fontSize: "16px" }}>
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </p>

      <div
        style={{
          marginBottom: "20px",
          textAlign: "left",
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: "12px" }}>{question.question}</p>
        {question.options.map((opt, i) => (
          <label
            key={i}
            style={{
              display: "block",
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "8px",
              cursor: "pointer",
              background: answers[question.id] === i ? "#8f94fb" : "#f5f5f5",
              color: answers[question.id] === i ? "white" : "#333",
            }}
          >
            <input
              type="radio"
              name={`question_${question.id}`}
              value={i}
              checked={answers[question.id] === i}
              onChange={() => handleAnswerSelect(i)}
              style={{ marginRight: "10px" }}
            />
            {opt}
          </label>
        ))}
      </div>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <div style={{ marginTop: "20px" }}>
        {currentQuestionIndex > 0 && (
          <button
            onClick={handlePrev}
            style={{
              marginRight: "10px",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: "#ccc",
            }}
          >
            Previous
          </button>
        )}
        {currentQuestionIndex < totalQuestions - 1 && (
          <button
            onClick={handleNext}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
              color: "white",
            }}
          >
            Next
          </button>
        )}
        {currentQuestionIndex === totalQuestions - 1 && (
          <button
            onClick={handleSubmit}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
              color: "white",
            }}
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
