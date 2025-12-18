import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API_URL from "../services/api";

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e2f2ff 0%, #cde6ff 50%, #e8f4ff 100%)",
  padding: "24px 16px",
  fontFamily: "'Poppins', sans-serif",
  color: "#0f2b46",
};

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  borderRadius: "14px",
  padding: "20px",
  boxShadow: "0 10px 24px rgba(64,132,207,0.15)",
  border: "1px solid rgba(128,178,232,0.35)",
};

const buttonStyle = {
  padding: "14px 32px",
  fontSize: "16px",
  fontWeight: "600",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
  color: "white",
  boxShadow: "0 10px 25px rgba(64,132,207,0.25)",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const statCardStyle = {
  background: "rgba(255,255,255,0.95)",
  borderRadius: "12px",
  padding: "16px",
  boxShadow: "0 8px 20px rgba(64,132,207,0.12)",
  border: "1px solid rgba(128,178,232,0.3)",
  textAlign: "center",
  flex: 1,
  minWidth: "140px",
};

const insightCardStyle = {
  background: "linear-gradient(135deg, rgba(87,165,255,0.1) 0%, rgba(122,199,255,0.1) 100%)",
  borderRadius: "12px",
  padding: "20px",
  border: "1px solid rgba(87,165,255,0.3)",
  marginBottom: "20px",
};

export default function InsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const user_id = user?.user_id;

  useEffect(() => {
    async function fetchInsights() {
      if (!token) {
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/users/${user_id}/insights`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setInsights(data);
        } else {
          console.error("Failed to fetch insights");
        }
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [token, user_id, navigate]);

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return "N/A";
    return `${value}%`;
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", color: "#1f6fb2", marginBottom: "16px" }}>
               Analyzing Your Learning Patterns...
            </div>
            <div style={{
              width: "60px",
              height: "60px",
              border: "4px solid #e2f2ff",
              borderTop: "4px solid #1f6fb2",
              borderRadius: "50%",
              margin: "0 auto",
              animation: "spin 1s linear infinite"
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ textAlign: "center", color: "#1f6fb2", marginBottom: "20px" }}>
            AI Insights Dashboard
          </h1>
          <div style={{ ...cardStyle, textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "18px", color: "#2f557a", marginBottom: "20px" }}>
              Unable to load insights. Please complete some quizzes first!
            </p>
            <button
              onClick={() => navigate("/quizzes")}
              style={buttonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 14px 28px rgba(64,132,207,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(64,132,207,0.25)";
              }}
            >
              Take a Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#1f6fb2", marginBottom: "8px" }}>
             AI Learning Insights Dashboard
          </h1>
          <p style={{ color: "#2f557a", fontSize: "16px" }}>
            Personalized analytics and recommendations powered by AI
          </p>
        </div>

        {/* AI Insights Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={insightCardStyle}
        >
          <h3 style={{
            color: "#1f6fb2",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span style={{ fontSize: "20px" }}></span> AI-Powered Insights
          </h3>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "center",
            marginBottom: "20px"
          }}>
            {/* Weighted Average Prediction */}
            {insights.weighted_average_prediction && (
              <div style={statCardStyle}>
                <div style={{ fontSize: "12px", color: "#2f557a", marginBottom: "8px" }}>
                   Predicted Next Score
                </div>
                <div style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#1f6fb2"
                }}>
                  {formatPercentage(insights.weighted_average_prediction)}
                </div>
                <div style={{ fontSize: "11px", color: "#2f557a", marginTop: "4px" }}>
                  Based on recent performance
                </div>
              </div>
            )}

            {/* Streak Counter */}
            {insights.streak && (
              <div style={statCardStyle}>
                <div style={{ fontSize: "12px", color: "#2f557a", marginBottom: "8px" }}>
                   Current Streak
                </div>
                <div style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#1f6fb2"
                }}>
                  {insights.streak || 0} days
                </div>
                <div style={{ fontSize: "11px", color: "#2f557a", marginTop: "4px" }}>
                  {insights.streak > 1 ? "days in a row!" : "Start a streak!"}
                </div>
              </div>
            )}

            {/* Recommended Difficulty */}
            {insights.recommended_difficulty && (
              <div style={statCardStyle}>
                <div style={{ fontSize: "12px", color: "#2f557a", marginBottom: "8px" }}>
                   Recommended Difficulty
                </div>
                <div style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1f6fb2",
                  lineHeight: "1.2"
                }}>
                  {insights.recommended_difficulty}
                </div>
                <div style={{ fontSize: "11px", color: "#2f557a", marginTop: "4px" }}>
                  Optimal challenge level
                </div>
              </div>
            )}

            {/* Learning Style */}
            {insights.learning_style && (
              <div style={statCardStyle}>
                <div style={{ fontSize: "12px", color: "#2f557a", marginBottom: "8px" }}>
                   Learning Style
                </div>
                <div style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f6fb2",
                  lineHeight: "1.2"
                }}>
                  {insights.learning_style}
                </div>
                <div style={{ fontSize: "11px", color: "#2f557a", marginTop: "4px" }}>
                  Your learning pattern
                </div>
              </div>
            )}
          </div>

          {/* Study Tips */}
          {insights.study_tips && insights.study_tips.length > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.9)",
              padding: "16px",
              borderRadius: "10px",
              marginTop: "12px"
            }}>
              <div style={{
                fontSize: "14px",
                color: "#2f557a",
                fontWeight: "600",
                marginBottom: "10px"
              }}>
                 Personalized Study Tips:
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: "20px",
                fontSize: "13px",
                color: "#365d83"
              }}>
                {insights.study_tips.map((tip, index) => (
                  <li key={index} style={{ marginBottom: "6px" }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Anomaly Detection */}
          {insights.anomaly && (
            <div style={{
              background: "rgba(255, 152, 0, 0.1)",
              padding: "12px",
              borderRadius: "10px",
              marginTop: "12px",
              border: "1px solid rgba(255, 152, 0, 0.3)"
            }}>
              <div style={{
                fontSize: "14px",
                color: "#2f557a",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                 {insights.anomaly}
              </div>
            </div>
          )}
        </motion.div>

        {/* Main Content Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          marginBottom: "30px"
        }}>
          {/* Recommended Quiz Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              ...cardStyle,
              gridColumn: "span 2",
              background: "linear-gradient(135deg, rgba(87,165,255,0.1) 0%, rgba(122,199,255,0.1) 100%)",
              border: "1px solid rgba(87,165,255,0.3)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <div style={{
                background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
                color: "white",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                marginRight: "12px"
              }}>

              </div>
              <div>
                <h3 style={{ color: "#1f6fb2", margin: 0 }}>Recommended Quiz</h3>
                <p style={{ color: "#2f557a", fontSize: "13px", margin: 0 }}>
                  AI-suggested based on your performance
                </p>
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.9)",
              padding: "20px",
              borderRadius: "10px",
              marginBottom: "20px"
            }}>
              <h4 style={{ color: "#1f6fb2", marginBottom: "8px" }}>
                {insights.recommended_quiz?.title || "Beginner Starter Quiz"}
              </h4>
              <p style={{ color: "#2f557a", fontSize: "14px", marginBottom: "16px" }}>
                {insights.recommended_quiz?.reason || "Perfect for getting started!"}
              </p>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  onClick={() => {
                    const difficulty = insights.recommended_difficulty || "Easy";
                    navigate(`/quiz/${insights.recommended_quiz?.id || '1'}?difficulty=${difficulty}`);
                  }}
                  style={buttonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 14px 28px rgba(64,132,207,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 10px 25px rgba(64,132,207,0.25)";
                  }}
                >
                  Start Recommended Quiz
                </button>

                <div style={{
                  padding: "10px 16px",
                  background: "rgba(87, 165, 255, 0.1)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#1f6fb2"
                }}>
                  <div style={{ fontWeight: "600" }}>Difficulty:</div>
                  <div>{insights.recommended_difficulty || "Easy"}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Weak Topics Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={cardStyle}
          >
            <h3 style={{
              color: "#1f6fb2",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span style={{ fontSize: "20px" }}></span> Areas to Improve
            </h3>

            {insights.weak_topics && insights.weak_topics.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {insights.weak_topics.slice(0, 4).map((topic, index) => (
                  <div key={index} style={{
                    background: "rgba(245, 250, 255, 0.7)",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(128,178,232,0.2)"
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px"
                    }}>
                      <div style={{ fontWeight: "600", color: "#1f6fb2" }}>
                        {topic.topic}
                      </div>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#1f6fb2"
                      }}>
                        {topic.avg_score}%
                      </div>
                    </div>
                    <div style={{
                      height: "6px",
                      background: "#e5edf7",
                      borderRadius: "3px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${topic.avg_score}%`,
                        background: "linear-gradient(180deg, #57a5ff, #3d8fdc)"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "20px",
                color: "#2f557a",
                fontSize: "14px"
              }}>
                No weak topics identified yet. Keep practicing!
              </div>
            )}
          </motion.div>

          {/* Category Performance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={cardStyle}
          >
            <h3 style={{
              color: "#1f6fb2",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span style={{ fontSize: "20px" }}></span> Category Performance
            </h3>

            {insights.category_performance && Object.keys(insights.category_performance).length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(insights.category_performance).slice(0, 5).map(([category, score], index) => (
                  <div key={index} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    background: "rgba(245, 250, 255, 0.7)",
                    borderRadius: "8px",
                    border: "1px solid rgba(128,178,232,0.2)"
                  }}>
                    <div style={{ fontSize: "14px", color: "#2f557a" }}>
                      {category}
                    </div>
                    <div style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1f6fb2"
                    }}>
                      {score}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "20px",
                color: "#2f557a",
                fontSize: "14px"
              }}>
                Category data will appear after more quizzes
              </div>
            )}
          </motion.div>

          {/* Study Tips Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={cardStyle}
          >
            <h3 style={{
              color: "#1f6fb2",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span style={{ fontSize: "20px" }}></span> Personalized Study Tips
            </h3>

            {insights.study_tips && insights.study_tips.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {insights.study_tips.map((tip, index) => (
                  <div key={index} style={{
                    display: "flex",
                    gap: "12px",
                    padding: "12px",
                    background: "rgba(245, 250, 255, 0.7)",
                    borderRadius: "8px",
                    border: "1px solid rgba(128,178,232,0.2)"
                  }}>
                    <div style={{
                      background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
                      color: "white",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: "#2f557a",
                      lineHeight: "1.4"
                    }}>
                      {tip}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "20px",
                color: "#2f557a",
                fontSize: "14px"
              }}>
                Complete more quizzes for personalized tips
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Navigation */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginTop: "40px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => navigate("/quizzes")}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 14px 28px rgba(64,132,207,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(64,132,207,0.25)";
            }}
          >
             Back to Quizzes
          </button>

          <button
            onClick={() => navigate("/history")}
            style={{
              ...buttonStyle,
              background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 14px 28px rgba(64,132,207,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(64,132,207,0.25)";
            }}
          >
             View Detailed History
          </button>

          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              ...buttonStyle,
              background: "linear-gradient(120deg, #57a5ff, #7ac7ff)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 14px 28px rgba(64,132,207,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(64,132,207,0.25)";
            }}
          >
             Refresh Insights
          </button>
        </div>
      </div>
    </div>
  );
}