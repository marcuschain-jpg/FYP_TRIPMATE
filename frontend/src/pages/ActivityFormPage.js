import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import InitMaps from "../components/InitMaps";
import useMapData from "../hooks/FetchMapData";
import "../styles/Itinerary.css";
import axios from 'axios';

//Ensures that activities created by each user are only visible by that user
/*
function getTripKey() {
  const loggedStr = localStorage.getItem("loggedInUser");
  if (loggedStr) {
    try {
      const user = JSON.parse(loggedStr);
      const uniqueId = user.id || user.email;
      if (uniqueId) {
        return `trips_${uniqueId}`;
      }
    } catch (e) {}
  }
  return "trips_guest";
}*/

function ActivityFormPage() {
  const { tripId, mode, index } = useParams();
  const navigate = useNavigate();
  const mapData = useMapData();

  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  //Form fields
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [media, setMedia] = useState([]); //Newly uploaded files
  const [existingMedia, setExistingMedia] = useState([]); //Already-saved media for this activity
  const [originalMediaIds, setOriginalMediaIds] = useState([]); //For delete-sync
  const [firstLoad, setFirstLoad] = useState(true);
  const [searchResult, setSearchResult] = useState([]); // store search results from api, drop down bar

  //Start point checkbox
  const [isStartPoint, setIsStartPoint] = useState(false);
  const [defaultStart, setDefaultStart] = useState(false);

  // Track if user manually toggled checkbox
  const [startPointTouched, setStartPointTouched] = useState(false);

  const [originalDate, setOriginalDate] = useState("");

  const editing = mode === "edit";

  //Load trip & existing activity if editing
  /*useEffect(() => {
    const tripKey = getTripKey();
    const saved = JSON.parse(localStorage.getItem(tripKey) || "[]");
    setTrips(saved);

    const foundTrip = saved.find((t) => t.id === Number(tripId));
    setTrip(foundTrip || null);

    if (foundTrip && editing) {
      const act = (foundTrip.activities || [])[Number(index)];

      if (act) {
        setName(act.name || "");
        setLocationName(act.location || "");
        setAddress(act.address || "");
        setDate(act.date || "");
        setOriginalDate(act.date || "");
        setExistingMedia(act.media || []);
        setOriginalMediaIds((act.media || []).map((m) => m.id));
        setIsStartPoint(!!act.isStartPoint);

        // checkbox not manually touched yet
        setStartPointTouched(false);
      }
    }
  }, [tripId, mode, index, editing]);*/

  useEffect(() => {
    if (editing)
    {
      axios.get("http://localhost:8080/Itinerary/GetActivityToEdit", {params:{a_id: index}})
      .then(response => {
        renderLoadActivity(response.data);
        setLoading(false);
    })
    }
  }, []);

  const renderLoadActivity = (a) => {
    console.log(a);
    setName(a[0].activity_name);
    setLocationName(a[0].activity_location);
    setAddress(a[0].activity_address);
    setDate(a[0].activity_date);
    setIsStartPoint(Number(a[0].activity_order === 0));
    setDefaultStart(Number(a[0].activity_order === 0));
    
  };

  //Auto-check if only one activity on that date (excluding self when editing)
  useEffect(() => {
    if (!trip || !date) return;

    const activitiesSameDate = (trip.activities || []).filter(
      (a, idx) => a.date === date && (!editing || idx !== Number(index))
    );

    if (activitiesSameDate.length === 0) {
      setIsStartPoint(true);
    }
  }, [date, trip, editing, index]);

  useEffect(() => {
    if (!trip || !editing) return;
    if (!originalDate) return;
    if (!date) return;

    //Date unchanged → keep current checkbox value
    if (date === originalDate) return;

    //User manually chose → respect it return;

    //If moving to a day that already has activities, default unchecked
    const otherActsOnNewDate = (trip.activities || []).filter(
      (a, idx) => idx !== Number(index) && a.date === date
    );

    if (otherActsOnNewDate.length === 0) {
      //First activity for that day
      setIsStartPoint(true);
    } else {
      //Day already has activities (and likely has start point) → don't steal start point
      setIsStartPoint(false);
    }
  }, [date, originalDate, startPointTouched, trip, editing, index]);

  
  useEffect(() => {
    if(!locationName) return;
    if(firstLoad) 
      {
        setFirstLoad(false);
        return;
      }
    const locTimer = setTimeout(async() => {
      console.log("Send to backend", locationName);
      await axios.post("http://localhost:8080/Itinerary/LocSearch", {input:locationName})
      .then(res=>{
        renderLoadSearchResult(res.data);
        
      })
    }, 2000);

    //open selection modal below loc textbox
    //trigger once click, dont run use effect again, until another type
    return () => {
      clearTimeout(locTimer);
    };
  }, [locationName])

  const renderLoadSearchResult = (res) => {
    const mapResults = res.map(t => ({
      placeid: t.id,
      name: t.name,
      address: t.address,
      lat: t.lat,
      lng: t.lng,
    }));

    setSearchResult(mapResults);
  };

  //if (!trip && editing) return <p>Trip not found.</p>;
  if (loading && editing) return <p>Loading..</p>

  //Save activity
  const handleSave = async() => {
    //Convert newly uploaded files from device to media objects using object URLs
    const newMediaObjects =
      media.length > 0
        ? Array.from(media).map((file) => ({
            id: Date.now() + Math.random(),
            name: name || "Activity Media",
            type: file.type,
            url: URL.createObjectURL(file),
          }))
        : [];

    //List of media for specific activity
    /*const finalMedia = [...existingMedia, ...newMediaObjects];

    const newActivity = {
      name,
      location: locationName,
      address,
      date,
      media: finalMedia,
      isStartPoint, // ⭐ saved value
    };

    const updatedTrips = trips.map((t) => {
      //if (t.id !== trip.id) return t;

      //const let updatedActivities = [...(t.activities || [])];

      //Insert or replace activity
      if (editing) {
        updatedActivities[Number(index)] = newActivity;

      } else {
        updatedActivities.push(newActivity);
      }

      //Only 1 start point per date if user checked this activity
      if (isStartPoint) {
        updatedActivities = updatedActivities.map((a, idx) => {
          if (a.date === date) {
            const isCurrent =
              (editing && idx === Number(index)) ||
              (!editing && idx === updatedActivities.length - 1);

            return { ...a, isStartPoint: isCurrent };
          }
          return a;
        });
      }

      //Ensure EACH DAY has a start point:
      //If tjeres only 1 activity--> auto assined start point 
      const byDate = {};
      updatedActivities.forEach((a) => {
        if (!byDate[a.date]) byDate[a.date] = [];
        byDate[a.date].push(a);
      });

      Object.keys(byDate).forEach((day) => {
        const dayActs = byDate[day];
        const hasStart = dayActs.some((a) => a.isStartPoint);

        if (!hasStart && dayActs.length > 0) {
          const firstAct = dayActs[0];

          updatedActivities = updatedActivities.map((a) => {
            if (
              a.date === day &&
              a.name === firstAct.name &&
              a.location === firstAct.location &&
              a.address === firstAct.address
            ) {
              return { ...a, isStartPoint: true };
            }
            return a;
          });
        }
      });

      //Syncing media--> sync any edits to media in timeline, media page, and activity
      //Remove any media that the user removed from this activity
      const removedIds = originalMediaIds.filter(
        (oldId) => !finalMedia.some((m) => m.id === oldId)
      );

      const filteredGallery = (t.mediaGallery || []).filter(
        (m) => !removedIds.includes(m.id)
      );

      //Add newly uploaded media into gallery--> updates media and timeline can see them
      const updatedMediaGallery = [...filteredGallery, ...newMediaObjects];

      return {
        ...t,
        activities: updatedActivities,
        mediaGallery: updatedMediaGallery,
      };
    });*/

    /*const tripKey = getTripKey();
    localStorage.setItem(tripKey, JSON.stringify(updatedTrips));
    setTrips(updatedTrips);

    const updatedTrip = updatedTrips.find((t) => t.id === trip.id);
    setTrip(updatedTrip || null);*/

    //Backend create and edit start here! >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    if(editing) //edit
    {
      axios.patch("http://localhost:8080/Itinerary/EditActivity", {a_id:index, aName: name, aLoc: locationName, aAddress: address, aDate: date, aOrder: isStartPoint}) //trip id is activityid here
      .then(response => {
        if(response.data === true) alert("Succesfully edit activity!")
      });
    }
    else //create
    {
      await axios.post("http://localhost:8080/Itinerary/CreateActivity", {aName: name, aLoc: locationName, aAddress: address, aDate: date, i_id: tripId, aOrder: isStartPoint})
      .then(res=>{
        if(res.data === true) alert("Successfully created activity!")
      })
    }


    navigate(`/mytrips/trip/itinerary/${tripId}/${date}`);
  };

  

  return (
    <div className="activity-form-page">
      <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h1 className="form-title">
        {editing ? "Edit Activity" : "Add Activity"}
      </h1>

      <div className="activity-form-layout">
        <div className="activity-left-box">
          {/*Activty and start point*/}
          <div className="event-name-row">
            <label className="form-label">Event Name</label>
            <div className="start-point-checkbox">
              <input
                type="checkbox"
                checked={isStartPoint}
                onChange={(e) => {
                  setIsStartPoint(e.target.checked);
                  setStartPointTouched(true); 
                }}
                disabled={editing && defaultStart}
              />
              <span>This is my starting point</span>
            </div>
          </div>

          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="form-label">Location</label>
          <input
            className="form-input"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />

          <label className="form-label">Address</label>
          <input
            className="form-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/*Preview of any existing media in activity form*/}
          {existingMedia.length > 0 && (
            <div className="media-preview-container">
              {existingMedia.map((m, i) => (
                <div key={i} className="media-preview-item">
                  {m.url ? (
                    <img src={m.url} className="media-preview-img" />
                  ) : (
                    <div className="media-file-icon">📄 {m.name}</div>
                  )}
                  <button
                    className="media-delete-existing"
                    onClick={() =>
                      setExistingMedia(
                        existingMedia.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/*Upload new media*/}
          <label className="upload-media-btn">
            <span className="upload-media-icon">📁</span>
            Upload Media
            <input
              type="file"
              multiple
              onChange={(e) => setMedia([...e.target.files])}
            />
          </label>

          {/*Preview new media uploaded in activity form*/}
          {media.length > 0 && (
            <div className="media-preview-container">
              {media.map((file, i) => (
                <div key={i} className="media-preview-item">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      className="media-preview-img"
                      alt=""
                    />
                  ) : (
                    <div className="media-file-icon">📄 {file.name}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="form-button-row">
            <button
              className="cancel-btn"
              onClick={() => navigate(`/mytrips/trip/itinerary/${tripId}`)}
            >
              Cancel
            </button>

            <button className="save-btn" onClick={handleSave}>
              {editing ? "Save Changes" : "Create Activity"}
            </button>
          </div>
        </div>

        <div className="activity-right-map">
          {mapData ? (
            <InitMaps mapData={mapData} />
          ) : (
            <p className="map-loading-text">Loading map...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityFormPage;
