import React, { useState, useEffect } from "react";
import "../styles/Itinerary.css";
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import Axios from '../hooks/Axios.js';
import ItineraryChat from "../components/ItineraryChat";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation("mytrips");

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

  //For chat
  const[showChat, setShowChat] = useState(false);
  const [activeTripID, setActiveTripID] = useState(0);

  //Load from backend (private trips)
  useEffect(() => {
    const getUserType = async() => {
      try{
        const res = await Axios.post("GetRoleForUser", {}, {withCredentials:true})
        setUsertype(res.data.role)
      }
      catch(err){
        if(err.response){
          if(err.response.status === 401 || err.response.status === 403){
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }
            else if(err.response.status === 500) console.log(err.response.data.message);
        }
        else console.log(err);
      }
    }
    Axios.get("Itinerary/GetAllItineraries", {withCredentials: true})
      .then((response) => {
        renderLoadTrip(response.data);
        setLoading(false);
      })
      .catch((err) => {
        if(err.response){
          if(err.response.status === 401 || err.response.status === 403){
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }
            else if(err.response.status === 500) console.log(err.response.data.message);
        }
        else console.log(err);
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

    setTrips(mapTrips);
  };

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
      await Axios.post("Itinerary/CitySearch", {input:newDestination}, {withCredentials:true})
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
    setFirstLoad(true);
    setShowAddTripModal(true);
  };

  //Create or update trip
  const handleSaveTrip = async () => {
    const missing = [];
    if (!newTripName) missing.push("tripName");
    if (!newDestination) missing.push("destination");
    if (!newStart) missing.push("start");
    if (!newEnd) missing.push("end");
    if (!newFullDest) missing.push("destination");

    setInvalidFields(missing);

    if (missing.length > 0) {
      setErrorMsg(t("mt_errmsg_fields"));
      return;
    }

    try {
      if (isEditingTrip) {
        const response = await Axios.patch(
          `Itinerary/EditItinerary`,
          {
            i_id: editingTripId,
            iName: newTripName,
            iDest: newFullDest,
            start: formatDateForInput(newStart),
            end: formatDateForInput(newEnd),
            type: "Private"
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
          setSuccessMsg(t("mt_succmsg_tripupdate"));

          setNewTripName("");
          setNewDestination("");
          setNewStart("");
          setNewEnd("");
          setErrorMsg("");
          setFirstLoad(true);
          setNewFullDest({});
          setTimeout(() => setShowAddTripModal(false), 300);
        } else {
          setErrorMsg(t("mt_errmsg_update"));
        }
      } else {
        const response = await Axios.post(
          "Itinerary/CreateItinerary",
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
          setSuccessMsg(t("mt_succmsg_tripcreate"));

          setNewTripName("");
          setNewDestination("");
          setNewStart("");
          setNewEnd("");
          setErrorMsg("");
          setNewFullDest({});
          setFirstLoad(true);
          setTimeout(() => setShowAddTripModal(false), 300);
        } else {
          setErrorMsg(t("mt_errmsg_insert"));
        }
      }
    } catch (err) {
      if(err.response){
          if(err.response.status === 401 || err.response.status === 403){
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }
            else if(err.response.status === 500) console.log(err.response.data.message);
        }
        else console.log(err);
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
        const response = await Axios.delete("GroupTrips/ExitGroupTrip",{data: { i_id: tripToDelete.id, isHost:isHost}, withCredentials: true});
        if (response.data.deleteItinerary) {
          setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
          setShowDeleteConfirm(false);
          setTripToDelete(null);

          setSuccessMsg(t("mt_succmsg_tripdelete"));
          setTimeout(() => setSuccessMsg(""), 1500);
          return;
        }
        else{
          setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
          setShowDeleteConfirm(false);
          setTripToDelete(null);

          setSuccessMsg(t("mt_succmsg_tripexit"));
          setTimeout(() => setSuccessMsg(""), 1500);
          return;
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(t("mt_errmsg_delete"));
        setShowDeleteConfirm(false);
      }
    }

    //Use shared_itinerary backend
    else{
      try {
        const response = await Axios.delete("Itinerary/DeleteItinerary",{data: { i_id: tripToDelete.id, isHost:isHost}, withCredentials: true});
        if (response.data.deleteItinerary) {
          setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
          setShowDeleteConfirm(false);
          setTripToDelete(null);

          setSuccessMsg(t("mt_succmsg_delete"));
          setTimeout(() => setSuccessMsg(""), 1500);
          return;
        }
        else{
          setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
          setShowDeleteConfirm(false);
          setTripToDelete(null);

          setSuccessMsg(t("mt_succmsg_tripexitprivate"));
          setTimeout(() => setSuccessMsg(""), 1500);
          return;
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(t("mt_errmsg_delete"));
        setShowDeleteConfirm(false);
      }
    }
  };

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
      <h1 className="title">{t("mt_title")}</h1>

      <div className="top-controls">
        <input
          className="search-bar"
          placeholder={t("mt_searchph")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filter-dropdown-wrapper">
          <button
            className="filter-toggle"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {t("mt_filterdd")} ▾
          </button>

          {showFilters && (
            <div className="filter-panel">
              {usertype === "premium" && <div className="filter-section">
                <label className="filter-title">{t("mt_filter_triptype")}</label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterType === "All"}
                    onChange={() => setFilterType("All")}
                  />
                  {t("mt_filter_ttall")}
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterType === "Private"}
                    onChange={() => setFilterType("Private")}
                  />
                  {t("mt_filter_ttprivate")}
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterType === "Group"}
                    onChange={() => setFilterType("Group")}
                  />
                  {t("mt_filter_ttgroup")}
                </label>
              </div>}

              <div className="filter-section">
                <label className="filter-title">{t("mt_filter_status")}</label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterStatus === "All"}
                    onChange={() => setFilterStatus("All")}
                  />
                  {t("mt_filter_all")}
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterStatus === "Completed"}
                    onChange={() => setFilterStatus("Completed")}
                  />
                  {t("mt_filter_scompleted")}
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterStatus === "In Progress"}
                    onChange={() => setFilterStatus("In Progress")}
                  />
                  {t("mt_filter_sinprogress")}
                </label>
              </div>

              {usertype === "premium" && <div className="filter-section">
                <label className="filter-title">{t("mt_filter_membertype")}</label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterMemberType === "All"}
                    onChange={() => setFilterMemberType("All")}
                  />
                  {t("mt_filter_all")}
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterMemberType === "Host"}
                    onChange={() => setFilterMemberType("Host")}
                  />
                  {t("mt_host")}
                </label>

                <label className="filter-option">
                  <input
                    type="radio"
                    checked={filterMemberType === "Collaborator"}
                    onChange={() => setFilterMemberType("Collaborator")}
                  />
                  {t("mt_collab")}
                </label>
              </div>}
            </div>
          )}
        </div>

        <button
          className="add-trip-btn"
          onClick={openAddModal}
        >
          {t("mt_add_btn")} +
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
                    {trip.isGroupTrip ? t("mt_tag_group") : t("mt_tag_private")}
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
                    {trip.userItineraryType === "host" ? t("mt_host") : t("mt_collab")}
                  </span>}
                </div>

                {usertype === "premium" && trip.isGroupTrip && (
                  <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                    {t("mt_tag_members")}: {trip.currentMembers}/{trip.maxCapacity}
                  </p>
                )}

                {usertype === "premium" && !trip.isGroupTrip && trip.collaborators && (
                  <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                    {t("mt_tag_collabs")}: {trip.collaborators}/{trip.maxCapacity}
                  </p>
                )}

                <div className={`trip-status ${trip.status === true ? "completed" : "inprogress"}`}>
                  {trip.status && t("mt_filter_scompleted")}
                  {!trip.status && t("mt_filter_sinprogress")}
                </div>
              </div>

              <div className="actions">
                {trip.isGroupTrip === true && (
                  <button
                    className="chat-btn"
                    onClick={() => {
                      setShowChat(true);
                      setActiveTripID(trip.id);
                    }}
                  >
                    {t("mt_btn_chat")}
                  </button>
                )}

                <button
                  className="view-btn"
                  onClick={() => navigate(`/mytrips/trip/${trip.id}`)}
                >
                  {t("mt_btn_view")}
                </button>

                {!trip.isGroupTrip && (
                  <button 
                    className="edit-btn"
                    onClick={() => openEditModal(trip)}
                  >
                    {t("mt_btn_edit")}
                  </button>
                )}

                {trip.userItineraryType === "host" && <button className="delete-btn" onClick={() => requestDeleteTrip(trip.id)}>
                  {t("mt_btn_delete")}
                </button>}

                {trip.userItineraryType === "visitor" && <button className="delete-btn" onClick={() => requestDeleteTrip(trip.id)}>
                  {t("mt_btn_exit")}
                </button>}
              </div>
            </div>
          ))}
      </div>

      {showAddTripModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">{isEditingTrip ? t("mt_modal_edittrip") : t("mt_modal_tripdetails")}</h2>

            {errorMsg && <div className="error-msg">{errorMsg}</div>}

            <div className="modal-row">
              <div className="modal-col">
                <label>{t("mt_modal_tripname")}</label>
                <input
                  className={`modal-input ${
                    invalidFields.includes("tripName") ? "invalid-input" : ""
                  }`}
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                />
              </div>

              <div className="modal-col">
                <label>{t("mt_modal_destination")}</label>
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
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label>{t("mt_modal_startdate")}</label>
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
                <label>{t("mt_modal_enddate")}</label>
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
                {t("mt_modal_cancelbtn")}
              </button>

              <button className="modal-save" onClick={handleSaveTrip}>
                {isEditingTrip ? t("mt_modal_updatebtn") : t("mt_modal_savebtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <h2 className="modal-title">
              {(tripToDelete?.isGroupTrip || tripToDelete?.userItineraryType === "visitor") ? t("mt_modal_exitgt_btn") : t("mt_modal_confirmdel_btn")}
            </h2>

            <p>
              {(tripToDelete?.isGroupTrip || tripToDelete?.userItineraryType === "visitor")
                ? t("mt_modal_exitgt")
                : t("mt_modal_confirmdel")}
            </p>

            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t("mt_modal_cancelbtn")}
              </button>

              <button className="modal-delete" onClick={deleteTripConfirmed}>
                {(tripToDelete?.isGroupTrip || tripToDelete?.userItineraryType === "visitor") ? t("mt_btn_exit") : t("mt_btn_delete")}
              </button>
            </div>
          </div>
        </div>
      )}
      {showChat && ( <ItineraryChat onClose={() => {
        setShowChat(false);
        setActiveTripID(0);
        }} i_id={activeTripID}/>)}      

      {successMsg && <div className="success-popup">{successMsg}</div>}
    </div>

  );
}

export default MyTripsPage;