import React, { useState } from "react";
import "../styles/GroupTrip.css";

function GroupTripsPage() {
  // ================= DUMMY GROUP TRIPS DATA =================
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

  // ================= SEARCH STATE =================
  const [searchTerm, setSearchTerm] = useState("");

  // ================= MODAL STATE =================
  const [showModal, setShowModal] = useState(false);

  // ================= FORM STATE (DUMMY) =================
  const [tripName, setTripName] = useState("");
  const [pax, setPax] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  // ================= JOIN HANDLER =================
  const handleJoin = (tripId) => {
    setGroupTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, joinedByYou: true }
          : trip
      )
    );
  };

  // ================= EXIT HANDLER =================
  const handleExit = (tripId) => {
    const confirmExit = window.confirm(
      "Are you sure you want to exit this trip?"
    );
    if (!confirmExit) return;

    // remove trip from Join page
    setGroupTrips((prev) =>
      prev.filter((trip) => trip.id !== tripId)
    );
  };

  // ================= UPLOAD HANDLER =================
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
      joinedByYou: true, // creator auto-joined
    };

    setGroupTrips([newTrip, ...groupTrips]);

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

        {/* ================= SEARCH + CREATE ================= */}
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

        {/* ================= TRIP CARDS ================= */}
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

              {/* ================= JOIN / EXIT BUTTON ================= */}
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
                    onClick={() => handleJoin(trip.id)}
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* ================= CREATE TRIP MODAL ================= */}
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
                  placeholder="Enter Trip name"
                />
              </div>

              <div className="modal-field">
                <label>No. of pax</label>
                <input
                  value={pax}
                  onChange={(e) => setPax(e.target.value)}
                  placeholder="Enter no. of pax"
                />
              </div>
            </div>

            <div className="modal-row">
              <div className="modal-field">
                <label>Start Date</label>
                <input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Enter Start Date"
                />
              </div>

              <div className="modal-field">
                <label>End Date</label>
                <input
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Enter End Date"
                />
              </div>
            </div>

            <div className="modal-field full-width">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter Description"
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
