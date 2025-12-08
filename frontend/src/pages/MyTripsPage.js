import React, { useState, useEffect } from "react";
import "../styles/Itinerary.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';

function MyTripsPage() {
  const navigate = useNavigate();
  const {userID} = useParams();

  /*const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem("trips");
    return saved ? JSON.parse(saved) : [];
  }); */
  const[loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);

  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [invalidFields, setInvalidFields] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios.post("http://localhost:8080/Itinerary/GetAllItineraries", {userid: userID})
    .then(response => {
      renderLoadTrip(response.data);
      setLoading(false);
    })
  }, []);

  const renderLoadTrip = (res) => {
    const mapTrips = res.map(t => ({
      id: t.itineray_id,
      name: t.itinerary_name,
      destination: t.itinerary_dest,
      start: t.start_date,
      end: t.end_date,
    }));

    setTrips(mapTrips);
  };

  //Create new trip in modal
  const handleSaveTrip = () => {
    const errors = [];
    if (!newTripName) errors.push("tripName");
    if (!newDestination) errors.push("destination");
    if (!newStart) errors.push("start");
    if (!newEnd) errors.push("end");

    setInvalidFields(errors);

    if (errors.length > 0) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    const newTrip = {
      name: newTripName, 
      destination: newDestination,
      start: newStart,
      end: newEnd,
      // status: "In Progress", // not in db
      // activities: [], // no need
      // mediaGallery: [] // no need
    };

    setTrips((prev) => [...prev, newTrip]);
    setSuccessMsg("Trip successfully created!");
    setErrorMsg("");

    //Reset form
    setNewTripName("");
    setNewDestination("");
    setNewStart("");
    setNewEnd("");

    setTimeout(() => setShowAddTripModal(false), 1000);
  };

  // Delete existing trip
  const deleteTrip = (id) => {
    setTrips(trips.filter((trip) => trip.id !== id));
  };


  const filteredTrips = trips.filter((t) =>
    (t.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  //UI render
  return (
    <div className="mytrips-page">
      <h1 className="title">My Trips</h1>

      {/*search bar--> can search by tripname*/}
      <input
        className="search-bar"
        placeholder="Search Trip Name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/*Add new trip button*/}
      <button
        className="add-trip-btn"
        onClick={() => {
          setShowAddTripModal(true);
          setErrorMsg("");
          setInvalidFields([]);
        }}
      >
        Add New Trip +
      </button>

      {/*List of existing trips*/}
      <div className="trip-list">
        {!loading && filteredTrips.length === 0 && <p>No trips found.</p>}

        {loading && <p>Loading..</p>}

        {!loading && filteredTrips.map((trip) => (
          <div
            key={trip.id}
            className={`trip-card ${
              trip.status === "Completed" ? "trip-completed" : ""
            }`}
          >
            <h2 className="trip-name">{trip.name}</h2>

            <div className="actions">
              <button className="chat-btn">Chat</button>

              <button
                className="view-btn"
                onClick={() => navigate(`/mytrips/trip/${trip.id}`)}
              >
                View
              </button>

              <button className="delete-btn" onClick={() => deleteTrip(trip.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/*Add trip modal*/}
      {showAddTripModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">Trip Details</h2>

            {errorMsg && <div className="error-msg">{errorMsg}</div>}

            <label>Trip Name</label>
            <input
              className={`modal-input ${
                invalidFields.includes("tripName") ? "invalid-input" : ""
              }`}
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
            />

            <label>Destination City</label>
            <input
              className={`modal-input ${
                invalidFields.includes("destination") ? "invalid-input" : ""
              }`}
              value={newDestination}
              onChange={(e) => setNewDestination(e.target.value)}
            />

            <div className="modal-row">
              <div>
                <label>Start Date</label>
                <input
                  className={`modal-input ${
                    invalidFields.includes("start") ? "invalid-input" : ""
                  }`}
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </div>

              <div>
                <label>End Date</label>
                <input
                  className={`modal-input ${
                    invalidFields.includes("end") ? "invalid-input" : ""
                  }`}
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setShowAddTripModal(false)}
              >
                Cancel
              </button>
              <button className="modal-save" onClick={handleSaveTrip}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {successMsg && <div className="success-popup">{successMsg}</div>}
    </div>
  );
}

export default MyTripsPage;
