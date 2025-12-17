import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Itinerary.css";

//Ensures that media uploaded by each user are only visible by that user
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

function MediaPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);
  const [gallery, setGallery] = useState([
    {
      id: 1,
      url:"http://localhost:8080/images/me_beach.jpg",
      name: "me on a beach",
      date: 2025-12-12
    },
    {
      id: 2,
      url:"http://localhost:8080/images/image.jpg",
      name: "resevoir picture 2",
      date: 12/12/2025
    },
    {
      id: 1,
      url:"http://localhost:8080/images/download.jpg",
      name: "resevoir picture 3",
      date: 12/12/2025
    }
  ]);

  //Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");

  //Load trip & media from local storage
  /*useEffect(() => {
    const tripKey = getTripKey();
    const saved = JSON.parse(localStorage.getItem(tripKey) || "[]");
    setTrips(saved);

    const foundTrip = saved.find((t) => t.id === Number(tripId));
    if (foundTrip) {
      setTrip(foundTrip);
      setGallery(foundTrip.mediaGallery || []);
    }
  }, [tripId]);*/

  //if (!trip) return <p>Trip not found.</p>;

  //Update media gallery for the trip
  const updateTripMedia = (updatedGallery) => {
    //const tripKey = getTripKey();

    const updatedTrips = trips.map((t) =>
      t.id === trip.id ? { ...t, mediaGallery: updatedGallery } : t
    );

    //localStorage.setItem(tripKey, JSON.stringify(updatedTrips));
    setTrips(updatedTrips);

    const updatedTrip = updatedTrips.find((t) => t.id === trip.id);
    setTrip(updatedTrip || null);
    setGallery(updatedTrip?.mediaGallery || []);
  };

  //Upload new media 
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newMedia = {
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      date: "" //Optional date field
    };

    updateTripMedia([...gallery, newMedia]);
  };

  
  const openEditModal = (item) => {
    setEditItem(item);
    setEditTitle(item.name);
    setEditDate(item.date || "");
    setShowEditModal(true);
  };

  //Edit media title--> sync name across activities, media page, timeline page 
  const saveEditChanges = () => {
    //const tripKey = getTripKey();

    const updatedTrips = trips.map((t) => {
      if (t.id !== trip.id) return t;

      const updatedGallery = (t.mediaGallery || []).map((m) =>
        m.id === editItem.id ? { ...m, name: editTitle, date: editDate } : m
      );

      const updatedActivities = (t.activities || []).map((act) => ({
        ...act,
        media: (act.media || []).map((m) =>
          m.id === editItem.id ? { ...m, name: editTitle, date: editDate } : m
        ),
      }));

      return {
        ...t,
        mediaGallery: updatedGallery,
        activities: updatedActivities,
      };
    });

    //localStorage.setItem(tripKey, JSON.stringify(updatedTrips));
    setTrips(updatedTrips);

    const updatedTrip = updatedTrips.find((t) => t.id === trip.id);
    setTrip(updatedTrip || null);
    setGallery(updatedTrip?.mediaGallery || []);

    setShowEditModal(false);
  };

  //Delete media--> sync across activities, media page, timeline page 
  const handleDelete = (item) => {
    if (!window.confirm("Delete this media everywhere?")) return;

    //const tripKey = getTripKey();

    const updatedTrips = trips.map((t) => {
      if (t.id !== trip.id) return t;

      const updatedGallery = (t.mediaGallery || []).filter(
        (m) => m.id !== item.id
      );

      const updatedActivities = (t.activities || []).map((act) => ({
        ...act,
        media: (act.media || []).filter((m) => m.id !== item.id),
      }));

      return {
        ...t,
        mediaGallery: updatedGallery,
        activities: updatedActivities,
      };
    });

    //localStorage.setItem(tripKey, JSON.stringify(updatedTrips));
    setTrips(updatedTrips);
    const updatedTrip = updatedTrips.find((t) => t.id === trip.id);
    setTrip(updatedTrip || null);
    setGallery(updatedTrip?.mediaGallery || []);
  };

  return (
    <div className="media-page">
      <button
        className="back-btn"
        onClick={() => navigate(`/mytrips/trip/${tripId}`)}
      >
        ← Back
      </button>

      <h1 className="media-title">To Singapore! — Media</h1>

      <div className="media-layout">
        <div className="media-sidebar">
          <label className="media-upload-btn">
            <span className="media-upload-icon">+</span>
            Upload Media
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleUpload}
            />
          </label>
        </div>

        {/*Media Gallery*/}
        <div className="media-gallery-wrapper">
          {gallery.length === 0 ? (
            <p className="media-gallery-empty">
              No media yet. Upload something or add media from activities!
            </p>
          ) : (
            <div className="media-grid">
              {gallery.map((item) => (
                <div key={item.id} className="media-card">
                  {item.url ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="media-image"
                    />
                  ) : (
                    <div className="media-file-fallback">
                      📄 {item.name}
                    </div>
                  )}

                  <div className="media-card-body">
                    <p className="media-title-text">{item.name}</p>

                    {item.date && (
                      <p className="media-date-text">
                        <strong>Date:</strong> {item.date}
                      </p>
                    )}

                    <div className="media-card-actions">
                      <button
                        className="media-edit-btn"
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </button>

                      <button
                        className="media-delete-btn"
                        onClick={() => handleDelete(item)}
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

      {/*Edit media title & add date field --> will be auto geotagged later on*/}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="media-edit-modal">

            <img src={editItem.url} className="media-edit-preview" />

            <div className="media-edit-fields">
              <label>Title</label>
              <input
                className="media-edit-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />

              <label>Date</label>
              <input
                type="date"
                className="media-edit-input"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />

              <div className="media-edit-buttons">
                <button
                  className="media-edit-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="media-edit-save"
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
