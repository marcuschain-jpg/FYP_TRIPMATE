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
    try{
      let newCurrMembers = 0;
      const res = await axios.patch("http://localhost:8080/GroupTrips/JoinGroupTrip", {i_id:trip.id}, {withCredentials:true})
      newCurrMembers = res.data // updated number of ppl from db
      setGroupTrips((prev) => prev.map((t) =>
        t.id === trip.id ? { ...t, joinedByYou: true, currentMembers: newCurrMembers, isHost: false}: t
        )
      );
    }
    catch(err){
      if(err.response)
        {
          if(err.response.status === 401 || err.response.status === 403){ // Auth error
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }
          else if(err.response.status === 500){ // DB/Backend error
            console.log(err.response.data.message);
          }
        }
          else console.log(err); // General error
    }

    //Pass trip to parent
    //joinTrip(trip);
  };

    setGroupTrips((prev) =>
      prev.map((t) => (t.id === trip.id ? optimisticTrip : t))
    );

    //Update my trips immediately
    //joinTrip(optimisticTrip);

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
    try{
      const res = await axios.post("http://localhost:8080/GroupTrips/CreateGroupTrip",
      {iName:tripName, iDest: location, start: startDate, end: endDate, num_ppl:maxCapacity, description:description},{withCredentials:true});
        if(res.data){
          const newTrip = {
          id: res.data.itinerary_id, 
          owner: "You",
          location: location,
          title: tripName,
          date: `${startDate} – ${endDate}`,
          capacity: maxCapacity, //Capped at 5
          currentMembers: 1, //Creator is automatically a member
          description,
          joinedByYou: true,
          isHost: true,
        };

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
