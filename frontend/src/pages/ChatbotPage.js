import React, { useState } from "react";
import "../styles/Chatbot.css";
import axios from "axios";

export default function ChatbotModal({ isOpen, onClose }) {
  //In-memory chat sessions only
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  //Fetch Neccesary Data/Communicate with Backend
  const sendToBackend = async (text) => {
    try {
      const res = await axios.post(
        "http://localhost:8080/Chatbot/message",
        { 
          message: text,
          history 
        },
        { withCredentials: true }
      );
      return res.data;
    } catch {
      return null;
    }
  };

  //Create new chat 
  const createNewChat = () => {
    const newChat = {
      title: "",
      messages: [],
    };

    setChats((prev) => [...prev, newChat]);
    setActiveChatIndex(null);
  };

  //Delete chat
  const deleteChat = (index) => {
    setChats((prev) => prev.filter((_, i) => i !== index));
    setActiveChatIndex(null);
  };

  //Send message
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    setIsLoading(true);

    //Add user message to chat
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);

    try {
      const data = await sendToBackend(userMessage);

      if (!data) {
        throw new Error("No response from server");
      }

      setChats(prev => {
        const updated = [...prev];

        updated[currentIndex] = {
          ...updated[currentIndex],
          messages: [
            ...updated[currentIndex].messages,
            data.isItinerary
              ? {
                  sender: "bot",
                  text: "Itinerary generated. Click to view.",
                  tripId: data.tripId,
                  type: "itinerary"
                }
              : {
                  sender: "bot",
                  text: data.reply || "No response.",
                  type: "text"
                }
          ]
        };

        return updated;
      });

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Server error. Try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  //Handle suggestion click
  const handleSuggestion = (suggestion) => {
    setInputValue(suggestion);
  };

  //Suggestion prompts
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
        {/*Header*/}
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

        {/*Messages area*/}
        <div className="chatbot-modal-messages">
          {messages.length === 0 && (
            <div className="chatbot-modal-welcome">
              <h3 className="chatbot-modal-heading">How May I Assist You?</h3>
              <div className="chatbot-modal-suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="chatbot-modal-suggestion-btn"
                    onClick={() => handleSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

            {activeChat &&
              activeChat.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chatbot-bubble ${msg.sender}`}
                  style={{
                    cursor: msg.type === "itinerary" ? "pointer" : "default",
                    textDecoration: msg.type === "itinerary" ? "underline" : "none"
                  }}
                  onClick={() => {
                    if (msg.type === "itinerary") {
                      navigate(`/Itinerary/${msg.tripId}/default`);
                    }
                  }}
                >
                  {msg.text}
                </div>
            ))}
          </div>

        {/*Input area*/}
        <div className="chatbot-modal-input-wrapper">
          <input
            type="text"
            className="chatbot-modal-input"
            placeholder="Ask Anything"
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