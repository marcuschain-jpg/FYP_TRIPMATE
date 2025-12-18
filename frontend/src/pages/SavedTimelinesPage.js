import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Timeline.css";

//Ensures that timelines saved by each user are only visible by that user
/*function getTripKey() {
  const loggedStr = localStorage.getItem("loggedInUser");
  if (loggedStr) {
    try {
      const user = JSON.parse(loggedStr);
      const uniqueId = user.id || user.email;
      if (uniqueId) {
        return `trips_${uniqueId}`;
      }
    } catch (e) {}
  }
  return "trips_guest";
}*/

function SavedTimelinesPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [timeline, setTimeline] = useState([
    {
      createdAt: "2025-12-18T04:24:15.817Z",
      id: 1,
      name: "new timeline!",
      nodes:
      [
        {
        date: "2025-12-12",
        mediaid: 1,
        name: "me on a beach",
        url: "http://localhost:8080/images/me_beach.jpg",
        x: 10,
        y: 10
        },
        {
          date: "2025-12-24",
          mediaid: 2,
          name: "resevoir picture 2",
          url: "http://localhost:8080/images/image.jpg",
          x: 50,
          y: 65
        },
        {
          date: "2025-12-25",
          mediaid: 3,
          name: "resevoir picture 3",
          url: "http://localhost:8080/images/download.jpg",
          x: 90,
          y: 20
        }
      ]
    },
    {
      createdAt: "2025-12-18T04:24:15.817Z",
      id: 2,
      name: "another timeline!",
      nodes:
      [
        {
        date: "2025-12-12",
        mediaid: 1,
        name: "me on a beach",
        url: "http://localhost:8080/images/me_beach.jpg",
        x: 10,
        y: 10
        },
        {
          date: "2025-12-24",
          mediaid: 2,
          name: "resevoir picture 2",
          url: "http://localhost:8080/images/image.jpg",
          x: 50,
          y: 65
        },
        {
          date: "2025-12-25",
          mediaid: 3,
          name: "resevoir picture 3",
          url: "http://localhost:8080/images/download.jpg",
          x: 90,
          y: 20
        }
      ]
    }
  ]);

  //Load saved timelines
  /*useEffect(() => {
    const tripKey = getTripKey();
    const trips = JSON.parse(localStorage.getItem(tripKey) || "[]");
    const found = trips.find((t) => t.id === Number(tripId));
    if (found) setTrip(found);
  }, [tripId]);*/

  //if (!trip) return <p>Trip not found.</p>;

  const timelines = timeline || [];

  //Delete saved timeline
  const handleDelete = (id) => {
    //const timeline = timelines.find((tl) => tl.id === id);
    const selectedTimeline = timeline.filter(i => i.id === id)
    //Confirmation popup message
    const ok = window.confirm(
      `Are you sure you want to delete the timeline "${selectedTimeline[0].name}"?`
    );

    if (!ok) return; 

    /*const tripKey = getTripKey();
    const trips = JSON.parse(localStorage.getItem(tripKey) || "[]");

    const updatedTrips = trips.map((t) => {
      if (t.id !== trip.id) return t;

      return {
        ...t,
        savedTimelines: t.savedTimelines.filter((tl) => tl.id !== id),
      };
    });

    localStorage.setItem(tripKey, JSON.stringify(updatedTrips));
    setTrip(updatedTrips.find((t) => t.id === trip.id));*/

    //Success popup message 

    const updatedTimelines = timeline.filter(i => i.id !== id)
    setTimeline(updatedTimelines);
    alert("Timeline deleted successfully.");
  };

  //View timeline inside the page
  const handleView = (timelineId) => {
    const tl = timelines.find((t) => t.id === timelineId);
    if (tl) setActiveTimeline(tl);
  };

  return (
    <div className="timeline-page">
      
      <button
        className="back-btn"
        onClick={() => {
          if (activeTimeline) {
            setActiveTimeline(null);
          } else {
            navigate(-1);
          }
        }}
      >
        ← Back
      </button>

      {/*View saved timeline mode*/}
      {activeTimeline && (
        <>
          <h1 className="timeline-title">{activeTimeline.name}</h1>

          <div className="timeline-render-box">

            {/*Connecting line between nodes on timeline*/}
            <svg
              className="timeline-svg"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
            >
              <polyline
                points={(activeTimeline.nodes || [])
                  .map((p) => `${(p.x / 100) * 1000},${(p.y / 100) * 400}`)
                  .join(" ")}
                fill="none"
                stroke="white"
                strokeWidth="6"
              />
            </svg>

            {/*Individual timeline nodes*/}
            {(activeTimeline.nodes || []).map((item, index) => (
              <div
                key={index}
                className="timeline-node"
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
              >
                <img src={item.url} alt={item.name} className="timeline-circle" />
                <div className="pin">📍</div>
                <p className="timeline-caption">{item.name}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/*Displays saved timeline--> grid formatting*/}
      {!activeTimeline && (
        <>
          <h1 className="timeline-title">Saved Timelines</h1>

          <div className="timeline-grid">
            {timelines.map((tl) => {
              const preview =
                tl.nodes?.[0]?.url ||
                "https://via.placeholder.com/300x200?text=Timeline";

              return (
                <div key={tl.id} className="timeline-card">
                  <img className="timeline-thumb" src={preview} alt="preview" />

                  <h3 className="timeline-title" style={{ color: "#053f6b" }}>
                    {tl.name}
                  </h3>

                  <div className="timeline-actions">
                    <button className="view-btn" onClick={() => handleView(tl.id)}>
                      View
                    </button>

                    <button className="delete-btn" onClick={() => handleDelete(tl.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {timelines.length === 0 && (
            <p style={{ marginTop: "20px" }}>No saved timelines yet.</p>
          )}
        </>
      )}
    </div>
  );
}

export default SavedTimelinesPage;
