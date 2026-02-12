import React, { useState } from "react";
import "../styles/Chatbot.css";
import Axios from '../hooks/Axios';

export default function ChatbotModal({ isOpen, onClose }) {
  // Single conversation only
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Send message to backend
  const sendToBackend = async (text) => {
    try {
      const res = await Axios.post(
        "/Chatbot/message",
        { message: text },
        { withCredentials: true }
      );
      return res.data;
    } catch {
      return null;
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue("");
    setIsLoading(true);

    // Add user message
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMessage }
    ]);

    try {
      const data = await sendToBackend(userMessage);

      if (!data) throw new Error("No response");

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply || "No response.",
          isItinerary: data.isItinerary || false
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Server error. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  // Suggestion click
  const handleSuggestion = (suggestion) => {
    setInputValue(suggestion);
  };

  const suggestions = [
    "Plan a trip to Singapore",
    "I'm looking for food experiences",
    "Weekend getaway ideas",
    "Budget-friendly itinerary",
    "Adventure activities",
  ];

  if (!isOpen) return null;

  return (
    <div className="chatbot-modal-overlay" onClick={onClose}>
      <div
        className="chatbot-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="chatbot-modal-header">
          <h2 className="chatbot-modal-title">TripMate Chatbot</h2>
          <button
            className="chatbot-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-modal-messages">
          {messages.length === 0 && (
            <div className="chatbot-modal-welcome">
              <h3 className="chatbot-modal-heading">
                How May I Assist You?
              </h3>
              <div className="chatbot-modal-suggestions">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="chatbot-modal-suggestion-btn"
                    onClick={() => handleSuggestion(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chatbot-modal-bubble ${msg.sender}`}
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: msg.isItinerary ? "monospace" : "inherit"
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="chatbot-modal-input-wrapper">
          <input
            type="text"
            className="chatbot-modal-input"
            placeholder="Ask anything about travel..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            type="button"
            className="chatbot-modal-send-btn"
            onClick={handleSend}
            disabled={isLoading}
            aria-label="Send"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}