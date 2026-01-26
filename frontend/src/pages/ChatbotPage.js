import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chatbot.css";

export default function ChatbotPage() {
  const navigate = useNavigate();

  // In-memory chat sessions only
  const [chats, setChats] = useState([]);
  const [activeChatIndex, setActiveChatIndex] = useState(null);
  const [inputValue, setInputValue] = useState("");

  // Fetch Neccesary Data/Communicate with Backend
  const sendToBackend = async (text) => {
    const res = await fetch("http://localhost:8080/Chatbot/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ message: text })
    });

    return res.json();
  };

  // Create new chat (DO NOT activate yet)
  const createNewChat = () => {
    const newChat = {
      title: "",
      messages: [],
    };

    setChats((prev) => [...prev, newChat]);
    setActiveChatIndex(null);
  };

  // Delete chat
  const deleteChat = (index) => {
    setChats((prev) => prev.filter((_, i) => i !== index));
    setActiveChatIndex(null);
  };

  // Send message
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");

    let currentIndex = activeChatIndex;

    // Create chat if none
    if (currentIndex === null) {
      setChats(prev => [
        ...prev,
        {
          title: userMessage.slice(0, 30),
          messages: [{ sender: "user", text: userMessage }]
        }
      ]);

      currentIndex = chats.length;
      setActiveChatIndex(currentIndex);
    } else {
      setChats(prev => {
        const updated = [...prev];
        updated[currentIndex] = {
          ...updated[currentIndex],
          messages: [
            ...updated[currentIndex].messages,
            { sender: "user", text: userMessage }
          ]
        };
        return updated;
      });
    }

    try {
      const data = await sendToBackend(userMessage);

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
                  text: data.reply,
                  type: "text"
                }
          ]
        };

        return updated;
      });

    } catch (err) {
      setChats(prev => {
        const updated = [...prev];
        updated[currentIndex] = {
          ...updated[currentIndex],
          messages: [
            ...updated[currentIndex].messages,
            {
              sender: "bot",
              text: "Server error. Try again."
            }
          ]
        };
        return updated;
      });
    }
  };

  // Enter key support (no double send)
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const activeChat =
    activeChatIndex !== null ? chats[activeChatIndex] : null;

  return (
    <div className="chatbot-container">

      {/* Top bar */}
      <div className="chatbot-topbar">
        <button
          className="chatbot-back-btn"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h2 className="chatbot-title">Chatbot</h2>
      </div>

      <div className="chatbot-layout">

        {/* Sidebar */}
        <div className="chatbot-sidebar">
          <button
            className="chatbot-new-chat"
            onClick={createNewChat}
          >
            ✏️ New Chat
          </button>

          <div className="chatbot-history-list">
            {chats.map((chat, index) => (
              <div
                key={index}
                className={`chatbot-history-item ${
                  index === activeChatIndex ? "active" : ""
                }`}
              >
                <span onClick={() => setActiveChatIndex(index)}>
                  {chat.title || "New Chat"}
                </span>

                <button
                  className="chatbot-delete-btn"
                  onClick={() => deleteChat(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat */}
        <div className="chatbot-main">

          {/* Messages area */}
          <div className="chatbot-messages">

            {!activeChat && (
              <div className="chatbot-welcome">
                <h1 className="chatbot-heading">
                  How May I Assist You?
                </h1>
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

          {/* Input */}
          <div className="chatbot-input-wrapper">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask Anything"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="chatbot-send-btn"
              onClick={handleSend}
            >
              ➤
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}