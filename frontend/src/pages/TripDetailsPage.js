import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Itinerary.css";

function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);

  //Load trips and set current trip
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("trips") || "[]");
    setTrips(saved);
    const found = saved.find((t) => t.id === Number(tripId));
    setTrip(found || null);
  }, [tripId]);

  const updateTrips = (updatedTrips) => {
    localStorage.setItem("trips", JSON.stringify(updatedTrips));
    setTrips(updatedTrips);
  };

  const updateTripStatus = (status) => {
    const updated = trips.map((t) =>
      t.id === trip.id ? { ...t, status } : t
    );
    updateTrips(updated);
    setTrip({ ...trip, status });
  };

  if (!trip) return <p>Trip not found.</p>;

  return (
    <div className="tripdetails-page">
      <div className="tripdetails-inner">
        <button className="back-btn" onClick={() => navigate("/mytrips")}>
          ← Back to My Trips
        </button>

        <h1 className="tripdetails-title">{trip.name}</h1>
        <p className="trip-date">
          {trip.start} — {trip.end}
        </p>

        <label className="completed-label">
          <input
            type="checkbox"
            checked={trip.status === "Completed"}
            onChange={(e) =>
              updateTripStatus(e.target.checked ? "Completed" : "In Progress")
            }
          />
          Trip Completed
        </label>

        {/*Itinerary carc*/}
        <div className="section-card">
          <div className="section-content">
            <h2>Itinerary</h2>
            <p>View or edit itinerary here</p>
            <button
              className="view-btn"
              onClick={() => navigate(`/mytrips/trip/${trip.id}/itinerary`)}
            >
              View
            </button>
          </div>
        </div>

        {/*Timeline card*/}
        <div className="section-card">
          <div className="section-content">
            <h2>Timeline</h2>
            <p>Generate or view timeline here</p>
            <button
              className="view-btn"
              onClick={() => navigate(`/mytrips/trip/${trip.id}/timeline`)}
            >
              View
            </button>
          </div>
        </div>

        {/*Media card*/}
        <div className="section-card">
          <div className="section-content">
            <h2>Media</h2>
            <p>Edit or view media here</p>
            <button
              className="view-btn"
              onClick={() => navigate(`/mytrips/trip/${trip.id}/media`)}
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripDetailsPage;
