import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chatbot.css";

export default function ChatbotPage() {
  const navigate = useNavigate();

  // In-memory chat sessions only
  const [chats, setChats] = useState([]);
  const [activeChatIndex, setActiveChatIndex] = useState(null);
  const [inputValue, setInputValue] = useState("");

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
  const handleSend = () => {
    if (!inputValue.trim()) return;

    setChats((prevChats) => {
      let updatedChats = [...prevChats];
      let chatIndex = activeChatIndex;

      // Auto-create & activate chat on first message
      if (chatIndex === null) {
        updatedChats.push({
          title: inputValue.slice(0, 30),
          messages: [],
        });
        chatIndex = updatedChats.length - 1;
        setActiveChatIndex(chatIndex);
      }

      const updatedChat = { ...updatedChats[chatIndex] };

      if (!updatedChat.title) {
        updatedChat.title = inputValue.slice(0, 30);
      }

      updatedChat.messages = [
        ...updatedChat.messages,
        { sender: "user", text: inputValue },
      ];

      updatedChats[chatIndex] = updatedChat;
      return updatedChats;
    });

    setInputValue("");
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
                  className="chatbot-bubble user"
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