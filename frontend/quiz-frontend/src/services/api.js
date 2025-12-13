const API_URL = "http://127.0.0.1:5000";

export async function getAllQuizzes() {
  try {
    const response = await fetch(`${API_URL}/quizzes`);
    if (!response.ok) throw new Error("Failed to fetch quizzes");
    return await response.json();
  } catch (err) {
    console.error("Error fetching quizzes:", err);
    return []; // return empty array to avoid blank page
  }
}

export async function getQuiz(id) {
  try {
    const response = await fetch(`${API_URL}/quizzes/${id}`);
    if (!response.ok) throw new Error("Failed to fetch quiz");
    return await response.json();
  } catch (err) {
    console.error(`Error fetching quiz ${id}:`, err);
    return null; // return null if quiz not found
  }
}
