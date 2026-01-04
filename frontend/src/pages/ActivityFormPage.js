import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import InitMaps from "../components/InitMaps";
import useMapData from "../hooks/FetchMapData";
import "../styles/Itinerary.css";
import axios from 'axios';

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
  const [placeid, setPlaceID] = useState("");
  const [longitude, setLongitude] = useState(0);
  const [latitude, setLatitude] = useState(0);
  const [media, setMedia] = useState([]); //Newly uploaded files
  const [existingMedia, setExistingMedia] = useState([]); //Already-saved media for this activity
  const [originalMediaIds, setOriginalMediaIds] = useState([]); //For delete-sync
  const [firstLoad, setFirstLoad] = useState(true);
  const [searchResult, setSearchResult] = useState([]); //store search results from api, drop down bar
  const [mapCenterChange, setMapCenterChange] = useState(null); // store center coord for maps
  const [activityCoords, setActivityCoords] = useState([]); // store coords for maps
  //setMapData(useMapData()) // get API key & set default coordinates to mark on map

  //Search bar modal pop out
  const [showLocSearch, setShowLocSearch] = useState(false);

  //Start point checkbox
  const [isStartPoint, setIsStartPoint] = useState(false);
  const [defaultStart, setDefaultStart] = useState(false);

  //Track if user manually toggled checkbox
  const [startPointTouched, setStartPointTouched] = useState(false);

  const [originalDate, setOriginalDate] = useState("");

  const editing = mode === "edit";

  useEffect(() => {
    if (editing) 
    {
      const loadEditActivity = async() => {
        await axios.get("http://localhost:8080/Itinerary/GetActivityToEdit", {params:{a_id: index}, withCredentials:true})
        .then(response => {
          renderLoadActivity(response.data);
          setLoading(false);
        })
        .catch(err => {
          if(err.response.status === 401 || 403){
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }
        });
      };
      loadEditActivity();
    }
    else{ //create page--> still need validate
      axios.post("http://localhost:8080/GetRoleForUser", {}, {withCredentials:true})
      .then(res => {
        setLoading(false);
      })
      .catch(err => {
        if(err.response.status === 401 || 403){
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }
      });
    }
  }, []);

  const renderLoadActivity = (a) => {
    console.log(a);

    //Render basic activity details for display
    setName(a[0].activity_name);
    setLocationName(a[0].activity_location);
    setAddress(a[0].activity_address);
    setDate(a[0].activity_date);
    setPlaceID(a[0].gmaps_placeid)
    setIsStartPoint(Number(a[0].activity_order === 0));
    setDefaultStart(Number(a[0].activity_order === 0));
    setOriginalDate(a[0].activity_date);
    setLongitude(parseFloat(a[0].longitude));
    setLatitude(parseFloat(a[0].latitude));

    //Render coords for maps
    setMapCenterChange({lng:parseFloat(a[0].longitude), lat:parseFloat(a[0].latitude)});
    setActivityCoords([{
      id: index, 
      coords:
      {lng:parseFloat(a[0].longitude), lat:parseFloat(a[0].latitude)}
    }]);

    //Render existing media for an activity
    if(a[0].photo_id !== null){
    setExistingMedia(a.map(m => ({
      id: m.photo_id,
      name: m.photo_title,
      url: m.photo_url
    })));
    };
  };

  //Auto-check if only one activity on that date (excluding self when editing)
  /*useEffect(() => {
    if (!trip || !date) return;
    if (startPointTouched) return; 

    const activitiesSameDate = (trip.activities || []).filter(
      (a, idx) => a.date === date && (!editing || idx !== Number(index))
    );

    if (activitiesSameDate.length === 0) {
      //Only activity on this date
      setIsStartPoint(true);
    } else {
      //There are other activities on this date
      setIsStartPoint(false);
    }
  }, [date, trip, editing, index, startPointTouched]);

  useEffect(() => {
    if (!trip || !editing) return;
    if (!originalDate) return;
    if (!date) return;
    if (startPointTouched) return; // User manually chose → respect it

    //Date unchanged → keep current checkbox value
    if (date === originalDate) return;

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
  }, [date, originalDate, trip, editing, index, startPointTouched]);*/

  
  useEffect(() => {
    if(!locationName) return;
    if(firstLoad) //When first load page dont search for anything
      {
        setFirstLoad(false);
        return;
      }

      const locTimer = setTimeout(async() => {
      console.log("Send to backend", locationName);
      await axios.post("http://localhost:8080/Itinerary/LocSearch", {input:locationName}, {withCredentials:true})
      .then(res=>{
        renderLoadSearchResult(res.data);
      })
      .catch(err => {console.log(err);});

    }, 1000);

    return () => {
      clearTimeout(locTimer);
    };
  }, [locationName])

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
      address: t.address,
      lat: t.lat,
      lng: t.lng,
    }));

    setSearchResult(mapResults);
  };

  if (loading && editing) return <p>Loading..</p>

  const handlePhotoInput = (e) => {
    const files = e.target.files
    setMedia([...e.target.files]);
  }

  const handlePhotoDelete = async(m) => {
    await axios.delete("http://localhost:8080/Itinerary/DeleteActivityPhoto", {data:{photo_id:m.id, rawUrl:m.url}, withCredentials:true})
    .then(response => {
      if(response.data === true) 
      {
        setExistingMedia(existingMedia.filter((media) => media.id !== m.id))
        console.log("deleted!")
      }
    });
  }

  //Save activity
  const handleSave = async() => {
    //Convert newly uploaded files from device to media objects using object URLs
    const formData = new FormData();

    if(media){
      for(let i=0;i<media.length;i++)
    {
      formData.append("media", media[i])
    }
    }
    
    if(editing) //edit
    {
      formData.append("a_id", index);
      formData.append("i_id", tripId);
      formData.append("aName", name);
      formData.append("aLoc", locationName);
      formData.append("aAddress", address);
      formData.append("aDate", date);
      formData.append("aOrder", isStartPoint);
      formData.append("aPlaceID", placeid);
      formData.append("lng", longitude);
      formData.append("lat", latitude);

      await axios.patch("http://localhost:8080/Itinerary/EditActivity",
        formData,
        {headers:{ "Content-Type": "multipart/form-data" }, withCredentials:true}) 
      .then(response => {
        if(response.data === true) alert("Succesfully edit activity!")
      }); 
    }
    else //create
    {
      formData.append("aName", name);
      formData.append("aLoc", locationName);
      formData.append("aAddress", address);
      formData.append("aDate", date);
      formData.append("i_id", tripId);
      formData.append("aOrder", isStartPoint);
      formData.append("aPlaceID", placeid);
      formData.append("lng", longitude);
      formData.append("lat", latitude);

      await axios.post("http://localhost:8080/Itinerary/CreateActivity",
        formData,
        {withCredentials:true})
      .then(res=>{
        if(res.data === true) alert("Successfully created activity!")
      })
    }


    navigate(`/mytrips/trip/itinerary/${tripId}/${date}`);
  };

  const updateFormBasedOnLoc = async(res) => {
    //Update textbox and placeid
    setLocationName(res.name);
    setAddress(res.address);
    setPlaceID(res.placeid);
    setLongitude(res.lng);
    setLatitude(res.lat);
    setMapCenterChange({lng:res.lng, lat:res.lat});
    setActivityCoords([{
      id: index, 
      coords:
      {lng:res.lng, lat:res.lat}
    }]);

    setFirstLoad(true);
    setShowLocSearch(false);
  };

  

  return (
    <div className="activity-form-page">
      <button
        className="back-btn"
        onClick={() => navigate(`/mytrips/trip/itinerary/${tripId}/default`)}
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
            onChange={(e) => 
              {
                setLocationName(e.target.value)
                setShowLocSearch(false)
              }}
          />
          { showLocSearch && (
            <div className="form-input-search">
              {searchResult.map(res => (
                <div key={res.placeid} className="form-input-search-res" onClick={() => updateFormBasedOnLoc(res)}>
                  {res.name} - {res.address}
                </div>
              ))}
            </div>
          )}

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
              {existingMedia.map((m) => (
                <div key={m.id} className="media-preview-item">
                  {m.url ? (
                    <img src={m.url} className="media-preview-img" />
                  ) : (
                    <div className="media-file-icon">📄 {m.name}</div>
                  )}
                  <button
                    className="media-delete-existing"
                    onClick={() => handlePhotoDelete(m)}
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
              onChange={handlePhotoInput}
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
              onClick={() => navigate(`/mytrips/trip/itinerary/${tripId}/default`)}
            >
              Cancel
            </button>

            <button className="save-btn" onClick={handleSave}>
              {editing ? "Save Changes" : "Create Activity"}
            </button>
          </div>
        </div>

        <div className="activity-right-map">
          {mapData ? (<InitMaps DefaultMapData={mapData} centerChange={mapCenterChange} activityCoords={activityCoords}/>) : (<p className="map-loading-text">Loading map...</p>)}
        </div>
      </div>
    </div>
  );
}

export default ActivityFormPage;