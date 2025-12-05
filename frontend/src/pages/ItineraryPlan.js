import React, { useState, useEffect } from "react";
import InitMaps from "../components/InitMaps";
import useMapData from "../hooks/FetchMapData";
<<<<<<< HEAD
import "../styles/Itinerary.css";
=======
import '../styles/Itinerary.css';
import Test from "../components/Test";
>>>>>>> 6ee9ae9f2ccb3befeb3df76af45a3bbffdb6f534

function ItineraryPlan() {

  //ROOT TRIP STATE
  //Load trips from localStorage on first render,
  //Save trips to localStorage whenever they change.
  
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem("trips");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedTrip, setSelectedTrip] = useState(null); 
  const [viewMode, setViewMode] = useState("details");   

  useEffect(() => {
    localStorage.setItem("trips", JSON.stringify(trips));
  }, [trips]);

  const mapData = useMapData(); 

  //NEW TRIP FORM STATE--> creating new trip 
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [invalidFields, setInvalidFields] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");//search trip by naeme         

  //ACTIVITY FORM STATE--> add or edit activities in itinerary
  const [activityName, setActivityName] = useState("");
  const [activityLocation, setActivityLocation] = useState("");
  const [activityAddress, setActivityAddress] = useState("");
  const [activityDate, setActivityDate] = useState("");

  const [activityMedia, setActivityMedia] = useState([]);   
  const [existingActivityMedia, setExistingActivityMedia] = useState([]); 
  const [editingActivityIndex, setEditingActivityIndex] = useState(null); 

  const [activityIsStartPoint, setActivityIsStartPoint] = useState(false); 
  const [isStartPointLocked, setIsStartPointLocked] = useState(false);     

  const [selectedDateFilter, setSelectedDateFilter] = useState(""); //Filter itinerary plans by date (dropdown bar)

  //Delete activity modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDeleteIndex, setActivityToDeleteIndex] = useState(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");


  //MEDIA PAGE STATE--> upload media into "Media" page and name it 
  const [showMediaTitleModal, setShowMediaTitleModal] = useState(false);
  const [tempUploadedFile, setTempUploadedFile] = useState(null); 
  const [tempMediaTitle, setTempMediaTitle] = useState("");

  const [showEditMediaModal, setShowEditMediaModal] = useState(false);
  const [mediaBeingEdited, setMediaBeingEdited] = useState(null);
  const [editedMediaTitle, setEditedMediaTitle] = useState("");

  //Delete media global modal
  const [showDeleteMediaModal, setShowDeleteMediaModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [mediaDeleteSuccessMsg, setMediaDeleteSuccessMsg] = useState("");


  //HANDLE START POINT CHECKBOX
  const handleToggleStartPoint = () => {
    if (isStartPointLocked) return;
    setActivityIsStartPoint((prev) => !prev);
  };
  
  useEffect(() => {
    if (!selectedTrip) return;

    const dates = Array.from(
      new Set((selectedTrip.activities || []).map((a) => a.date))
    ).sort();

    //No activities--> clear filter
    if (dates.length === 0) {
      if (selectedDateFilter) setSelectedDateFilter("");
      return;
    }

    //If filter invalid OR empty--> default back to first date
    if (!selectedDateFilter || !dates.includes(selectedDateFilter)) {
      setSelectedDateFilter(dates[0]);
    }
  }, [selectedTrip, trips, selectedDateFilter]);


  //Create new trip
  //Validates required fields + stores trip (all fields must be filled in)
  const handleSaveTrip = () => {
    const errors = [];

    if (!newTripName) errors.push("tripName");
    if (!newDestination) errors.push("destination");
    if (!newStart) errors.push("start");
    if (!newEnd) errors.push("end");

    setInvalidFields(errors);

    if (errors.length > 0) {
      setErrorMsg("Please fill in all fields."); //Error message for empty fields
      return;
    }

    const newTrip = {
      id: Date.now(),
      name: newTripName,
      destination: newDestination,
      start: newStart,
      end: newEnd,
      status: "In Progress",
      activities: [],
      mediaGallery: [] 
    };

    setTrips((prev) => [...prev, newTrip]);

    setSuccessMsg("Trip successfully created!");
    setErrorMsg("");
    setInvalidFields([]);

    //Reset form
    setNewTripName("");
    setNewDestination("");
    setNewStart("");
    setNewEnd("");

    //Close modal after 1 sec
    setTimeout(() => setShowAddTripModal(false), 1000);
  };

  //Delete trip
  const deleteTrip = (id) => {
    setTrips(trips.filter((t) => t.id !== id));

    if (selectedTrip && selectedTrip.id === id) {
      setSelectedTrip(null);
      setViewMode("details");
    }
  };

  const filteredTrips = trips.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //Save acivity 
  //Media, start point logic, ordering, updating trip object
  const handleSaveActivity = () => {
    if (!selectedTrip) return;

    //Convert files uploaded from device to new media objects
    const newMediaObjects =
      activityMedia.length > 0
        ? Array.from(activityMedia).map((file) => ({
            id: Date.now() + Math.random(),
            name: activityName || "Activity Media",
            type: file.type,
            url: URL.createObjectURL(file)
          }))
        : [];

    const finalMedia = [...existingActivityMedia, ...newMediaObjects];

    //New activity
    const newActivity = {
      name: activityName,
      location: activityLocation,
      address: activityAddress,
      date: activityDate,
      media: finalMedia,
      isStartPoint: activityIsStartPoint
    };

    //Update correct trip’s activities
    const updatedTrips = trips.map((t) => {
      if (t.id !== selectedTrip.id) return t;

      const existingActivities = t.activities || [];

      //Edit activity
      let updatedActivities =
        editingActivityIndex !== null
          ? existingActivities.map((act, idx) =>
              idx === editingActivityIndex ? newActivity : act
            )
          : [...existingActivities, newActivity];

      //1 startpoint allowed per day 
      if (activityIsStartPoint) {
        updatedActivities = updatedActivities.map((act, idx) => ({
          ...act,
          isStartPoint: idx === (editingActivityIndex ?? updatedActivities.length - 1)
        }));
      }

      //If theres only 1 activity that day--> auto assigned as start point 
      const sameDay = updatedActivities.filter((a) => a.date === activityDate);
      if (sameDay.length === 1) {
        updatedActivities = updatedActivities.map((act) =>
          act.date === activityDate ? { ...act, isStartPoint: true } : act
        );
      }

      //Sort by date then by start point (always appears at the top)
      updatedActivities = updatedActivities.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.isStartPoint) return -1;
        if (b.isStartPoint) return 1;
        return 0;
      });

      return { ...t, activities: updatedActivities };
    });

    setTrips(updatedTrips);
    setSelectedTrip(updatedTrips.find((t) => t.id === selectedTrip.id));

    //Reset form state
    setActivityName("");
    setActivityLocation("");
    setActivityAddress("");
    setActivityDate("");
    setActivityMedia([]);
    setExistingActivityMedia([]);
    setEditingActivityIndex(null);
    setActivityIsStartPoint(false);
    setIsStartPointLocked(false);

    //Redirect back to itinerary view
    setViewMode("itinerary");
  };

  // Activity helpers
  //Start add flow, start edit flow, confirm delete
  const startAddActivity = () => {
    if (!selectedTrip) return;

    //Reset form
    setActivityName("");
    setActivityLocation("");
    setActivityAddress("");
    setActivityDate("");
    setActivityMedia([]);
    setExistingActivityMedia([]);
    setEditingActivityIndex(null);

    //Auto-start-point for first activity of the day--> since theres only 1 activity at that moment
    const activitiesForDay = (selectedTrip.activities || []).filter(
      (a) => a.date === selectedDateFilter
    );

    if (activitiesForDay.length === 0) {
      setActivityIsStartPoint(true);
      setIsStartPointLocked(true);
    } else {
      setActivityIsStartPoint(false);
      setIsStartPointLocked(false);
    }

    setViewMode("activity-form");
  };

  const startEditActivity = (index) => {
    const trip = selectedTrip;
    if (!trip) return;

    const act = trip.activities[index];

    //Prefill form fields
    setActivityName(act.name || "");
    setActivityLocation(act.location || "");
    setActivityAddress(act.address || "");
    setActivityDate(act.date || "");
    setExistingActivityMedia(act.media || []);
    setActivityMedia([]);

    setEditingActivityIndex(index);
    setActivityIsStartPoint(act.isStartPoint || false);

    //Check start-point uodating rules
    const sameDay = trip.activities.filter((a) => a.date === act.date);

    if (sameDay.length === 1) {
      setActivityIsStartPoint(true);
      setIsStartPointLocked(true);
    } else {
      setIsStartPointLocked(act.isStartPoint === true);
    }

    setViewMode("activity-form");
  };

  const openDeleteActivityModal = (index) => {
    setActivityToDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDeleteActivity = () => {
    if (activityToDeleteIndex === null || !selectedTrip) return;

    const updatedTrips = trips.map((t) => {
      if (t.id !== selectedTrip.id) return t;
      return {
        ...t,
        activities: t.activities.filter((_, i) => i !== activityToDeleteIndex)
      };
    });

    setTrips(updatedTrips);
    setSelectedTrip(updatedTrips.find((t) => t.id === selectedTrip.id));

    setShowDeleteModal(false);
    setActivityToDeleteIndex(null);

    setDeleteSuccessMsg("Successfully deleted!");
    setTimeout(() => setDeleteSuccessMsg(""), 1500);
  };

  
  //Media page functions
  //Upload media, save media, edit title, delete media
  const handleUploadMediaToTrip = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setTempUploadedFile({
      file,
      previewUrl,
      type: file.type,
      name: file.name
    });

    setTempMediaTitle(file.name);
    setShowMediaTitleModal(true);

    e.target.value = "";
  };

  const saveNewMediaToTrip = () => {
    if (!tempUploadedFile || !selectedTrip) return;

    const newItem = {
      id: Date.now() + Math.random(),
      name: tempMediaTitle || tempUploadedFile.name,
      type: tempUploadedFile.type,
      url: tempUploadedFile.previewUrl
    };

    const updatedTrips = trips.map((t) => {
      if (t.id !== selectedTrip.id) return t;

      return {
        ...t,
        mediaGallery: [...(t.mediaGallery || []), newItem]
      };
    });

    setTrips(updatedTrips);
    setSelectedTrip(updatedTrips.find((t) => t.id === selectedTrip.id));

    setShowMediaTitleModal(false);
    setTempUploadedFile(null);
    setTempMediaTitle("");
  };

  const saveEditedMediaTitle = () => {
    if (!mediaBeingEdited || !selectedTrip) return;

    const updatedTrips = trips.map((t) => {
      if (t.id !== selectedTrip.id) return t;

      const updatedGallery = (t.mediaGallery || []).map((m) =>
        m.id === mediaBeingEdited.id ? { ...m, name: editedMediaTitle } : m
      );

      return {
        ...t,
        mediaGallery: updatedGallery
      };
    });

    setTrips(updatedTrips);
    setSelectedTrip(updatedTrips.find((t) => t.id === selectedTrip.id));

    setShowEditMediaModal(false);
    setMediaBeingEdited(null);
    setEditedMediaTitle("");
  };

  const confirmDeleteMedia = () => {
    if (!mediaToDelete || !selectedTrip) return;

    const updatedTrips = trips.map((t) => {
      if (t.id !== selectedTrip.id) return t;

      //Delete media from both "media" page and activities infromation
      const updatedGallery = (t.mediaGallery || []).filter(
        (m) => m.id !== mediaToDelete.id
      );

      const updatedActivities = (t.activities || []).map((act) => ({
        ...act,
        media: (act.media || []).filter((m) => m.id !== mediaToDelete.id)
      }));

      return {
        ...t,
        mediaGallery: updatedGallery,
        activities: updatedActivities
      };
    });

    setTrips(updatedTrips);
    setSelectedTrip(updatedTrips.find((t) => t.id === selectedTrip.id));

    setShowDeleteMediaModal(false);
    setMediaToDelete(null);

    setMediaDeleteSuccessMsg("Successfully deleted media!");
    setTimeout(() => setMediaDeleteSuccessMsg(""), 1500);
  };

  //Add media to activity information = media is also added in "media" page
  const buildCombinedMediaForTrip = () => {
    if (!selectedTrip) return [];

    const trip = selectedTrip;

    //Media uploaded from gallery
    const gallery = (trip.mediaGallery || []).map((m) => ({
      ...m,
      activityDate: null,
      activityLocation: trip.destination || ""
    }));

    //Media from each activity
    const fromActivities = (trip.activities || []).flatMap((act) => {
      const base = act.media || [];

      return base.map((m) => {
        if (typeof m === "string") {
          return {
            id: Date.now() + Math.random(),
            name: m,
            type: "unknown",
            url: null,
            activityDate: act.date,
            activityLocation: act.location
          };
        }

        return {
          ...m,
          activityDate: act.date,
          activityLocation: act.location
        };
      });
    });

    return [...gallery, ...fromActivities];
  };

  //Shows "my trips" page when no trip is selected (default)
  if (!selectedTrip) {
    return (
      <div className="mytrips-page">
        <h1 className="title">My Trips</h1>

        {/*Search trip name*/}
        <input
          className="search-bar"
          placeholder="Search Trip Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/*Add trip button*/}
        <button
          className="add-trip-btn"
          onClick={() => {
            setSuccessMsg("");
            setErrorMsg("");
            setInvalidFields([]);
            setShowAddTripModal(true);
          }}
        >
          Add New Trip +
        </button>

        {/*List of trips*/}
        <div className="trip-list">
          {filteredTrips.length === 0 && <p>No trips found.</p>}

          {filteredTrips.map((trip) => (
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
                  onClick={() => {
                    setSelectedTrip(trip);
                    setViewMode("details");
                  }}
                >
                  View
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteTrip(trip.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/*Add Trip Modal/ trip details*/}
        {showAddTripModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2 className="modal-title">Trip Details</h2>

              {errorMsg && <div className="error-msg">{errorMsg}</div>}

              {/*Trip name*/}
              <label>Trip Name</label>
              <input
                className={`modal-input ${
                  invalidFields.includes("tripName") ? "invalid-input" : ""
                }`}
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
              />

              {/*Destination*/}
              <label>Destination City</label>
              <input
                className={`modal-input ${
                  invalidFields.includes("destination") ? "invalid-input" : ""
                }`}
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
              />

              {/*Dates*/}
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

              {/*Action buttons*/}
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

        {/*Success popup message*/}
        {successMsg && <div className="success-popup">{successMsg}</div>}
      </div>
    );
  }

  const trip = selectedTrip;


  //Itinerary activities and map
  if (viewMode === "itinerary") {
    const allActivityDates = Array.from(
      new Set((trip.activities || []).map((a) => a.date))
    ).sort();

    return (
      <div className="itinerary-view">
        <button className="back-btn" onClick={() => setViewMode("details")}>
          ← Back
        </button>

        {/* Trip header */}
        <div className="itinerary-top-row">
          <div>
            <h1>{trip.name}</h1>
            <p className="date-text">
              {trip.start} – {trip.end}
            </p>
          </div>

          <button className="arrange-btn">Arrange</button>
        </div>

        <div className="view-layout">
          {/*List of activities added*/}
          <div className="left-side">
            <h2>Activities</h2>

            {/*Date dropdown--> view activities by date*/}
            {allActivityDates.length > 0 && (
              <div className="date-filter-container">
                <select
                  className="date-filter-dropdown"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                >
                  {allActivityDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/*Title for selected day*/}
            {selectedDateFilter && (
              <h3 className="selected-date-title">
                {new Date(selectedDateFilter).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </h3>
            )}

            {/*Activity cards*/}
            <div className="activities-section">
              {trip.activities
                .filter((act) => act.date === selectedDateFilter)
                .map((act, index) => {
                  const realIndex = trip.activities.indexOf(act);
                  return (
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
                          onClick={() => startEditActivity(realIndex)}
                        >
                          Edit
                        </button>
                        <button
                          className="activity-delete-btn"
                          onClick={() => openDeleteActivityModal(realIndex)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/*Add new activity*/}
            <button className="add-activity-big" onClick={startAddActivity}>
              Add Activity +
            </button>
          </div>

          {/*Map*/}
          <div className="right-side">
            <InitMaps mapData={mapData} />
          </div>
        </div>
<<<<<<< HEAD

        {/*Delete activity modal*/}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2 className="modal-title">Confirm Delete</h2>
              <p>Are you sure you want to delete this activity?</p>

              <div className="modal-actions">
                <button
                  className="modal-cancel"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setActivityToDeleteIndex(null);
                  }}
                >
                  Cancel
                </button>
                <button className="modal-delete" onClick={confirmDeleteActivity}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/*Success popup message*/}
        {deleteSuccessMsg && (
          <div className="success-popup">{deleteSuccessMsg}</div>
        )}
      </div>
    );
  }

  //Activity form
  if (viewMode === "activity-form") {
    return (
      <div className="activity-form-page">
        <button className="back-btn" onClick={() => setViewMode("itinerary")}>
          ← Back
        </button>

        <h1 className="form-title">{trip.name}</h1>
        <p className="form-date">
          {trip.start} – {trip.end}
        </p>

        <div className="activity-form-layout">
          <div className="activity-left-box">
            {/*Title changes between Add vs Edit*/}
            <h2 className="form-section-title">
              {editingActivityIndex !== null
                ? "Edit Activity"
                : "Activity Information"}
            </h2>

            {/*Start point checkbox*/}
            <div className="startpoint-checkbox-row">
              <label className="startpoint-label">
                <input
                  type="checkbox"
                  checked={activityIsStartPoint}
                  onChange={handleToggleStartPoint}
                  disabled={isStartPointLocked}
                />
                This is my starting point
              </label>
            </div>

            {/*Form Fields*/}
            <label className="form-label">Event Name</label>
            <input
              className="form-input"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
            />

            <label className="form-label">Location</label>
            <input
              className="form-input"
              value={activityLocation}
              onChange={(e) => setActivityLocation(e.target.value)}
            />

            <label className="form-label">Address</label>
            <input
              className="form-input"
              value={activityAddress}
              onChange={(e) => setActivityAddress(e.target.value)}
            />

            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
            />

            {/*Existing saved media*/}
            {existingActivityMedia.length > 0 && (
              <div className="media-preview-container">
                {existingActivityMedia.map((file, index) => (
                  <div key={index} className="media-preview-item">
                    {file.url ? (
                      <img src={file.url} className="media-preview-img" />
                    ) : (
                      <div className="media-file-icon">📄 {file.name}</div>
                    )}
                    <button
                      className="media-delete-existing"
                      onClick={() => {
                        const updated = existingActivityMedia.filter(
                          (_, i) => i !== index
                        );
                        setExistingActivityMedia(updated);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/*New media uploads*/}
            <label className="upload-media-btn">
              <span className="upload-media-icon">📁</span>
              <span>Upload Media</span>
              <input
                type="file"
                multiple
                onChange={(e) => setActivityMedia([...e.target.files])}
              />
            </label>

            {/*Preview new media uploads*/}
            {activityMedia.length > 0 && (
              <div className="media-preview-container">
                {activityMedia.map((file, index) => (
                  <div key={index} className="media-preview-item">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="media-preview-img"
                      />
                    ) : (
                      <div className="media-file-icon">📄 {file.name}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/*Save / Cancel buttons*/}
            <div className="form-button-row">
              <button
                className="cancel-btn"
                onClick={() => setViewMode("itinerary")}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveActivity}>
                Save Changes
              </button>
            </div>
          </div>

          {/*Map preview*/}
          <div className="activity-right-map">
            <InitMaps mapData={mapData} />
          </div>
        </div>
      </div>
    );
  }

  // Media page
  if (viewMode === "media") {
    const combinedMedia = buildCombinedMediaForTrip(); // Full media list

    return (
      <div className="media-page">
        <button className="back-btn" onClick={() => setViewMode("details")}>
          ← Back
        </button>

        <h1 className="media-title">{trip.name} – Media</h1>
        <p className="media-date">
          {trip.start} – {trip.end}
        </p>

        <div className="media-layout">
          {/*Upload media button*/}
          <div className="media-sidebar">
            <label className="media-upload-btn">
              <span className="media-upload-icon">＋</span>
              <span>Upload Media</span>
              <input
                type="file"
                multiple={false}
                accept="image/*,video/*"
                onChange={handleUploadMediaToTrip}
              />
            </label>
          </div>

          {/*Media grid*/}
          <div className="media-gallery-wrapper">
            {combinedMedia.length === 0 ? (
              <div className="media-gallery-empty">
                <p>No media yet. Upload from here or from an activity.</p>
              </div>
            ) : (
              <div className="media-grid">
                {combinedMedia.map((item, index) => (
                  <div key={item.id || index} className="media-card">
                    <div className="media-image-wrapper">
                      {item.url && item.type.startsWith("image/") ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="media-image"
                        />
                      ) : (
                        <div className="media-file-fallback">📄 {item.name}</div>
                      )}
                    </div>

                    <div className="media-card-body">
                      <p className="media-address">
                        {item.activityLocation || trip.destination}
                      </p>

                      <p className="media-title-text">{item.name}</p>

                      <div className="media-card-actions">
                        <button
                          className="media-edit-btn"
                          onClick={() => {
                            setMediaBeingEdited(item);
                            setEditedMediaTitle(item.name);
                            setShowEditMediaModal(true);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="media-delete-btn"
                          onClick={() => {
                            setMediaToDelete(item);
                            setShowDeleteMediaModal(true);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/*Add title. name media when uploading from device*/}
        {showMediaTitleModal && (
          <div className="media-modal-overlay">
            <div className="media-modal-box">
              <h2 className="media-modal-title">Title</h2>

              {tempUploadedFile && (
                <img
                  src={tempUploadedFile.previewUrl}
                  alt="preview"
                  className="media-modal-preview"
                />
              )}

              <input
                className="media-modal-input"
                value={tempMediaTitle}
                onChange={(e) => setTempMediaTitle(e.target.value)}
              />

              <div className="media-modal-actions">
                <button
                  className="media-modal-cancel"
                  onClick={() => {
                    setShowMediaTitleModal(false);
                    setTempUploadedFile(null);
                    setTempMediaTitle("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="media-modal-save"
                  onClick={saveNewMediaToTrip}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/*Edit media title*/}
        {showEditMediaModal && (
          <div className="media-modal-overlay">
            <div className="media-modal-box">
              <h2 className="media-modal-title">Edit Title</h2>

              {mediaBeingEdited && mediaBeingEdited.url && (
                <img
                  src={mediaBeingEdited.url}
                  alt="preview"
                  className="media-modal-preview"
                />
              )}

              <input
                className="media-modal-input"
                value={editedMediaTitle}
                onChange={(e) => setEditedMediaTitle(e.target.value)}
              />

              <div className="media-modal-actions">
                <button
                  className="media-modal-cancel"
                  onClick={() => {
                    setShowEditMediaModal(false);
                    setMediaBeingEdited(null);
                    setEditedMediaTitle("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="media-modal-save"
                  onClick={saveEditedMediaTitle}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/*delete media confirmation message*/}
        {showDeleteMediaModal && (
          <div className="media-modal-overlay">
            <div className="media-modal-box">
              <h2 className="media-modal-title">Delete Media</h2>
              <p>Are you sure you want to delete this media?</p>

              <div className="media-modal-actions">
                <button
                  className="media-modal-cancel"
                  onClick={() => {
                    setShowDeleteMediaModal(false);
                    setMediaToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="media-modal-delete"
                  onClick={confirmDeleteMedia}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {mediaDeleteSuccessMsg && (
          <div className="success-popup">{mediaDeleteSuccessMsg}</div>
        )}
      </div>
    );
  }

  
  return (
    <div className="itinerary-page">
      <button className="back-btn" onClick={() => setSelectedTrip(null)}>
        ← Back to My Trips
      </button>

      <h1>{trip.name}</h1>
      <p>
        {trip.start} – {trip.end}
      </p>

      {/*Mark trip as completed--> when "trip is completed" checkbox is ticked*/}
      <label className="completed-label">
        <input
          type="checkbox"
          checked={trip.status === "Completed"}
          onChange={(e) => {
            const updatedTrips = trips.map((t) =>
              t.id === trip.id
                ? {
                    ...t,
                    status: e.target.checked ? "Completed" : "In Progress"
                  }
                : t
            );
            setTrips(updatedTrips);
            setSelectedTrip(updatedTrips.find((t) => t.id === trip.id));
          }}
        />
        Trip Completed
      </label>

          {/*itinerary section*/}
      <div className="section-card">
        <div className="section-content">
          <h2>Itinerary</h2>
          <p>View or Edit itinerary here</p>
          <button className="view-btn" onClick={() => setViewMode("itinerary")}>
            View
          </button>
        </div>
      </div>

      {/*Generate timeline (WIP)*/}
      <div className="section-card">
        <div className="section-content">
          <h2>Timeline</h2>
          <p>Generate or view timeline here</p>
          <button className="view-btn">View</button>
        </div>
      </div>

      {/*Media section*/}
      <div className="section-card">
        <div className="section-content">
          <h2>Media</h2>
          <p>Edit or view media here</p>
          <button className="view-btn" onClick={() => setViewMode("media")}>
            View
          </button>
=======
        <div className="upload-photo">
          <UploadPhoto />
          <Test />
>>>>>>> 6ee9ae9f2ccb3befeb3df76af45a3bbffdb6f534
        </div>
      </div>
    </div>
  );
}

export default ItineraryPlan;
