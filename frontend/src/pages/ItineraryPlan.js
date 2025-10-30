import axios from "axios";
import React, { useEffect, useState } from "react";
import InitMaps from "../helper/InitMaps";
import ActivityInput from "../helper/ActivityInput";
import '../styles/Itinerary.css'

function ItineraryPlan() {
  const [mapData, setMapData] = useState(null);
  const [activities, setActivities] = useState([""]);

  // Fetch backend map data
  useEffect(() => {
    const fetchMapData = async () => {
      const res = await axios.get("http://localhost:8080/Itinerary/maps");
      setMapData(res.data);
    };
    fetchMapData();
  }, []);

  // Loading states
  if (!mapData) return <div>Loading map data...</div>;
  //if (mapData) return console.log(mapData)

  // --- Activity handlers ---
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

  return (
    <div>
      <h1>Map Page</h1>
      <div className="container">
        <div className="add-itinerary-section">
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
        </div>

        <div className="maps-section">
            <InitMaps mapData={mapData} />
        </div>
      </div>
    </div>
  );
}

export default ItineraryPlan;
