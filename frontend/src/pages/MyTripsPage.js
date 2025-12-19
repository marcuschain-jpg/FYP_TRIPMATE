import React, { useState, useEffect } from "react";
import "../styles/Itinerary.css";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import axios from 'axios';
import ItineraryChat from "../components/ItineraryChat";


function MyTripsPage() {
  const navigate = useNavigate();
  const { userID } = useParams();

  const { myTrips: joinedGroupTrips } = useOutletContext();

  //Load all existing trips  
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  //Dropdown filter state
  const [showFilters, setShowFilters] = useState(false);

  //Delete confirmation message
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const[showChat, setShowChat] = useState(false);

  // ✅ helper to convert a group trip into MyTrips format
  const mapGroupTripToMyTrip = (t) => ({
    id: t.id,
    name: t.title,
    destination: "Group Trip",
    start: "",
    end: "",
    status: false,
    isGroupTrip: true,
    type: "Group",
  });
  

  //Load from backend (private trips)
  useEffect(() => {
    axios
      .get("http://localhost:8080/Itinerary/GetAllItineraries", {
        params: { userid: userID },
        withCredentials: true,
      })
      .then((response) => {
        renderLoadTrip(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [userID]);

  const renderLoadTrip = (res) => {
    const mapTrips = res.map((t) => ({
      id: t.itinerary_id,
      name: t.itinerary_name,
      destination: t.itinerary_dest,
      start: t.start_date,
      end: t.end_date,
      status: t.completed,
      isGroupTrip: false,
      type: "Private",
    }));

    setTrips((prev) => {
      //keep any group trips already in state
      const existingGroupTrips = prev.filter((x) => x.isGroupTrip === true);

      //add joined group trips from shared state too
      const sharedGroupTrips = (joinedGroupTrips || []).map(mapGroupTripToMyTrip);

      //Merge group trips without duplicates
      const allGroupTrips = [...existingGroupTrips, ...sharedGroupTrips].filter(
        (trip, index, arr) => arr.findIndex((x) => x.id === trip.id) === index
      );

      //Ensure no id clash with private trips
      const finalGroupTrips = allGroupTrips.filter(
        (g) => !mapTrips.some((p) => p.id === g.id)
      );

      return [...mapTrips, ...finalGroupTrips];
    });
  };

  //Whenever joined trips changes-->keep them in My rips list
  useEffect(() => {
    if (!joinedGroupTrips) return;

    setTrips((prev) => {
      const privateTrips = prev.filter((t) => t.isGroupTrip !== true);
      const newGroupTrips = joinedGroupTrips.map(mapGroupTripToMyTrip);

      const merged = [...privateTrips, ...newGroupTrips].filter(
        (trip, index, arr) => arr.findIndex((x) => x.id === trip.id) === index
      );

      return merged;
    });
  }, [joinedGroupTrips]);

  //Create a new trip
  const handleSaveTrip = async () => {
    const missing = [];
    if (!newTripName) missing.push("tripName");
    if (!newDestination) missing.push("destination");
    if (!newStart) missing.push("start");
    if (!newEnd) missing.push("end");

    setInvalidFields(missing);

    if (missing.length > 0) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      let newTripID;

      const response = await axios.post("http://localhost:8080/Itinerary/CreateItinerary", {
        iName: newTripName,
        iDest: newDestination,
        start: newStart,
        end: newEnd,
        userid: userID,
      });

      newTripID = response.data?.[0]?.itinerary_id;

      if (newTripID > 0) {
        const newTrip = {
          id: newTripID,
          name: newTripName,
          destination: newDestination,
          start: newStart,
          end: newEnd,
          status: false,
          isGroupTrip: false,
          type: "Private",
        };

        setTrips((prev) => [...prev, newTrip]);
        setSuccessMsg("Trip successfully created!");

        setNewTripName("");
        setNewDestination("");
        setNewStart("");
        setNewEnd("");
        setErrorMsg("");
        setTimeout(() => setShowAddTripModal(false), 300);
      } else {
        setErrorMsg("Insert Failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Insert Failed");
    }
  };

  //Confirmation popup
  const requestDeleteTrip = (id) => {
    const trip = trips.find((t) => t.id === id);
    setTripToDelete(trip);
    setShowDeleteConfirm(true);
  };

  const deleteTripConfirmed = async () => {
    if (!tripToDelete) return;

    if (tripToDelete.isGroupTrip === true) {
      setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
      setShowDeleteConfirm(false);
      setTripToDelete(null);

      setSuccessMsg("Left group trip successfully!");
      setTimeout(() => setSuccessMsg(""), 1500);
      return;
    }

    try {
      const response = await axios.delete(
        "http://localhost:8080/Itinerary/DeleteItinerary",
        {
          data: { itineraryid: tripToDelete.id },
          withCredentials: true,
        }
      );

      if (response.data === true) {
        setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
        setShowDeleteConfirm(false);
        setTripToDelete(null);

        setSuccessMsg("Trip deleted successfully!");
        setTimeout(() => setSuccessMsg(""), 1500);
      } else {
        setErrorMsg("Delete failed.");
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Delete failed (server error).");
      setShowDeleteConfirm(false);
    }
  };

  //Apply filters
  const filteredTrips = trips.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType =
      filterType === "All" ||
      (filterType === "Group" && t.isGroupTrip === true) ||
      (filterType === "Private" && t.isGroupTrip !== true);

    const matchStatus =
      filterStatus === "All" ||
      (filterStatus === "Completed" && t.status === true) ||
      (filterStatus === "In Progress" && t.status === false);

    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="mytrips-page">
      <h1 className="title">My Trips</h1>

      {/*Search/filter/add button*/}
      <div className="top-controls">
        <input
          className="search-bar"
          placeholder="Search Trip Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filter-dropdown-wrapper">
          <button
            className="filter-toggle"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            Filter ▾
          </button>

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

      <div className="trip-list">
        {!Loading && filteredTrips.length === 0 && <p>No trips found.</p>}
        {Loading && <p>Loading..</p>}

        {!Loading &&
          filteredTrips.map((trip) => (
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
                {trip.isGroupTrip === true && (
                  <button
                    className="chat-btn"
                    onClick={() => setShowChat(true)}
                  >
                    Chat
                  </button>
                )}

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
            <h2 className="modal-title">
              {tripToDelete?.isGroupTrip ? "Leave Group Trip" : "Confirm Delete"}
            </h2>

            <p>
              {tripToDelete?.isGroupTrip
                ? "Are you sure you want to leave this group trip?"
                : "Are you sure you want to delete this trip?"}
            </p>

            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>

              <button className="modal-delete" onClick={deleteTripConfirmed}>
                {tripToDelete?.isGroupTrip ? "Leave" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChat && ( <ItineraryChat onClose={() => setShowChat(false)}/> )}

      {successMsg && <div className="success-popup">{successMsg}</div>}
    </div>
  );
}

export default MyTripsPage;
