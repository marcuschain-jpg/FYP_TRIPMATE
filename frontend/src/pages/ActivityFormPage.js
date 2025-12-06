import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import InitMaps from "../components/InitMaps";
import useMapData from "../hooks/FetchMapData";
import "../styles/Itinerary.css";

function ActivityFormPage() {
  const { tripId, mode, index } = useParams(); 
  const navigate = useNavigate();
  const mapData = useMapData();

  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);

  //Form fields
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [media, setMedia] = useState([]); // newly uploaded files
  const [existingMedia, setExistingMedia] = useState([]); // already-saved media for this activity
  const [originalMediaIds, setOriginalMediaIds] = useState([]); // for delete-sync

  const editing = mode === "edit";

  //Load trip + existing activity if editing
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("trips") || "[]");
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
        setExistingMedia(act.media || []);
        setOriginalMediaIds((act.media || []).map((m) => m.id));
      }
    }
  }, [tripId, mode, index, editing]);

  if (!trip) return <p>Trip not found.</p>;

  //Save activity 
  const handleSave = () => {
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
    const finalMedia = [...existingMedia, ...newMediaObjects];

    const newActivity = {
      name,
      location: locationName,
      address,
      date,
      media: finalMedia,
    };

    const updatedTrips = trips.map((t) => {
      if (t.id !== trip.id) return t;

      const existingActivities = t.activities || [];

      //Insert or replace activity
      let updatedActivities = [...existingActivities];
      if (editing) {
        updatedActivities[Number(index)] = newActivity;
      } else {
        updatedActivities.push(newActivity);
      }

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
    });

    localStorage.setItem("trips", JSON.stringify(updatedTrips));
    setTrips(updatedTrips);
    const updatedTrip = updatedTrips.find((t) => t.id === trip.id);
    setTrip(updatedTrip || null);

    navigate(`/mytrips/trip/${tripId}/itinerary`);
  };

  return (
    <div className="activity-form-page">
      <button
        className="back-btn"
        onClick={() => navigate(`/mytrips/trip/${tripId}/itinerary`)}
      >
        ← Back
      </button>

      <h1 className="form-title">
        {editing ? "Edit Activity" : "Add Activity"}
      </h1>

      <div className="activity-form-layout">
        <div className="activity-left-box">
          <label className="form-label">Event Name</label>
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
              onClick={() =>
                navigate(`/mytrips/trip/${tripId}/itinerary`)
              }
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
