import React, { useState, useEffect } from "react";
import "../styles/Itinerary.css";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import axios from 'axios';
import ItineraryChat from "../components/ItineraryChat";


function MyTripsPage() {
  const navigate = useNavigate();

  const { myTrips: joinedGroupTrips } = useOutletContext();

  //Load all existing trips  
  const [trips, setTrips] = useState([]);
  const [Loading, setLoading] = useState(true);
  const [usertype, setUsertype] = useState("");

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

  //Convert a group trip into MyTrips format with member counter
  const mapGroupTripToMyTrip = (t) => ({
    id: t.id,
    name: t.title,
    destination: "Group Trip",
    start: "",
    end: "",
    status: false,
    isGroupTrip: true,
    type: "Group",
    owner: t.owner,
    currentMembers: t.currentMembers || 0, //Current members in the group trip-->synced with GroupTripsPage
    maxCapacity: t.capacity || 0, //Max capacity from group trips-->synced with GroupTripsPage
  });
  

  //Load from backend (private trips)
  useEffect(() => {
    const getUserType = async() => {
      try{
        const res = await axios.post("http://localhost:8080/GetRoleForUser", {}, {withCredentials:true})
        setUsertype(res.data.role)
      }
      catch(err){
        if(err.response.status === 401 || 403){
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }
      }
    }
    axios.get("http://localhost:8080/Itinerary/GetAllItineraries", {withCredentials: true})
      .then((response) => {
        renderLoadTrip(response.data);
        setLoading(false);
      })
      .catch((err) => {
        if(err.response.status === 401 || err.response.status === 403)
        {
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }
        else if(err.response.status === 500)
        {
          console.log(err.response.data.message);
        }
      });
      getUserType();
  }, []);

  const renderLoadTrip = (res) => {
    const mapTrips = res.map((t) => ({
      id: t.itinerary_id,
      name: t.itinerary_name,
      destination: t.itinerary_dest,
      start: t.start_date,
      end: t.end_date,
      status: t.completed,
      isGroupTrip: t.type === "Group" ? true : false,
      collaborators: ["a", "b"], //Initialize empty collaborators array
      userItineraryType: t.useritype
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

  //Whenever joined trips changes-->keep them in My trips list
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
      let response;

      response = await axios.post("http://localhost:8080/Itinerary/CreateItinerary", {
        iName: newTripName,
        iDest: newDestination,
        start: newStart,
        end: newEnd,
        type: "Private"
      }, {withCredentials: true})
      .catch(err => {
        console.log(err)
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
          userItineraryType: response.data[0].useritype,
          type: "Private", //Marker for private trips
          collaborators: [], //Initialize empty collaborators array
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

    // For group trips
    if (tripToDelete.isGroupTrip === true) {
      setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
      setShowDeleteConfirm(false);
      setTripToDelete(null);

      setSuccessMsg("Left group trip successfully!");
      setTimeout(() => setSuccessMsg(""), 1500);
      return;
    }

    // If button is delete
    if(tripToDelete.userItineraryType === "host")
    {
      try {
      const response = await axios.delete(
        "http://localhost:8080/Itinerary/DeleteItinerary",
        {
          data: { itineraryid: tripToDelete.id },
          withCredentials: true
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
    }
    // If button is exit
    else if(tripToDelete.userItineraryType === "visitor"){
      try {
      const response = await axios.delete(
        "http://localhost:8080/Itinerary/ExitItinerary",
        {
          data: { itineraryid: tripToDelete.id },
          withCredentials: true
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
    }
  };

  //Update collaborators for a trip
  const updateTripCollaborators = (tripId, collaborators) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, collaborators } : trip
      )
    );
  };

  //Listen for collaborator updates from TripDetailsPage
  useEffect(() => {
    const handleUpdateCollaborators = (event) => {
      const { tripId, collaborators } = event.detail;
      updateTripCollaborators(tripId, collaborators);
    };

    window.addEventListener("updateCollaborators", handleUpdateCollaborators);
    return () => window.removeEventListener("updateCollaborators", handleUpdateCollaborators);
  }, []);

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
              {usertype === "premium" && <div className="filter-section">
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
              </div>}

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
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 className="trip-name">{trip.name}</h2>
                  {/*Marker for trip type*/}
                  {usertype === "premium" && <span 
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: trip.isGroupTrip ? "#fff" : "#333",
                      backgroundColor: trip.isGroupTrip ? "#FF6B6B" : "#4ECDC4"
                    }}
                  >
                    {trip.isGroupTrip ? "Group / Public" : "Private"}
                  </span>}
                </div>

                {/*Member counter for group trips*/}
                {usertype === "premium" && trip.isGroupTrip && (
                  <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                    Members: {trip.currentMembers}/{trip.maxCapacity}
                  </p>
                )}

                {/*Collaborator counter for private trips*/}
                {usertype === "premium" && !trip.isGroupTrip && trip.collaborators && trip.collaborators.length > 0 && (
                  <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                    Collaborators: {trip.collaborators.length}
                  </p>
                )}

                <div className={`trip-status ${trip.status === true ? "completed" : "inprogress"}`}>
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

                {trip.userItineraryType === "host" && <button className="delete-btn" onClick={() => requestDeleteTrip(trip.id)}>
                  Delete
                </button>}

                {trip.userItineraryType === "visitor" && <button className="delete-btn" onClick={() => requestDeleteTrip(trip.id)}>
                  Exit
                </button>}
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
              {(tripToDelete?.isGroupTrip || tripToDelete.userItineraryType === "visitor") ? "Exit Group Trip" : "Confirm Delete"}
            </h2>

            <p>
              {(tripToDelete?.isGroupTrip || tripToDelete.userItineraryType === "visitor")
                ? "Are you sure you want to exit this group trip?"
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
                {(tripToDelete?.isGroupTrip || tripToDelete.userItineraryType === "visitor") ? "Exit" : "Delete"}
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