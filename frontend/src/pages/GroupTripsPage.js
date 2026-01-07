import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom"; // ✅ ADDED
import "../styles/GroupTrip.css";

function GroupTripsPage() {

  //Shared state from Routes.js
  const { myTrips, joinTrip, exitTrip } = useOutletContext();

  //Dummy data--> groups with member count
  const [groupTrips, setGroupTrips] = useState([
    {
      id: 1,
      owner: "JohnWick123",
      title: "Egypt Sightseeing Tour",
      date: "22 Jan 2026 – 31 Jan 2026",
      capacity: 5, //Max capacity - capped at 5
      currentMembers: 1, //Current members in the trip
      description:
        "Explore the wonders of Egypt including iconic pyramids and indulge in countless delicacies.",
      joinedByYou: false,
    },
    {
      id: 2,
      owner: "MileyCyrus",
      title: "Majestic Maldives",
      date: "13 Dec 2025 – 29 Dec 2025",
      capacity: 5, //Max capacity --> capped at 5 for now
      currentMembers: 2, //Current members in the trip
      description:
        "Perfect getaway from the city. Rest, relax, and enjoy the beautiful beaches in Maldives.",
      joinedByYou: false,
    },
    {
      id: 3,
      owner: "DylanWang",
      title: "Italy Adventures!",
      date: "1 Feb 2026 – 20 Feb 2026",
      capacity: 5, //Max capacity--> capped at 5 for now
      currentMembers: 5, //Current members in the trip (full)
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

  //Modal state
  const [showModal, setShowModal] = useState(false);

  //form state (dummy)
  const [tripName, setTripName] = useState("");
  const [pax, setPax] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  //Join handler
  const handleJoin = (trip) => {
    //Check if trip is full
    if (trip.currentMembers >= trip.capacity) {
      alert("This trip is full!");
      return;
    }

    setGroupTrips((prev) =>
      prev.map((t) =>
        t.id === trip.id 
          ? { ...t, joinedByYou: true, currentMembers: t.currentMembers + 1 }
          : t
      )
    );

    //Pass trip to parent
    joinTrip(trip);
  };

  //Exit handler
  const handleExit = (tripId) => {
    const confirmExit = window.confirm(
      "Are you sure you want to exit this trip?"
    );
    if (!confirmExit) return;

    //Update local state-->decrease member count
    setGroupTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, joinedByYou: false, currentMembers: Math.max(0, trip.currentMembers - 1) }
          : trip
      )
    );

    exitTrip(tripId);
  };

  //Upload handler
  const handleUpload = () => {
    if (!tripName || !pax || !startDate || !endDate) {
      alert("Please fill in all required fields");
      return;
    }

    //Cap pax at 5 max
    const maxCapacity = Math.min(parseInt(pax) || 5, 5);

    const newTrip = {
      id: Date.now(),
      owner: "You",
      title: tripName,
      date: `${startDate} – ${endDate}`,
      capacity: maxCapacity, //Capped at 5
      currentMembers: 1, //Creator is automatically a member
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
                {/*Member counter - showing current/max members*/}
                <p><strong>Members:</strong> {trip.currentMembers}/{trip.capacity}</p>
                <p className="trip-desc">{trip.description}</p>
              </div>

              {/*Join or exit group trips*/}
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
                    disabled={trip.currentMembers >= trip.capacity} //Disable if full
                    style={{
                      opacity: trip.currentMembers >= trip.capacity ? 0.5 : 1,
                      cursor: trip.currentMembers >= trip.capacity ? "not-allowed" : "pointer"
                    }}
                  >
                    {trip.currentMembers >= trip.capacity ? "Full" : "Join"}
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
                <label>No. of pax (Max 5)</label>
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
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label>End Date</label>
                <input
                  type="date"
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