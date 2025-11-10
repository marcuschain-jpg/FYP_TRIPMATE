import React, { useState } from "react";
import ActivityInput from "./ActivityInput";

function AddNewActivity(){
        // --- Activity handlers ---
    const [activities, setActivities] = useState([""]);
     
    const addActivity = () => setActivities([...activities, ""]);
    const deleteActivity = (i) => setActivities(activities.filter((_, idx) => idx !== i));
    const handleActivityChange = (i, value) => {
    const updated = [...activities];
    updated[i] = value;
        setActivities(updated);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Activities: " + activities.join(", "));
    };

    return(
        <form onSubmit={handleSubmit}>
            {activities.map((activity, index) => (
                <div key={index}>
                    <ActivityInput
                    index={index}
                    value={activity}
                    onChange={handleActivityChange}
                    />
                    <input
                    type="button"
                    value="Delete Activity"
                    onClick={() => deleteActivity(index)}
                    style={{ marginTop: "8px" }}
                    />
                </div>
                ))}
            <input
              type="button"
              value="Add Activity"
              onClick={addActivity}
              style={{ marginTop: "8px" }}
            />
            <br />
            <button type="submit" style={{ marginTop: "8px" }}>
              Submit
            </button>
          </form>
    );
}

export default AddNewActivity;