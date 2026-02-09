import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chatbot.css";
import axios from "axios";

export default function ChatbotPage() {
  const navigate = useNavigate();

  //In-memory chat sessions only
  const [chats, setChats] = useState([]);
  const [activeChatIndex, setActiveChatIndex] = useState(null);
  const [inputValue, setInputValue] = useState("");

  // Fetch Neccesary Data/Communicate with Backend
  const sendToBackend = async (text, history) => {
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
  
  // Create new chat (DO NOT activate yet)
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

    let currentIndex = activeChatIndex;

    //Create chat if none
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  //Handle suggestion click
  const handleSuggestion = (suggestion) => {
    setInputValue(suggestion);
  };

  const activeChat =
    activeChatIndex !== null ? chats[activeChatIndex] : null;

  //Suggestion prompts
  const suggestions = [
    "Plan a trip to Singapore",
    "I'm looking for food experiences",
    "Weekend getaway ideas",
    "Budget-friendly itinerary",
    "Adventure activities",
  ];

  return (
    <div className="chatbot-container">

      {/*Topbar */}
      <div className="chatbot-topbar">
        <button
          className="chatbot-back-btn"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h2 className="chatbot-title">TripMate Chatbot</h2>
      </div>

      <div className="chatbot-layout">

        {/*Sidebar*/}
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

        {/*Main chat*/}
        <div className="chatbot-main">

          {/*Messages area*/}
          <div className="chatbot-messages">

            {!activeChat && (
              <div className="chatbot-welcome">
                <h1 className="chatbot-heading">
                  How May I Assist You?
                </h1>
                <div className="chatbot-suggestions">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="chatbot-suggestion-btn"
                      onClick={() => handleSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeChat &&
              activeChat.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chatbot-bubble ${msg.sender}`}
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: msg.isItinerary ? "monospace" : "inherit",
                    textDecoration: msg.isItinerary ? "underline" : "none"
                  }}
                >
                  {msg.text}
                </div>
            ))}
          </div>

          {/*Input*/}
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
            <button
              type="button"
              className="chatbot-edit-btn"
              title="Edit"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}