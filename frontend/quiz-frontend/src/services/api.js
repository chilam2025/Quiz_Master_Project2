const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000"; // sensible default for local/dev

export async function getAllQuizzes() {
  const response = await fetch(`${API_URL}/quizzes`);
  return response.json();
}

export async function getQuiz(id) {
  const response = await fetch(`${API_URL}/quizzes/${id}`);
  return response.json();
}

// Generic helper (optional but very useful)
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  return response.json();
}

export default API_URL;
