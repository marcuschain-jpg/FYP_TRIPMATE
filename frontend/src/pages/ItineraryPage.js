import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import InitMaps from "../components/InitMaps";
import useMapData from "../hooks/FetchMapData";
import "../styles/Itinerary.css";

function ItineraryPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const mapData = useMapData();

  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

  //Load trip & activities
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("trips") || "[]");
    setTrips(saved);

    const foundTrip = saved.find((t) => t.id === Number(tripId));
    setTrip(foundTrip || null);

    if (foundTrip) {
      const allDates = Array.from(
        new Set((foundTrip.activities || []).map((a) => a.date))
      ).sort();

      setSelectedDate(allDates[0] || "");
    }
  }, [tripId]);

  if (!trip) return <p className="loading-text">Trip not found.</p>;

  const activities = trip.activities || [];

  const filteredActivities = activities.filter(
    (a) => a.date === selectedDate
  );

  //Delete actiity from itinerary
  const handleDeleteActivity = (index) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) { //confirmation message for delete funciton
      return;
    }

    const updatedTrips = [...trips];
    const thisTrip = updatedTrips.find((t) => t.id === Number(tripId));

    if (!thisTrip) return;

    thisTrip.activities.splice(index, 1);

    localStorage.setItem("trips", JSON.stringify(updatedTrips));
    setTrips(updatedTrips);
    setTrip({ ...thisTrip });
    alert("Activity deleted successfully!");
  };

  return (
    <div className="itinerary-view">
      <button
        className="back-btn"
        onClick={() => navigate(`/mytrips/trip/${tripId}`)}
      >
        ← Back
      </button>
      <div className="itinerary-top-row">
        <div>
          <h1>{trip.name}</h1>
          <p className="date-text">
            {trip.start} – {trip.end}
          </p>
        </div>
      </div>

      <div className="view-layout">
        <div className="left-side">
          <h2>Activities</h2>

          {/*Date drop down bar--> user can view activities for selected date*/}
          {activities.length > 0 && (
            <select
              className="date-filter-dropdown"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {Array.from(new Set(activities.map((a) => a.date)))
                .sort()
                .map((d) => (
                  <option key={d} value={d}>
                    {new Date(d).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })}
                  </option>
                ))}
            </select>
          )}

          {/*Activity section*/}
          <div className="activities-section">
            {filteredActivities.length === 0 && (
              <p>No activities for this day.</p>
            )}

            {filteredActivities.map((act, index) => (
              <div key={index} className="activity-card">
                <h3>{act.name}</h3>
                <p>
                  <strong>{act.date}</strong>
                </p>
                <p>{act.location}</p>
                {act.address && <p>{act.address}</p>}

                <div className="activity-actions">
                  <button
                    className="activity-edit-btn"
                    onClick={() =>
                      navigate(`/mytrips/trip/${tripId}/activity/edit/${index}`)
                    }
                  >
                    Edit
                  </button>

                  {/* FIXED DELETE BUTTON */}
                  <button
                    className="activity-delete-btn"
                    onClick={() => handleDeleteActivity(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/*Add new activity*/}
          <button
            className="add-activity-big"
            onClick={() =>
              navigate(`/mytrips/trip/${tripId}/activity/create`)
            }
          >
            Add Activity +
          </button>
        </div>

        <div className="right-side">
          {mapData ? (
            <InitMaps mapData={mapData} />
          ) : (
            <p className="map-loading-text">Loading map…</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItineraryPage;
