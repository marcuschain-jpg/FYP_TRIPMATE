import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import InitMaps from "../components/InitMaps";
import useMapData from "../hooks/FetchMapData";
import "../styles/Itinerary.css";
import axios from 'axios';
import { io } from "socket.io-client";
import ItineraryChat from "../components/ItineraryChat";

const socket = io("http://localhost:8080")

function ItineraryPage() {
  const { tripId, firstdate } = useParams();
  const navigate = useNavigate();

  const mapData = useMapData();

  const [trips, setTrips] = useState([]); 
  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [Loading, setLoading] = useState(true);
  const [isArranging, setIsArranging] = useState(false); 
  const[showChat, setShowChat] = useState(false); 
  const [activityCoords, setActivityCoords] = useState([]); //Store coords for maps

  //Load trip & activities
  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:8080/Itinerary/GetAllActivities", {params:{i_id: tripId}, withCredentials:true})
    .then(res => {
      renderLoadTrip(res.data);
      renderLoadActivities(res.data);
      const data = res.data

      //load default earliest date
      if(firstdate === "default")
      {
        const uniqueDates = Array.from(new Set(data.map(a => a.activity_date))).sort();
        if(uniqueDates.length > 0) setSelectedDate(uniqueDates[0]);
        setLoading(false);
      }
      else{
        setSelectedDate(firstdate);
        setLoading(false);
      }
    })
    .catch(err =>{
      if(err.response.status === 401||err.response.status === 403)
        {
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }
      else if(err.response.status === 500)
        {
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          console.log(errorMsg);
        }
    });
  }, [isArranging]);

  //Change arrange button state
  useEffect(() => {
    //join room for trip
    if(!socket) return;
    socket.emit("joinTrip", `trip_${tripId}`);
    
    //listen for arranging event
    socket.on("Arranging", (data) => {
      if(data.running) {
        setIsArranging(true);
      }
    });

    //listen for arranged event
    socket.on("Arranged", (data) => {
      if(!data.running) {
        console.log("Arranged event received", data);
        setIsArranging(false);
        //send data here too?
        //if(data.updatedItinerary) {}
      }
    });

    return () => {
      socket.off("Arranging");
      socket.off("Arranged");
    };
  }, []);

  const renderLoadTrip = (res) => {
    const mapTrips = {
      id: tripId,
      name: res[0].itinerary_name,
      start: res[0].start_date,
      end: res[0].end_date,
    };

    setTrip(mapTrips);
  };

  const renderLoadActivities = (res) => {
    const mapAct = res.map(a => ({
      id: a.activity_id,
      name: a.activity_name,
      date: a.activity_date,
      address: a.activity_address,
      location: a.activity_location,
    }));

    const coordAct = res.map(a => ({
      id: a.activity_id,
      coords:{
      lng: parseFloat(a.longitude),
      lat: parseFloat(a.latitude)
      },
      date: a.activity_date
    }))
    setActivityCoords(coordAct);
    setActivities(mapAct);
  };


  if (!trip) return <p className="loading-text">Trip not found.</p>;


  let filteredActivities = activities.filter(
    (a) => a.date === selectedDate
  );

  let filteredCoord = activityCoords.filter(
    (a) => a.date === selectedDate
  )

  //Delete actiity from itinerary
  const handleDeleteActivity = async(index) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) { 
      return;
    }
    
    await axios.delete("http://localhost:8080/Itinerary/DeleteActivity", {data:{activityid:index}, withCredentials:true})
    .then(response => {
      if(response.data === true) 
      {
        setActivities((prev) => prev.filter((a) => a.id !== index));
      }
    });
    alert("Activity deleted successfully!");
  };

  const arrangeItinerary = async() => {
    //5 second countdown then arrange if not reset timer
    await axios.get("http://localhost:8080/Itinerary/ArrangeItinerary", {params:{i_id:tripId}, withCredentials:true})
    .then(res => {
      if(res.data === true) 
      {
        console.log("function runned");
      }
    });
  }

  return (
    <div className="itinerary-view">
      <button
        className="back-btn"
        onClick={() => navigate(`/mytrips/trip/${tripId}`)}
      >
        ← Back
      </button>

      <div className="itinerary-top-row">
        <div>
          <h1>{trip.name}</h1>
          <p className="date-text">
            {trip.start} – {trip.end}
          </p>
        </div>
      </div>

      <div className="view-layout">
        <div className="left-side">
          <h2>Activities</h2>

          {/*Date drop down bar--> user can view activities for selected date*/}
            {!Loading && activities.length > 0 && (
            <div className="date-row">
              <select
                className="date-filter-dropdown"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                {Array.from(new Set(activities.map((a) => a.date)))
                  .sort()
                  .map((d) => (
                    <option key={d} value={d}>
                      {new Date(d).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                      })}
                    </option>
                  ))}
              </select>

              <button className="arrange-btn" onClick={() => arrangeItinerary()} disabled={isArranging}>{isArranging ? "Arranging..." : "Arrange"}</button>
            </div>
          )}

          {/*Activity section*/}
          <div className="activities-section">
            {Loading && <p>Loading..</p>}
            {!Loading && filteredActivities.length === 0 && (
              <p>No activities for this day.</p>
            )}

            {!Loading && filteredActivities.map((act) => (
              <div key={act.id} className="activity-card">
                <h3>{act.name}</h3>
                <p>
                  <strong>{act.date}</strong>
                </p>
                <p>{act.location}</p>
                {act.address && <p>{act.address}</p>}

                <div className="activity-actions">
                  <button className="activity-edit-btn" disabled={isArranging} onClick={() => navigate(`/mytrips/trip/activity/edit/${tripId}/${act.id}`)}>
                    Edit
                  </button>

                  {/*Delete button*/}
                  <button className="activity-delete-btn" disabled={isArranging} onClick={() => handleDeleteActivity(act.id)}> Delete </button>
                </div>
          </div>
          ))}
          </div>

          {/*Add new activity*/}
          <button
            className="add-activity-big"
            disabled={isArranging}
            onClick={() =>
              navigate(`/mytrips/trip/activity/create/${trip.id}`)
            }
          >
            Add Activity +
          </button>
        </div>

        <div className="right-side">
          {mapData ? (<InitMaps DefaultMapData={mapData} activityCoords={filteredCoord}/>) :
          (<p className="map-loading-text">Loading map…</p>)
          }

        </div>
      </div>
      <button className="floating-chat-btn" onClick={() => setShowChat(true)} title="Chat">
        Chat
      </button>
      {showChat && ( <ItineraryChat onClose={() => setShowChat(false)}/> )}
    </div>
  );
}

export default ItineraryPage;