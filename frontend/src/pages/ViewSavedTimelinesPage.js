import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Timeline.css";

//Ensures that saved timelines can only be viewed by user who saved them
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

function SavedTimelineViewPage() {
  const { tripId, timelineId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
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
    }
  ]);

  //Load the saved timeline from localStorage
  /*useEffect(() => {
    const tripKey = getTripKey();
    const trips = JSON.parse(localStorage.getItem(tripKey) || "[]");
    const found = trips.find((t) => t.id === Number(tripId));

    if (!found) return;

    setTrip(found);

    const savedTimeline = found.savedTimelines?.find(
      (tl) => tl.id === Number(timelineId)
    );

    if (savedTimeline) {
      setTimeline(savedTimeline.nodes);
    }
  }, [tripId, timelineId]);*/

  //if (!trip) return <p>Trip not found.</p>;
  if (!timeline) return <p>Timeline not found.</p>;

  return (
    <div className="timeline-page">

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 className="timeline-title">{trip.name} — Saved Timeline</h1>

      <div className="timeline-render-box">

        {/*Line to connect individual nodes on timeline*/}
        <svg className="timeline-svg" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <polyline
            points={timeline
              .map((p) => `${(p.x / 100) * 1000},${(p.y / 100) * 400}`)
              .join(" ")}
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/*Render each node*/}
        {timeline.map((item, idx) => (
          <div
            key={idx}
            className="timeline-node"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <img src={item.url} alt={item.name} className="timeline-circle" />
            <div className="pin">📍</div>
            <p className="timeline-caption">{item.name}</p>
          </div>
        ))}

      </div>
    </div>
  );
}

export default SavedTimelineViewPage;
