import React, { useState, useEffect } from "react";
import "../styles/Itinerary.css";
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';


function MyTripsPage() {
  const navigate = useNavigate();
  const { userID } = useParams();


  //Load all existing trips  (for THIS user only)
  const [trips, setTrips] = useState([]);
  const [Loading, setLoading] = useState(true);

  //Modal states
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [invalidFields, setInvalidFields] = useState([]);

  //Filters
  //Filter by trip type & status (completed/inprogress)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  //Dropdown filter state
  const [showFilters, setShowFilters] = useState(false);

  //Delete confirmation message
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);

  //Save trips on change (for THIS user only)
  useEffect(() => {
    axios.get("http://localhost:8080/Itinerary/GetAllItineraries", {params:{userid: userID}})
    .then(response => {
      renderLoadTrip(response.data);
      setLoading(false);
    })
  }, []);

  const renderLoadTrip = (res) => {
    const mapTrips = res.map(t => ({
      id: t.itinerary_id,
      name: t.itinerary_name,
      destination: t.itinerary_dest,
      start: t.start_date,
      end: t.end_date,
      status: t.completed,
    }));

    setTrips(mapTrips);
  };

  //Create a new trip --> fill in details in required fields
  const handleSaveTrip = async() => {
    const missing = [];
    if (!newTripName) missing.push("tripName");
    if (!newDestination) missing.push("destination");
    if (!newStart) missing.push("start");
    if (!newEnd) missing.push("end");

    setInvalidFields(missing); 

    if (missing.length > 0) {
      setErrorMsg("Please fill in all fields.");//All fields required --> error message if any field missing 
      return;
    }

    //insert trip here if successful then setTrips
    let newTripID;
    await axios.post("http://localhost:8080/Itinerary/CreateItinerary", {iName:newTripName, iDest:newDestination, start:newStart, end:newEnd, userid:userID})
    .then(response => {
      newTripID = response.data[0].itinerary_id;
    })

    if(newTripID > 0)
    {
      const newTrip = {
      id: newTripID,
      name: newTripName, 
      destination: newDestination,
      start: newStart,
      end: newEnd,
      };

      setTrips((prev) => [...prev, newTrip]);
      setSuccessMsg("Trip successfully created!");

      //Reset form
      setNewTripName("");
      setNewDestination("");
      setNewStart("");
      setNewEnd("");
      setErrorMsg("");
      setTimeout(() => setShowAddTripModal(false), 300);
    }

    else
    {
      setErrorMsg("Insert Failed");
      setNewTripName("");
      setNewDestination("");
      setNewStart("");
      setNewEnd("");
      return;
    }

  };

  // Delete existing trip
  const requestDeleteTrip = async(id) => {
    const trip = trips.find((t) => t.id === id);
    setTripToDelete(trip);
    setShowDeleteConfirm(true);
  };

  //Final delete after confirmation
  const deleteTripConfirmed = async() => {
    if (!tripToDelete) return;

    await axios.delete("http://localhost:8080/Itinerary/DeleteItinerary", {data:{itineraryid:tripToDelete.id}})
    .then(response => {
      if(response.data === true) 
      {
        setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
        setShowDeleteConfirm(false);
        setTripToDelete(null);

        setSuccessMsg("Trip deleted successfully!");
        setTimeout(() => setSuccessMsg(""), 1500);
      }
    });

  };

  //Apply filters to search for trips in list
  const filteredTrips = trips.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "All" || t.type === filterType;
    const matchStatus = filterStatus === "All" || t.status === filterStatus;

    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="mytrips-page">
      <h1 className="title">My Trips</h1>

      {/*Search, filter, add button*/}
      <div className="top-controls">

        {/*Search bar*/}
        <input
          className="search-bar"
          placeholder="Search Trip Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/*Filter trip dropdown bar--> positioned beside search bar*/}
        <div className="filter-dropdown-wrapper">
          <button
            className="filter-toggle"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            Filter ▾
          </button>

          {/*Filter options*/}
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-section">
                <label className="filter-title">Trip Type</label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterType === "All"}
                    onChange={() => setFilterType("All")}
                  />
                  All Trips
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterType === "Private"}
                    onChange={() => setFilterType("Private")}
                  />
                  Private Trips
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterType === "Group"}
                    onChange={() => setFilterType("Group")}
                  />
                  Group Trips
                </label>
              </div>

              <div className="filter-section">
                <label className="filter-title">Trip Status</label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterStatus === "All"}
                    onChange={() => setFilterStatus("All")}
                  />
                  All
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterStatus === "Completed"}
                    onChange={() => setFilterStatus("Completed")}
                  />
                  Completed
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterStatus === "In Progress"}
                    onChange={() => setFilterStatus("In Progress")}
                  />
                  In Progress
                </label>
              </div>
            </div>
          )}
        </div>

        {/*Add new trip button*/}
        <button
          className="add-trip-btn"
          onClick={() => {
            setShowAddTripModal(true);
            setInvalidFields([]);
            setErrorMsg("");
          }}
        >
          Add New Trip +
        </button>
      </div>

      {/*Trip cards*/}
      <div className="trip-list">
        {!Loading && filteredTrips.length === 0 && <p>No trips found.</p>}
        
        {Loading && <p>Loading..</p>}

        {!Loading && filteredTrips.map((trip) => (
          <div key={trip.id} className="trip-card">
            <div>
              <h2 className="trip-name">{trip.name}</h2>

              <div
                className={`trip-status ${
                  trip.status === true ? "completed" : "inprogress"
                }`}
              >
                {trip.status && "Completed"}
                {!trip.status && "In Progress"}
              </div>
            </div>

            <div className="actions">
              <button className="chat-btn">Chat</button>

              <button
                className="view-btn"
                onClick={() => navigate(`/mytrips/trip/${trip.id}`)}
              >
                View
              </button>

              <button
                className="delete-btn"
                onClick={() => requestDeleteTrip(trip.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/*Add new trip modal*/}
      {showAddTripModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">Trip Details</h2>

            {errorMsg && <div className="error-msg">{errorMsg}</div>}

            <div className="modal-row">
              <div className="modal-col">
                <label>Trip Name</label>
                <input
                  className={`modal-input ${
                    invalidFields.includes("tripName") ? "invalid-input" : ""
                  }`}
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                />
              </div>

              <div className="modal-col">
                <label>Destination City</label>
                <input
                  className={`modal-input ${
                    invalidFields.includes("destination") ? "invalid-input" : ""
                  }`}
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label>Start Date</label>
                <input
                  type="date"
                  className={`modal-input ${
                    invalidFields.includes("start") ? "invalid-input" : ""
                  }`}
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </div>

              <div className="modal-col">
                <label>End Date</label>
                <input
                  type="date"
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

      {/*Delete confirmation modal*/}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <h2 className="modal-title">Confirm Delete</h2>
            <p>Are you sure you want to delete this trip?</p>

            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>

              <button className="modal-delete" onClick={deleteTripConfirmed}>
                Delete
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
