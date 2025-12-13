import React, { useEffect, useState } from "react";
import axios from 'axios';
import { io } from "socket.io-client";

// Connect to backend
const socket = io("http://localhost:8080");

function Test(){
    const [activities, setActivities] = useState([]);
    const [curActivity, setcurActivities] = useState("");
    //const activities1 = ["Place a, Place b, Place c"];

    useEffect(()=>{
        axios.get("http://localhost:8080/Itinerary/testLoad")
        .then(res => {setActivities(res.data);})
        .catch(err => console.err(err));

        socket.on("newMessage", (data) => {
            console.log("Received realtime updates:", data);
            setActivities((prev)=>[...prev, { id: data.id, content: data.content }]);
        });

        return () => {
            socket.off("newMessage");
        };
    }, []);
    
    const addActivity = (input) => setcurActivities(input.target.value);

    const submitActivity = (event) => {
        event.preventDefault(); //stop form refresh
        axios.post("http://localhost:8080/Itinerary/test", {activity: curActivity})
        .then(res => alert(res.data)).catch(error => alert(error));
        setcurActivities("");
    }

    return(
    <div>
        {activities.map((activity) => <p key={activity.id}>{activity.content}</p>)}
        <form onSubmit={submitActivity}>
            <input type="text" value={curActivity} onChange={addActivity}/>
            <input type="submit" />
        </form>
    </div>
    );
}

export default Test;