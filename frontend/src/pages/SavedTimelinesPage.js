import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Itinerary.css";

function SavedTimelinesPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);

  //Load saved timelines
  useEffect(() => {
    const trips = JSON.parse(localStorage.getItem("trips") || "[]");
    const found = trips.find((t) => t.id === Number(tripId));

    if (found) setTrip(found);
  }, [tripId]);

  if (!trip) return <p>Trip not found.</p>;

  const timelines = trip.savedTimelines || [];

  //Delete saved timeline
  const handleDelete = (id) => {
    const trips = JSON.parse(localStorage.getItem("trips") || "[]");

    const updatedTrips = trips.map((t) => {
      if (t.id !== trip.id) return t;

      return {
        ...t,
        savedTimelines: t.savedTimelines.filter((tl) => tl.id !== id),
      };
    });

    localStorage.setItem("trips", JSON.stringify(updatedTrips));
    setTrip(updatedTrips.find((t) => t.id === trip.id));
  };

  //View timeline
  const handleView = (timelineId) => {
    navigate(`/mytrips/trip/${tripId}/saved-timelines/${timelineId}`);
  };

  return (
    <div className="saved-timelines-page">

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1>Saved Timelines</h1>

      <div className="timeline-grid">
        {timelines.map((tl) => {
          //Pick first node image as preview
          const preview =
            tl.nodes?.[0]?.url ||
            "https://via.placeholder.com/300x200?text=Timeline";

          return (
            <div key={tl.id} className="timeline-card">
              <img className="timeline-thumb" src={preview} alt="preview" />

              <h3 className="timeline-title">{tl.name}</h3>

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
    </div>
  );
}

export default SavedTimelinesPage;


//STILL WIP SORRY