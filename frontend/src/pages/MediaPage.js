import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Itinerary.css";

function MediaPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);
  const [gallery, setGallery] = useState([]);

  //Load trip & media from local storage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("trips") || "[]");
    setTrips(saved);

    const foundTrip = saved.find((t) => t.id === Number(tripId));
    if (foundTrip) {
      setTrip(foundTrip);
      setGallery(foundTrip.mediaGallery || []);
    }
  }, [tripId]);

  if (!trip) return <p>Trip not found.</p>;

 
  //Update media gallery for the trip
  const updateTripMedia = (updatedGallery) => {
    const updatedTrips = trips.map((t) =>
      t.id === trip.id ? { ...t, mediaGallery: updatedGallery } : t
    );

    localStorage.setItem("trips", JSON.stringify(updatedTrips));
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
    };

    updateTripMedia([...gallery, newMedia]);
  };

  //Edit media title--> sync name across activities, media page, timeline page 
  const handleEdit = (item) => {
    const newTitle = prompt("Enter new title:", item.name);
    if (!newTitle) return;

    const updatedTrips = trips.map((t) => {
      if (t.id !== trip.id) return t;

      const updatedGallery = (t.mediaGallery || []).map((m) =>
        m.id === item.id ? { ...m, name: newTitle } : m
      );

      const updatedActivities = (t.activities || []).map((act) => ({
        ...act,
        media: (act.media || []).map((m) =>
          m.id === item.id ? { ...m, name: newTitle } : m
        ),
      }));

      return {
        ...t,
        mediaGallery: updatedGallery,
        activities: updatedActivities,
      };
    });

    localStorage.setItem("trips", JSON.stringify(updatedTrips));
    setTrips(updatedTrips);
    const updatedTrip = updatedTrips.find((t) => t.id === trip.id);
    setTrip(updatedTrip || null);
    setGallery(updatedTrip?.mediaGallery || []);
  };

  //Delete media--> sync across activities, media page, timeline page 
  const handleDelete = (item) => {
    if (!window.confirm("Delete this media everywhere?")) return;

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

    localStorage.setItem("trips", JSON.stringify(updatedTrips));
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

      <h1 className="media-title">{trip.name} — Media</h1>

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

                    <div className="media-card-actions">
                      <button
                        className="media-edit-btn"
                        onClick={() => handleEdit(item)}
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
    </div>
  );
}

export default MediaPage;
