import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom"; // âœ… ADDED
import "../styles/GroupTrip.css";
import axios from 'axios';
import { useTranslation } from "react-i18next";

function GroupTripsPage() {

  const { t } = useTranslation("grouptrips");

  //Shared state from Routes.js
  const { myTrips, joinTrip, exitTrip } = useOutletContext();
  const navigate = useNavigate();

  const [groupTrips, setGroupTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  //Sync join state
  useEffect(() => {
    setGroupTrips((prev) =>
      prev.map((trip) => ({
        ...trip,
        joinedByYou: myTrips.some((t) => t.id === trip.id),
      }))
    );
  }, [myTrips]);

  const [searchTerm, setSearchTerm] = useState("");

  //Modal state
  const [showModal, setShowModal] = useState(false);
  const [showLocSearch, setShowLocSearch] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [searchResult, setSearchResult] = useState([]);
  const [newFullDest, setNewFullDest] = useState({});

  //form state (dummy)
  const [tripName, setTripName] = useState("");
  const [location, setLocation] = useState("");
  const [pax, setPax] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const getAllGroupTrips = async() => {
      try{
        const res = await axios.get("http://localhost:8080/GroupTrips/GetGroupTrips", {withCredentials:true})
        await renderGroupTrips(res.data);
      }
      catch(err){
        if(err.response)
        {
          if(err.response.status === 401 || err.response.status === 403){ // Auth error
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }
          else if(err.response.status === 500){ // DB/Backend error
            console.log(err.response.data.message);
          }
        }
          else console.log(err); // General error
        }
    };
    getAllGroupTrips();
  },[])

  useEffect(() => {
    if(!location) return;
    if(firstLoad) //When first load page dont search for anything
      {
        setFirstLoad(false);
        return;
      }

      const locTimer = setTimeout(async() => {
      console.log("Send to backend", location);
      await axios.post("http://localhost:8080/Itinerary/CitySearch", {input:location}, {withCredentials:true})
      .then(res=>{
        renderLoadSearchResult(res.data);
      })
      .catch(err => {console.log(err);});

    }, 1000);

    return () => {
      clearTimeout(locTimer);
    };
  }, [location])

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
    setLocation(res.name);

    setFirstLoad(true);
    setShowLocSearch(false);
  };

  const renderGroupTrips = async(res) =>{
    console.log('data: ', res);
    const result = res.map(item => ({
      id: item.itinerary_id,
      owner: item.owner,
      title: item.title,
      date: `${item.start_date} - ${item.end_date}`,
      capacity: item.capacity, // Default 5 but will change on user input
      currentMembers: item.num_ppl, // Current members in the trip
      description: item.description,
      joinedByYou: item.joinedByYou,
      location: item.location,
      isHost: item.isHost,
    }));

    setGroupTrips(result);
    setLoading(false);
  };

  //Join handler
  const handleJoin = async(trip) => {
    //Check if trip is full
    if (trip.currentMembers >= trip.capacity) {
      alert("This trip is full!");
      return;
    }

    try{
      let newCurrMembers = 0;
      const res = await axios.patch("http://localhost:8080/GroupTrips/JoinGroupTrip", {i_id:trip.id}, {withCredentials:true})
      newCurrMembers = res.data // updated number of ppl from db
      setGroupTrips((prev) => prev.map((t) =>
        t.id === trip.id ? { ...t, joinedByYou: true, currentMembers: newCurrMembers, isHost: false}: t
        )
      );
    }
    catch(err){
      if(err.response)
        {
          if(err.response.status === 401 || err.response.status === 403){ // Auth error
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }
          else if(err.response.status === 500){ // DB/Backend error
            console.log(err.response.data.message);
          }
        }
          else console.log(err); // General error
    }

    //Pass trip to parent
    //joinTrip(trip);
  };

  //Exit handler
  const handleExit = async(trip) => {
    const confirmExit = window.confirm(
      t("gt_message_exit")
    );
    if (!confirmExit) return;
    const tripId = trip.id;

    try{
      const res = await axios.delete("http://localhost:8080/GroupTrips/ExitGroupTrip", {data:{i_id:tripId, isHost:trip.isHost}, withCredentials:true})
      if(res.data.deleteItinerary){
        setGroupTrips(prev => prev.filter(item => item.id !== tripId))
      }
      else{
        //Update local state-->decrease member count
        setGroupTrips((prev) =>
          prev.map((trip) =>
            trip.id === tripId
              ? { ...trip, joinedByYou: false, currentMembers: Math.max(0, trip.currentMembers - 1) }
              : trip
          )
        );   
      }
    }
    catch(err){
      if(err.response)
        {
          if(err.response.status === 401 || err.response.status === 403){ // Auth error
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }
          else if(err.response.status === 500){ // DB/Backend error
            console.log(err.response.data.message);
          }
        }
          else console.log(err); // General error
    }
    //exitTrip(tripId);
  };

  //Upload handler
  const handleUpload = async() => {
    if (!tripName || !location || !pax || !startDate || !endDate) {
      alert(t("gt_errmsg_fields"));
      return;
    }

    //Cap pax at 5 max
    const maxCapacity = Math.min(parseInt(pax) || 5, 5);

    try{
      const res = await axios.post("http://localhost:8080/GroupTrips/CreateGroupTrip",
      {iName:tripName, iDest: newFullDest, start: startDate, end: endDate, num_ppl:maxCapacity, description:description},{withCredentials:true});
        if(res.data){
          const newTrip = {
          id: res.data.itinerary_id, 
          owner: "You",
          location: location,
          title: tripName,
          date: `${startDate} â€“ ${endDate}`,
          capacity: maxCapacity, //Capped at 5
          currentMembers: 1, //Creator is automatically a member
          description,
          joinedByYou: true,
          isHost: true,
        };

        setGroupTrips(prev => [...prev, newTrip]);

        //joinTrip(newTrip);
      }
    }
    catch(err){
      if(err.response)
      {
        if(err.response.status === 401 || err.response.status === 403){
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }
        else if(err.response.status === 500){
          console.log(err.response.data.message);
        }
      }
      else console.log(err);
    }

    setTripName("");
    setLocation("");
    setPax("");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setShowModal(false);
  };

  return (
    <div className="group-trips-page">
      <div className="group-trips-container">
        {loading && <p>Loading..</p>}

        {/*Search & create*/}
        <div className="group-trips-header">
          <input
            className="group-search"
            placeholder={t("gt_search_trip_name")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            className="create-trip-btn"
            onClick={() => setShowModal(true)}
          >
            {t("gt_create_new_trip_btn")} +
          </button>
        </div>

        {/*Trip cards*/}
        {!loading && groupTrips
          .filter((trip) =>
            (trip.title ?? "").toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((trip) => (
            <div key={trip.id} className="group-trip-card">
              <div className="group-trip-left">
                <div className="trip-owner-row">
                  <div className="owner-avatar">
                    {(trip.owner ?? "").charAt(0)}
                  </div>
                  <p className="trip-owner">{trip.owner}</p>
                </div>

                <h3>{trip.title}</h3>
                <p><strong>Location:</strong> {trip.location}</p>
                <p><strong>Date:</strong> {trip.date}</p>
                {/*Member counter - showing current/max members*/}
                <p><strong>Members:</strong> {trip.currentMembers}/{trip.capacity}</p>
                <p className="trip-desc">{trip.description}</p>
              </div>

              {/*Join or exit group trips*/}
              <div className="group-trip-right">
                {trip.joinedByYou ? (
                  <button
                    className="exit-btn"
                    onClick={() => handleExit(trip)}
                  >
                    {t("gt_exit_btn")}
                  </button>
                ) : (
                  <button
                    className="join-btn-text"
                    onClick={() => handleJoin(trip)}
                    disabled={trip.currentMembers >= trip.capacity} //Disable if full
                    style={{
                      opacity: trip.currentMembers >= trip.capacity ? 0.5 : 1,
                      cursor: trip.currentMembers >= trip.capacity ? "not-allowed" : "pointer"
                    }}
                  >
                    {trip.currentMembers >= trip.capacity ? "Full" : t("gt_join_btn")}
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Create New Group Trip</h2>

            <div className="modal-row">
              <div className="modal-field">
                <label>{t("gt_modal_trip_name")}</label>
                <input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label>{t("gt_modal_no_of_pax")}</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={pax}
                  onChange={(e) => {
                    //Cap at 5
                    const value = Math.min(parseInt(e.target.value) || 0, 5);
                    setPax(value);
                  }}
                />
              </div>
            </div>

            <div className="modal-row">
              <div className="modal-field">
                <label>{t("gt_modal_start_date")}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label>{t("gt_modal_end_date")}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-row">
              <div className="modal-field">
                <label>{t("gt_modal_location")}</label>
                <input
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    setShowLocSearch(false);
                  }}
                />
              </div>
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

            <div className="modal-field full-width">
              <label>{t("gt_modal_description")}</label>
              <textarea
                value={description}
                onChange={(e) =>  setDescription(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="upload-btn" onClick={handleUpload}>
                Upload
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                {t("gt_modal_cancel_btn")}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default GroupTripsPage;
