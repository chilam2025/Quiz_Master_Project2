const API_URL = "http://127.0.0.1:5000";

export async function getAllQuizzes() {
  const response = await fetch(`${API_URL}/quizzes`);
  return response.json();
}

export async function getQuiz(id) {
  const response = await fetch(`${API_URL}/quizzes/${id}`); // FIXED
  return response.json();
}
