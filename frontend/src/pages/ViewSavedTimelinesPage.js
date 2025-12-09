import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Timeline.css";

function SavedTimelineViewPage() {
  const { tripId, timelineId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [timeline, setTimeline] = useState(null);

  // Load the saved timeline from localStorage
  useEffect(() => {
    const trips = JSON.parse(localStorage.getItem("trips") || "[]");
    const found = trips.find((t) => t.id === Number(tripId));

    if (!found) return;

    setTrip(found);

    const savedTimeline = found.savedTimelines?.find(
      (tl) => tl.id === Number(timelineId)
    );

    if (savedTimeline) {
      setTimeline(savedTimeline.nodes);
    }
  }, [tripId, timelineId]);

  if (!trip) return <p>Trip not found.</p>;
  if (!timeline) return <p>Timeline not found.</p>;

  return (
    <div className="timeline-page">

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 className="timeline-title">{trip.name} — Saved Timeline</h1>

      <div className="timeline-render-box">

        {/* Connecting polyline */}
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

        {/* Render each node */}
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
