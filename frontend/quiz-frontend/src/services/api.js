const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  console.error("❌ REACT_APP_API_URL is not defined");
}

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
