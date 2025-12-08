import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Itinerary.css";

function TripDetailsPage() {
  const { tripId } = useParams();

  const navigate = useNavigate();

  //Store all trips--> includes the current selected trip
  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);

  //Load trips from localStorage and find the trip that matches trip id 
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("trips") || "[]");
    setTrips(saved);

    //Find the trip that matches the URL id
    const found = saved.find((t) => t.id === Number(tripId));
    setTrip(found || null);
  }, [tripId]);

  //Save updated trips back to local storage
  const updateTrips = (updatedTrips) => {
    localStorage.setItem("trips", JSON.stringify(updatedTrips));
    setTrips(updatedTrips);
  };

  //Update the trip status (completed or not)
  const updateTripStatus = (status) => {
    const updated = trips.map((t) =>
      t.id === trip.id ? { ...t, status } : t
    );

    updateTrips(updated);
    setTrip({ ...trip, status });
  };

  if (!trip) return <p>Trip not found.</p>;

  return (
    <div className="itinerary-page">

      <button className="back-btn" onClick={() => navigate("/mytrips")}>
        ← Back to My Trips
      </button>

      <h1>{trip.name}</h1>
      <p>
        {trip.start} — {trip.end}
      </p>

      {/*Checkbox for trip status*/}
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

      {/*Itinerary section*/}
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

      {/*Timeline section*/}
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

      {/*Media section*/}
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
  );
}

export default TripDetailsPage;
