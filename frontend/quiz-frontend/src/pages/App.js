import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";
import QuizList from "./QuizList";
import QuizPage from "./QuizPage";
import ResultsPage from "./ResultsPage";
import HistoryPage from "./HistoryPage";


// ProtectedRoute ensures only logged-in users can access certain pages
function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Page */}
        <Route path="/" element={<AuthPage />} />

        {/* Quizzes List (Protected) */}
        <Route
          path="/quizzes"
          element={
            <ProtectedRoute>
              <QuizList />
            </ProtectedRoute>
          }
        />

        {/* Single Quiz Page (Protected) */}
        <Route
          path="/quiz/:id"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />

        {/* Results Page (Protected) */}
        <Route
          path="/results/:user_id/:quiz_id"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
           path="/history"
           element={
             <ProtectedRoute>
               <HistoryPage />
             </ProtectedRoute>
           }
        />


        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
