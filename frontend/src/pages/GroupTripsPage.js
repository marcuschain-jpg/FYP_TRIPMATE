import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom"; // ✅ ADDED
import "../styles/GroupTrip.css";

function GroupTripsPage() {

  //Shared state from Routes.js
  const { myTrips, joinTrip, exitTrip } = useOutletContext();

  //Dummy data
  const [groupTrips, setGroupTrips] = useState([
    {
      id: 1,
      owner: "JohnWick123",
      title: "Egypt Sightseeing Tour",
      date: "22 Jan 2026 – 31 Jan 2026",
      capacity: "8 Pax",
      description:
        "Explore the wonders of Egypt including iconic pyramids and indulge in countless delicacies.",
      joinedByYou: false,
    },
    {
      id: 2,
      owner: "MileyCyrus",
      title: "Majestic Maldives",
      date: "13 Dec 2025 – 29 Dec 2025",
      capacity: "4 Pax",
      description:
        "Perfect getaway from the city. Rest, relax, and enjoy the beautiful beaches in Maldives.",
      joinedByYou: false,
    },
    {
      id: 3,
      owner: "DylanWang",
      title: "Italy Adventures!",
      date: "1 Feb 2026 – 20 Feb 2026",
      capacity: "10 Pax",
      description:
        "Explore local hotspots in Italy, perfect for those traveling to Europe for the first time.",
      joinedByYou: false,
    },
  ]);

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

  //Mpdal state
  const [showModal, setShowModal] = useState(false);

  //form state (dummy)
  const [tripName, setTripName] = useState("");
  const [pax, setPax] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  //joine handler
  const handleJoin = (trip) => {
    // local UI update (your original logic)
    setGroupTrips((prev) =>
      prev.map((t) =>
        t.id === trip.id ? { ...t, joinedByYou: true } : t
      )
    );

    
    joinTrip(trip);
  };

  //Exit handler
  const handleExit = (tripId) => {
    const confirmExit = window.confirm(
      "Are you sure you want to exit this trip?"
    );
    if (!confirmExit) return;

   
    setGroupTrips((prev) =>
      prev.filter((trip) => trip.id !== tripId)
    );

    exitTrip(tripId);
  };

  //Upload handler
  const handleUpload = () => {
    if (!tripName || !pax || !startDate || !endDate) {
      alert("Please fill in all required fields");
      return;
    }

    const newTrip = {
      id: Date.now(),
      owner: "You",
      title: tripName,
      date: `${startDate} – ${endDate}`,
      capacity: `${pax} Pax`,
      description,
      joinedByYou: true,
    };

    setGroupTrips([newTrip, ...groupTrips]);

    joinTrip(newTrip);

    setTripName("");
    setPax("");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setShowModal(false);
  };

  return (
    <div className="group-trips-page">
      <div className="group-trips-container">

        {/*Search & create*/}
        <div className="group-trips-header">
          <input
            className="group-search"
            placeholder="Search Trip Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            className="create-trip-btn"
            onClick={() => setShowModal(true)}
          >
            Create New Trip +
          </button>
        </div>

        {/*Trip cards*/}
        {groupTrips
          .filter((trip) =>
            trip.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((trip) => (
            <div key={trip.id} className="group-trip-card">
              <div className="group-trip-left">
                <div className="trip-owner-row">
                  <div className="owner-avatar">
                    {trip.owner.charAt(0)}
                  </div>
                  <p className="trip-owner">{trip.owner}</p>
                </div>

                <h3>{trip.title}</h3>
                <p><strong>Date:</strong> {trip.date}</p>
                <p><strong>Capacity:</strong> {trip.capacity}</p>
                <p className="trip-desc">{trip.description}</p>
              </div>

              {/*Join or exit group tips*/}
              <div className="group-trip-right">
                {trip.joinedByYou ? (
                  <button
                    className="exit-btn"
                    onClick={() => handleExit(trip.id)}
                  >
                    Exit
                  </button>
                ) : (
                  <button
                    className="join-btn-text"
                    onClick={() => handleJoin(trip)}
                  >
                    Join
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
                <label>Trip Name</label>
                <input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label>No. of pax</label>
                <input
                  value={pax}
                  onChange={(e) => setPax(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-row">
              <div className="modal-field">
                <label>Start Date</label>
                <input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label>End Date</label>
                <input
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-field full-width">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default GroupTripsPage;
