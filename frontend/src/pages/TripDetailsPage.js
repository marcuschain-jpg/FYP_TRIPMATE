import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Itinerary.css";

//Ensures that trips created by each user are only visible by that user
function getTripKey() {
  const loggedStr = localStorage.getItem("loggedInUser");
  if (loggedStr) {
    try {
      const user = JSON.parse(loggedStr);
      const uniqueId = user.id || user.email; //Use id/email
      if (uniqueId) {
        return `trips_${uniqueId}`;
      }
    } catch (e) {
      //Ignore JSON parse errors and fall back
    }
  }
  return "trips_guest";
}

function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);

  //Load trips and set current trip
  useEffect(() => {
    const tripKey = getTripKey();
    const saved = JSON.parse(localStorage.getItem(tripKey) || "[]");
    setTrips(saved);
    const found = saved.find((t) => t.id === Number(tripId));
    setTrip(found || null);
  }, [tripId]);

  const updateTrips = (updatedTrips) => {
    const tripKey = getTripKey();
    localStorage.setItem(tripKey, JSON.stringify(updatedTrips));
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
