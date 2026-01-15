import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import axios from "axios";
import {socket} from "../hooks/Socket";


function ItineraryChat({ onClose, i_id }) {
    const navigate = useNavigate();
    const chatEndRef = useRef(null);
    const [chatID, setChatID] = useState(null);
    const [title, setTitle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const[chatInput, setChatInput] = useState("");

    // Default load msg for that room on render
    useEffect(() => {
      const getChatMsg = async() => {
        try{
          const res = await axios.get("http://localhost:8080/GroupTrips/GetChatMsg", {params:{i_id: i_id}, withCredentials:true});
          console.log(res.data)
          if(res.data[0].text !== null){
            setMessages(res.data.map(item => ({
              id: item.id,
              sender: item.sender,
              type: item.type,
              text: item.text
            })));
          }
          setChatID(res.data[0].chat_id);
          setTitle(res.data[0].itinerary_name);
        }
        catch(err){
          if(err.response){
            if(err.response.status === 401 || err.response.status === 403)
            {
              const errData = err.response;
              const errorMsg = errData.status + ": " + errData.data.message;
              navigate(`/login/${errorMsg}`);
            }
            else if(err.response.status === 500)
            {
              console.log(err.response.data.message);
            }
          }
          else{
            console.log(err);
          }
        }
        finally { setLoading(false); }
      }
      getChatMsg();
    },[])

    // Scroll all the way to bottom when new message is received
    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages])

    // socket.io for real time update
    useEffect(() => {
        if (!socket) return;
        socket.connect();
    
        if(chatID){
          socket.emit("joinChat", `chat_${chatID}`);
    
          socket.on("notification", (data) => {
            if (data.message) {
              console.log(data.message);
              console.log("payload", data.payload);
              setMessages(prev => {
                if (prev.some(m => m.id === data.payload.id)) return prev;
                return [...prev, {
                id: data.payload.id,
                sender: data.payload.sender,
                type: data.payload.type,
                text: data.payload.text
                  }]
              });
            }
          });
        }
    
        return () => {
          socket.off("notification");
          socket.emit("leaveChat", `chat_${chatID}`);
        };
      }, [chatID]);

    //Chat send message function
    const sendMessage = async() => {
      if (!chatInput.trim()) return;
      try{
        const res = await axios.post("http://localhost:8080/GroupTrips/SendMessage", {content: chatInput, chatID:chatID}, {withCredentials:true});
        console.log("res!", res)
        setMessages(prev => {
          const exist = prev.some(m => m.id === res.data.id);

          if(exist){
            return prev.map(m => m.id === res.data.id ? {...m, 
              sender: res.data.sender,
              type: res.data.type
            } : m)
          }
          else{
            return [...prev, {
              id: res.data.id,
              sender: res.data.sender,
              type: res.data.type,
              text: res.data.text
            }]
          }
        });
      }
      catch(err){
        if(err.response){
            if(err.response.status === 401 || err.response.status === 403)
            {
              const errData = err.response;
              const errorMsg = errData.status + ": " + errData.data.message;
              navigate(`/login/${errorMsg}`);
            }
            else if(err.response.status === 500)
            {
              console.log(err.response.data.message);
            }
          }
          else{
            console.log(err);
          }
      }
      setChatInput("");
    }


    return(
        <div className="chat-modal">
          <div className="chat-top-bar">
            <h2 className="chat-close" onClick={onClose}>x</h2>
            <h3 className="chat-title">{title}</h3>
          </div>
            
          <div className="chat-body">
            {!loading && messages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.type}`}>
                <div className="sender-name">{msg.sender}</div>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}
            {loading && <p>Loading chat..</p>}
            <div ref={chatEndRef}/>
          </div>

          <div className="chat-input-bar">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Write a message..."/>
            <button onClick={sendMessage} disabled={!chatInput}>Send</button>
          </div>
        </div>
    )
    
}

export default ItineraryChat;