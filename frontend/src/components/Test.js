import React, { useState } from "react";
import axios from 'axios';

function Test(){
    //const [activities, setActivities] = useState([""]);
    const activities = ["Place a, Place b, Place c"];
    const [curActivity, setcurActivities] = useState("");
    
    const addActivity = (input) => setcurActivities(input.target.value);

    const submitActivity = (event) => {
        event.preventDefault(); //stop form refresh
        axios.post("http://localhost:8080/Itinerary/Test", {activity: curActivity})
        .then(res => alert(res.data)).catch(error => alert(error));
        setcurActivities("");
    }

    return(
    <div>
        {activities.map((activity) => <p>{activity}</p>)}
        <form onSubmit={submitActivity}>
            <input type="text" value={curActivity} onChange={addActivity}/>
            <input type="submit" />
        </form>
    </div>
    );
}

export default Test;