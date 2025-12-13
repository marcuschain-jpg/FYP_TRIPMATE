import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
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
  const[loading, setLoading] = useState(true);

  //Load trips and set current trip
  useEffect(() => {
    axios.get("http://localhost:8080/Itinerary/GetItinerary", {params:{i_id: tripId}})
    .then(response => {
      renderLoadTrip(response.data);
      setLoading(false);
    })
  }, []);

  const renderLoadTrip = (res) => {
    // format date from timestamp to dd/mm/yyyy
    const tempSDate = res[0].start_date.split('T')[0]
    const dateObj = new Date(tempSDate);
    const formattedSDate = dateObj.toLocaleDateString("en-GB");

    const tempEDate = res[0].start_date.split('T')[0]
    const dateObj2 = new Date(tempEDate);
    const formattedEDate = dateObj2.toLocaleDateString("en-GB");

    const mapTrips = {
      id: res[0].itinerary_id,
      name: res[0].itinerary_name,
      destination: res[0].itinerary_dest,
      start: formattedSDate,
      end: formattedEDate,
      status: res[0].completed
    };

    setTrip(mapTrips);
  };

  const updateTrips = (updatedTrips) => { // upload local STORAGE
    localStorage.setItem("trips", JSON.stringify(updatedTrips));
    setTrips(updatedTrips);
  };

  const updateTripStatus = (status) => { //main method to update completed
    axios.patch("http://localhost:8080/Itinerary/UpdateItineraryComplete", {i_id: tripId, completed: status})
    .then(response => {
      if(response.data === true)
      {
        setTrip({ ...trip, status });
      }
    });
  };

  if (!trip) return <p>Trip not found.</p>;

  return (
    <div className="tripdetails-page">
      <div className="tripdetails-inner">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back to My Trips
        </button>

        <h1 className="tripdetails-title">{trip.name}</h1>
        <p className="trip-date">
          {trip.start} — {trip.end}
        </p>

        <label className="completed-label">
          <input
            type="checkbox"
            checked={trip.status === true}
            onChange={(e) =>
              updateTripStatus(e.target.checked ? true : false)
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
              onClick={() => navigate(`/mytrips/trip/itinerary/${trip.id}`)}
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
