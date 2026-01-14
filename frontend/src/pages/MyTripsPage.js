import React, { useState, useEffect } from "react";
import "../styles/Itinerary.css";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import axios from 'axios';
import ItineraryChat from "../components/ItineraryChat";

//Date formatter function--> for date editing
const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  
  let date;
  
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  if (typeof dateValue === "string") {
    date = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return "";
  }
  
  if (isNaN(date.getTime())) {
    return "";
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
};

function MyTripsPage() {
  const navigate = useNavigate();

  const { myTrips: joinedGroupTrips } = useOutletContext();

  //Load all existing trips  
  const [trips, setTrips] = useState([]);
  const [Loading, setLoading] = useState(true);
  const [usertype, setUsertype] = useState("");

  //For city load
  const [firstLoad, setFirstLoad] = useState(true);
  const [searchResult, setSearchResult]= useState([]);
  const [newFullDest, setNewFullDest] = useState({});
  const [showLocSearch, setShowLocSearch] = useState(false);

  //Modal states
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [editingTripId, setEditingTripId] = useState(null);
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
  const [filterMemberType, setFilterMemberType] = useState("All"); //added member type (host/collaborator)

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
    currentMembers: t.currentMembers || 0,
    maxCapacity: t.capacity || 0,
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
      userItineraryType: t.useritype,
      collaborators: t.num_ppl,
      currentMembers: t.num_ppl,
      maxCapacity: t.capacity
    }));

    setTrips((prev) => {
      const existingGroupTrips = prev.filter((x) => x.isGroupTrip === true);

      const sharedGroupTrips = (joinedGroupTrips || []).map(mapGroupTripToMyTrip);

      const allGroupTrips = [...existingGroupTrips, ...sharedGroupTrips].filter(
        (trip, index, arr) => arr.findIndex((x) => x.id === trip.id) === index
      );

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

  //For location search
  useEffect(() => {
    if(!newDestination) return;
    if(firstLoad) //When first load page dont search for anything
      {
        setFirstLoad(false);
        return;
      }

      const locTimer = setTimeout(async() => {
      console.log("Send to backend", newDestination);
      await axios.post("http://localhost:8080/Itinerary/CitySearch", {input:newDestination}, {withCredentials:true})
      .then(res=>{
        renderLoadSearchResult(res.data);
      })
      .catch(err => {console.log(err);});

    }, 1000);

    return () => {
      clearTimeout(locTimer);
    };
  }, [newDestination])

  useEffect(() => {
    if(searchResult.length > 0)
      {
        console.log(searchResult);
        setShowLocSearch(true);
      }
  }, [searchResult])

  const renderLoadSearchResult = (res) => {
    const mapResults = res.map(t => ({
      placeid: t.id,
      name: t.name,
      lat: t.lat,
      lng: t.lng,
    }));

    setSearchResult(mapResults);
  };


  const updateFormBasedOnLoc = async(res) => {
    setNewFullDest({
      placeid: res.placeid,
      name: res.name,
      lat: res.lat,
      lng: res.lng
    });
    setNewDestination(res.name);

    setFirstLoad(true);
    setShowLocSearch(false);
  };

  //Open add trip modal
  const openAddModal = () => {
    setIsEditingTrip(false);
    setEditingTripId(null);
    setNewTripName("");
    setNewDestination("");
    setNewStart("");
    setNewEnd("");
    setInvalidFields([]);
    setErrorMsg("");
    setShowAddTripModal(true);
  };

  //Open edit trip modal
  const openEditModal = (trip) => {
    setIsEditingTrip(true);
    setEditingTripId(trip.id);
    setNewTripName(trip.name);
    setNewDestination(trip.destination);
    setNewStart(formatDateForInput(trip.start));
    setNewEnd(formatDateForInput(trip.end));
    setInvalidFields([]);
    setErrorMsg("");
    setShowAddTripModal(true);
  };

  //Create or update trip
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
      if (isEditingTrip) {
        const response = await axios.patch(
          `http://localhost:8080/Itinerary/UpdateItinerary`,
          {
            itineraryid: editingTripId,
            iName: newTripName,
            iDest: newDestination,
            start: formatDateForInput(newStart),
            end: formatDateForInput(newEnd)
          },
          { withCredentials: true }
        );

        console.log("Update response:", response.data);

        if (response.data === true || response.status === 200) {
          setTrips((prev) =>
            prev.map((trip) =>
              trip.id === editingTripId
                ? {
                    ...trip,
                    name: newTripName,
                    destination: newDestination,
                    start: formatDateForInput(newStart),
                    end: formatDateForInput(newEnd)
                  }
                : trip
            )
          );
          setSuccessMsg("Trip updated successfully!");

          setNewTripName("");
          setNewDestination("");
          setNewStart("");
          setNewEnd("");
          setErrorMsg("");
          setTimeout(() => setShowAddTripModal(false), 300);
        } else {
          setErrorMsg("Update Failed");
        }
      } else {
        const response = await axios.post(
          "http://localhost:8080/Itinerary/CreateItinerary",
          {
            iName: newTripName,
            iDest: newFullDest,
            start: formatDateForInput(newStart),
            end: formatDateForInput(newEnd),
            type: "Private"
          },
          { withCredentials: true }
        ).catch(err => {
          console.log(err);
          throw err;
        });

        const newTripID = response.data?.[0]?.itinerary_id;

        if (newTripID > 0) {
          const newTrip = {
            id: newTripID,
            name: newTripName,
            destination: newDestination,
            start: formatDateForInput(newStart),
            end: formatDateForInput(newEnd),
            status: false,
            isGroupTrip: false,
            userItineraryType: response.data[0].useritype,
            type: "Private",
            collaborators: 1,
            maxCapacity: 5,
          };

          setTrips((prev) => [...prev, newTrip]);
          setSuccessMsg("Trip successfully created!");

          setNewTripName("");
          setNewDestination("");
          setNewStart("");
          setNewEnd("");
          setErrorMsg("");
          setNewFullDest({});
          setTimeout(() => setShowAddTripModal(false), 300);
        } else {
          setErrorMsg("Insert Failed");
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Operation Failed");
    }
  };

  //Confirmation modal
  const requestDeleteTrip = (id) => {
    const trip = trips.find((t) => t.id === id);
    setTripToDelete(trip);
    setShowDeleteConfirm(true);
  };

  const deleteTripConfirmed = async () => {
    if (!tripToDelete) return;

    const isHost = tripToDelete.userItineraryType === "host" ? true:false;

    //For group trips
    if (tripToDelete.isGroupTrip === true) {
      try {
        const response = await axios.delete("http://localhost:8080/GroupTrips/ExitGroupTrip",{data: { i_id: tripToDelete.id, isHost:isHost}, withCredentials: true});
        if (response.data.deleteItinerary) {
          setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
          setShowDeleteConfirm(false);
          setTripToDelete(null);

          setSuccessMsg("Trip deleted successfully!");
          setTimeout(() => setSuccessMsg(""), 1500);
          return;
        }
        else{
          setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
          setShowDeleteConfirm(false);
          setTripToDelete(null);

          setSuccessMsg("Public group trip exited successfully!");
          setTimeout(() => setSuccessMsg(""), 1500);
          return;
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Delete failed (server error).");
        setShowDeleteConfirm(false);
      }
    }

    //Use shared_itinerary backend
    else{
      try {
        const response = await axios.delete("http://localhost:8080/Itinerary/DeleteItinerary",{data: { i_id: tripToDelete.id, isHost:isHost}, withCredentials: true});
        if (response.data.deleteItinerary) {
          setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
          setShowDeleteConfirm(false);
          setTripToDelete(null);

          setSuccessMsg("Trip deleted successfully!");
          setTimeout(() => setSuccessMsg(""), 1500);
          return;
        }
        else{
          setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
          setShowDeleteConfirm(false);
          setTripToDelete(null);

          setSuccessMsg("Private group trip exited successfully!");
          setTimeout(() => setSuccessMsg(""), 1500);
          return;
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Delete failed (server error).");
        setShowDeleteConfirm(false);
      }
    }
  };

  const updateTripCollaborators = (tripId, collaborators) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, collaborators } : trip
      )
    );
  };

  useEffect(() => {
    const handleUpdateCollaborators = (event) => {
      const { tripId, collaborators } = event.detail;
      updateTripCollaborators(tripId, collaborators);
    };

    window.addEventListener("updateCollaborators", handleUpdateCollaborators);
    return () => window.removeEventListener("updateCollaborators", handleUpdateCollaborators);
  }, []);

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

    const matchMemberType =
      filterMemberType === "All" ||
      (filterMemberType === "Host" && t.userItineraryType === "host") ||
      (filterMemberType === "Collaborator" && t.userItineraryType !== "host");

    return matchSearch && matchType && matchStatus && matchMemberType;
  });

  return (
    <div className="mytrips-page">
      <h1 className="title">My Trips</h1>

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

              {usertype === "premium" && <div className="filter-section">
                <label className="filter-title">Member Type</label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterMemberType === "All"}
                    onChange={() => setFilterMemberType("All")}
                  />
                  All
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterMemberType === "Host"}
                    onChange={() => setFilterMemberType("Host")}
                  />
                  Host
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterMemberType === "Collaborator"}
                    onChange={() => setFilterMemberType("Collaborator")}
                  />
                  Collaborator
                </label>
              </div>}
            </div>
          )}
        </div>

        <button
          className="add-trip-btn"
          onClick={openAddModal}
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
                    {trip.isGroupTrip ? "Group" : "Private"}
                  </span>}
                  {usertype === "premium" && <span 
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: trip.isGroupTrip ? "#fff" : "#333",
                      backgroundColor: trip.userItineraryType === "host" ? "#FF6B6B" : "#4ECDC4"
                    }}
                  >
                    {trip.userItineraryType === "host" ? "Host" : "Collaborator"}
                  </span>}
                </div>

                {usertype === "premium" && trip.isGroupTrip && (
                  <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                    Members: {trip.currentMembers}/{trip.maxCapacity}
                  </p>
                )}

                {usertype === "premium" && !trip.isGroupTrip && trip.collaborators && (
                  <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                    Collaborators: {trip.collaborators}/{trip.maxCapacity}
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

                {!trip.isGroupTrip && (
                  <button 
                    className="edit-btn"
                    onClick={() => openEditModal(trip)}
                  >
                    Edit
                  </button>
                )}

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

      {showAddTripModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">{isEditingTrip ? "Edit Trip" : "Trip Details"}</h2>

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
                  onChange={(e) => {
                    setNewDestination(e.target.value);
                    setShowLocSearch(false);
                  }}
                />
              </div>
              { showLocSearch && (
                <div className="form-input-search">
                  {searchResult.map(res => (
                    <div key={res.placeid} className="form-input-search-res" onClick={() => updateFormBasedOnLoc(res)}>
                      {res.name}
                    </div>
                  ))}
                </div>
              )}
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
                {isEditingTrip ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <h2 className="modal-title">
              {(tripToDelete?.isGroupTrip || tripToDelete?.userItineraryType === "visitor") ? "Exit Group Trip" : "Confirm Delete"}
            </h2>

            <p>
              {(tripToDelete?.isGroupTrip || tripToDelete?.userItineraryType === "visitor")
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
                {(tripToDelete?.isGroupTrip || tripToDelete?.userItineraryType === "visitor") ? "Exit" : "Delete"}
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