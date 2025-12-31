import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Media.css";
import axios from "axios";

function MediaPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [activityMedia, setActivityMedia] = useState({}); // Store media by activity ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //Filter state
  const [selectedDate, setSelectedDate] = useState("");
  const [allDates, setAllDates] = useState([]);
  const [uploadingActivityId, setUploadingActivityId] = useState(null);

  //Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editActivityId, setEditActivityId] = useState(null);

  //Load trip and activities 
  useEffect(() => {
    loadTripData();
  }, [tripId]);

  //Filter activities when date changes
  useEffect(() => {
    filterActivitiesByDate();
  }, [activities, selectedDate]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      setError(null);

      //Fetch all activities for this trip 9created by user in itinerary)
      const activitiesRes = await axios.get(
        "http://localhost:8080/Itinerary/GetAllActivities",
        { params: { i_id: tripId }, withCredentials: true }
      );

      if (activitiesRes.data && Array.isArray(activitiesRes.data)) {
        //Set trip info from first activity
        if (activitiesRes.data.length > 0) {
          setTrip({
            id: tripId,
            name: activitiesRes.data[0].itinerary_name,
            start: activitiesRes.data[0].start_date,
            end: activitiesRes.data[0].end_date,
          });
        }

        //Map activities 
        const mappedActivities = activitiesRes.data.map((a) => ({
          id: a.activity_id,
          name: a.activity_name,
          date: a.activity_date,
          location: a.activity_location,
          address: a.activity_address,
        }));

        setActivities(mappedActivities);

        //Extract unique dates and sort
        const uniqueDates = Array.from(
          new Set(mappedActivities.map((a) => a.date))
        ).sort();
        setAllDates(uniqueDates);

        //Set default to first date
        if (uniqueDates.length > 0 && !selectedDate) {
          setSelectedDate(uniqueDates[0]);
        }

        //Load media for each activity
        await loadMediaForActivities(mappedActivities);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading trip data:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        navigate("/login");
      } else {
        setError("Failed to load activities");
      }
      setLoading(false);
    }
  };

  //Load media for all activities
  const loadMediaForActivities = async (activitiesList) => {
    const mediaMap = {};

    for (const activity of activitiesList) {
      try {
        const mediaRes = await axios.get(
          "http://localhost:8080/Itinerary/GetActivityMedia",
          { params: { a_id: activity.id }, withCredentials: true }
        );

        //Store media array for this activity (could be empty)
        mediaMap[activity.id] = Array.isArray(mediaRes.data) ? mediaRes.data : [];
      } catch (err) {
        console.log(`No media found for activity ${activity.id}`);
        //Dummy data 
        mediaMap[activity.id] = [
          {
            media_id: `dummy-${activity.id}-1`,
            media_name: "Sample Photo 1",
            media_url: "https://via.placeholder.com/400x300?text=Photo+1"
          },
          {
            media_id: `dummy-${activity.id}-2`,
            media_name: "Sample Photo 2",
            media_url: "https://via.placeholder.com/400x300?text=Photo+2"
          }
        ];
      }
    }

    setActivityMedia(mediaMap);
  };

  //Filter activities by selected date
  const filterActivitiesByDate = () => {
    if (!selectedDate) {
      setFilteredActivities(activities);
    } else {
      const filtered = activities.filter((a) => a.date === selectedDate);
      setFilteredActivities(filtered);
    }
  };

  //Upload media to specific activity
  const handleUpload = async (e, activityId) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingActivityId(activityId);

    //Convert files to data URLs and store in state
    const newMedia = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const mediaItem = {
          media_id: `temp-${Date.now()}-${i}`,
          media_name: file.name,
          media_url: event.target.result, // Data URL
        };
        
        newMedia.push(mediaItem);
        
        //Update state once all files are loaded
        if (newMedia.length === files.length) {
          setActivityMedia((prev) => ({
            ...prev,
            [activityId]: [...(prev[activityId] || []), ...newMedia],
          }));
          alert("Media uploaded successfully!");
          setUploadingActivityId(null);
          e.target.value = "";
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  //Open edit modal
  const openEditModal = (item, activityId) => {
    setEditItem(item);
    setEditActivityId(activityId);
    setEditTitle(item.media_name || item.photo_title || "");
    setShowEditModal(true);
  };

  //Save edit changes
  const saveEditChanges = async () => {
    if (!editTitle.trim()) {
      alert("Title cannot be empty");
      return;
    }

    //Update in state
    setActivityMedia((prev) => ({
      ...prev,
      [editActivityId]: prev[editActivityId].map((m) =>
        (m.media_id === editItem.media_id || m.media_id === editItem.photo_id)
          ? { ...m, media_name: editTitle }
          : m
      ),
    }));

    alert("Media updated successfully!");
    setShowEditModal(false);
  };

  //Delete media
  const handleDelete = async (mediaId, activityId) => {
    if (!window.confirm("Delete this media?")) return;

    setActivityMedia((prev) => ({
      ...prev,
      [activityId]: prev[activityId].filter((m) => m.media_id !== mediaId),
    }));

    alert("Media deleted successfully!");
  };

  if (loading) return <p className="loading-text">Loading media...</p>;

  if (error) return <p className="loading-text">{error}</p>;

  return (
    <div className="media-container">
      <button
        className="back-btn"
        onClick={() => navigate(`/mytrips/trip/${tripId}`)}
      >
        ← Back
      </button>

      <div className="media-header">
        <h1 className="media-title">{trip?.name || "Trip"} — Media</h1>
        <p className="media-date-range">
          {trip ? `${trip.start} – ${trip.end}` : ""}
        </p>
      </div>

      {/*Date filter--> only shows dates that contain acitivities created by users*/}
      {allDates.length > 0 && (
        <div className="media-filter-bar">
          <label className="filter-label">Filter by date:</label>
          <select
            className="filter-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value="">All Dates</option>
            {allDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </div>
      )}

      {/*Activities and media grid*/}
      <div className="activities-container">
        {filteredActivities.length === 0 ? (
          <div className="no-activities">
            <p>No activities for the selected date. Create one in the Itinerary page first!</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="activity-card">
              <div className="activity-header">
                <h2 className="activity-name">{activity.name}</h2>
                <p className="activity-location">
                  <strong>{activity.location}</strong>
                  {activity.address && ` • ${activity.address}`}
                </p>
                <p className="activity-date">
                  {new Date(activity.date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>

              {/*Add media button*/}
              <label className="upload-btn">
                <span className="upload-icon">➕</span>
                <span>Add Media</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleUpload(e, activity.id)}
                  disabled={uploadingActivityId === activity.id}
                />
              </label>

              {/*Display uploaded media*/}
              <div className="media-grid">
                {activityMedia[activity.id] && activityMedia[activity.id].length > 0 ? (
                  activityMedia[activity.id].map((media) => (
                    <div key={media.media_id || media.photo_id} className="media-item">
                      <div className="media-image-container">
                        {media.media_url || media.photo_url ? (
                          <img
                            src={media.media_url || media.photo_url}
                            alt={media.media_name || media.photo_title}
                            className="media-image"
                          />
                        ) : (
                          <div className="media-placeholder">📄</div>
                        )}
                      </div>
                      
                      <div className="media-info">
                        <p className="media-title">{media.media_name || media.photo_title}</p>
                        <div className="media-actions">
                          <button
                            className="edit-btn"
                            onClick={() => openEditModal(media, activity.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(media.media_id || media.photo_id, activity.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-media">No media yet. Upload to get started!</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/*Edit media modal*/}
      {showEditModal && editItem && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {(editItem.media_url || editItem.photo_url) && (
              <img src={editItem.media_url || editItem.photo_url} className="modal-image" />
            )}

            <div className="modal-content">
              <h3 className="modal-title">Edit Title</h3>
              <input
                className="modal-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter media title"
              />

              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="save-btn"
                  onClick={saveEditChanges}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaPage;