import React, { useState } from "react";
import "../styles/Itinerary.css";



function ItineraryChat({ onClose }) {
    const [messages, setMessages] = useState([
    {
        id: 1,
        sender: 'Chris',
        type: 'received',
        text: "Where should we go on our 1st day?"
    },
    {
        id: 2,
        sender: 'Marcus',
        type: 'received',
        text: "Hmm, i don't know.. Maybe just snack around.."
    },
    {
        id: 3,
        sender: 'Shih Hui',
        type: 'received',
        text: "I recommend Tippy Cafe! I heard its good!"
    },
    {
        id: 4,
        sender: 'You',
        type: 'sent',
        text: "Yes sure! We can have a full meal there too!"
    }
    ]);
    const[chatInput, setChatInput] = useState("");

    //Chat send message function
    const sendMessage = () => {
        if (!chatInput.trim()) return;

        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: "You",
            type: "sent",
            text: chatInput
        }
    ]);

    setChatInput("");
    }

    return(
        <div className="chat-modal">
          <div className="chat-top-bar">
            <h2 className="chat-close" onClick={onClose}>x</h2>
            <h3 className="chat-title">To Singapore!</h3>
          </div>
            
          <div className="chat-body">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.type}`}>
                <div className="sender-name">{msg.sender}</div>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}
          </div>

          <div className="chat-input-bar">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Write a message..."/>
            <button onClick={sendMessage} disabled={!chatInput}>Send</button>
          </div>
        </div>
    )
    
}

export default ItineraryChat;