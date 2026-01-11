import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom"; // ✅ ADDED
import "../styles/GroupTrip.css";
import axios from "axios";

function GroupTripsPage() {

  //Shared state from Routes.js
  const { myTrips, joinTrip, exitTrip } = useOutletContext();
  const navigate = useNavigate();

  //Groups with member count
  const [groupTrips, setGroupTrips] = useState([]);
  const [loading, setLoading] = useState(true);

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

  //Load all group trips
  useEffect(() => {
    const getAllGroupTrips = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8080/GroupTrips/GetGroupTrips",
          { withCredentials: true }
        );
        renderGroupTrips(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getAllGroupTrips();
  }, []);

  const renderGroupTrips = (res) => {
    const result = res.map((item) => ({
      id: item.itinerary_id,
      owner: item.owner,
      title: item.title,
      date: `${item.start_date} - ${item.end_date}`,
      capacity: item.capacity,
      currentMembers: item.num_ppl,
      description: item.description,
      joinedByYou: item.joinedByYou,
      location: item.location,
      isHost: item.isHost,
    }));

    setGroupTrips(result);
    setLoading(false);
  };

  //Join handler
  const handleJoin = async (trip) => {

    //Check if trip is full
    if (trip.currentMembers >= trip.capacity) {
      alert("This trip is full!");
      return;
    }

    const optimisticTrip = {
      ...trip,
      joinedByYou: true,
      currentMembers: trip.currentMembers + 1,
      isHost: false,
    };

    setGroupTrips((prev) =>
      prev.map((t) => (t.id === trip.id ? optimisticTrip : t))
    );

    //Update my trips immediately
    joinTrip(optimisticTrip);

    //Backend syncing
    try {
      await axios.patch(
        "http://localhost:8080/GroupTrips/JoinGroupTrip",
        { i_id: trip.id },
        { withCredentials: true }
      );
    } catch (err) {
      console.warn("Backend join failed, UI kept:", err);
    }
  };

  //Exit handler
  const handleExit = async (trip) => {
    if (!window.confirm("Are you sure you want to exit this trip?")) return;

    const tripId = trip.id;

    setGroupTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? { ...t, joinedByYou: false, currentMembers: t.currentMembers - 1 }
          : t
      )
    );

    exitTrip(tripId);

    //Backend sync
    try {
      await axios.delete(
        "http://localhost:8080/GroupTrips/ExitGroupTrip",
        {
          data: { i_id: tripId, isHost: trip.isHost },
          withCredentials: true,
        }
      );
    } catch (err) {
      console.warn("Backend exit failed, UI kept:", err);
    }
  };

  return (
    <div className="group-trips-page">
      <div className="group-trips-container">

        {loading && <p>Loading..</p>}

        <div className="group-trips-header">
          <input
            className="group-search"
            placeholder="Search Trip Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {!loading &&
          groupTrips
            .filter((trip) =>
              (trip.title ?? "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
            .map((trip) => (
              <div key={trip.id} className="group-trip-card">
                <div className="group-trip-left">
                  <h3>{trip.title}</h3>
                  <p><strong>Location:</strong> {trip.location}</p>
                  <p><strong>Date:</strong> {trip.date}</p>
                  <p><strong>Members:</strong> {trip.currentMembers}/{trip.capacity}</p>
                  <p>{trip.description}</p>
                </div>

                <div className="group-trip-right">
                  {trip.joinedByYou ? (
                    <button className="exit-btn" onClick={() => handleExit(trip)}>
                      Exit
                    </button>
                  ) : (
                    <button className="join-btn-text" onClick={() => handleJoin(trip)}>
                      Join
                    </button>
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

export default GroupTripsPage;
