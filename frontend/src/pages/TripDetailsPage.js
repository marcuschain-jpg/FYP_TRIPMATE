import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Itinerary.css";
import "../styles/Collab.css";
import link from "../Assets/link.png"
import whatsapp from "../Assets/Whatsapp.png"
import telegram from "../Assets/Telegram.png"
import ItineraryChat from "../components/ItineraryChat";

//Date formatter function--> so that correct data appears across all pages and can be updatd through edit button
const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return "";
  
  let date;
  
  if (typeof dateValue === "string") {
    date = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return "";
  }
  
  if (isNaN(date.getTime())) {
    return "";
  }
  
  return date.toLocaleDateString("en-GB");
};

function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  //State to control collaborator modal
  const [showCollaborators, setShowCollaborators] = useState(false);

  //Dummy collaborators (UI only)
  const [collaborators, setCollaborators] = useState([]);

  //Input value
  const [newCollaborator, setNewCollaborator] = useState("");

  //Chat modal
  const[showChat, setShowChat] = useState(false);

  //Load trips and set current trip
  useEffect(() => {
    axios.get("http://localhost:8080/Itinerary/GetItinerary", {
        params: { i_id: tripId },
        withCredentials: true
      })
      .then((response) => {
        renderLoadTrip(response.data);
        setLoading(false);
      })
      .catch(err =>{
        if(err.response.status === 401 || err.response.status === 403)
          {
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }      
      });
      
    axios.post("http://localhost:8080/GetRoleForUser", {}, {withCredentials:true})
    .then(res => {
      setUserRole(res.data.role);
    })
  }, []);

  useEffect(() => {
    if(userRole === "premium") setIsPremium(true);
  }, [userRole])

  const renderLoadTrip = (res) => {
    //Format dates using the formatter function
    const formattedSDate = formatDateForDisplay(res[0].start_date);
    const formattedEDate = formatDateForDisplay(res[0].end_date);

    let mapCollab = "";

    const mapTrips = {
      id: res[0].itinerary_id,
      name: res[0].itinerary_name,
      destination: res[0].itinerary_dest,
      start: formattedSDate,
      end: formattedEDate,
      status: res[0].completed,
      type: res[0].type,
      numPpl: res[0].num_ppl
    };

    if(res[0].email){
      mapCollab = res.map(item => ({
        name: item.first_name + " " + item.last_name,
        email: item.email
      }));
    }
    
    setCollaborators(mapCollab);
    setTrip(mapTrips);
  };

  const updateTripStatus = (status) => {
    //main method to update completed
    axios
      .patch("http://localhost:8080/Itinerary/UpdateItineraryComplete", {
        i_id: tripId,
        completed: status,
      }, {withCredentials:true})
      .then((response) => {
        if (response.data === true) {
          setTrip({ ...trip, status });
        }
      });
  };

  //Add collaborator (dummy only)
  const handleAddCollaborator = async() => {
    if (newCollaborator.trim() === "") return;
    if (trip.numPpl >= 5){
      console.log(trip.numPpl)
      alert("Max amount of collaborators reached!");
      return;
    }

    //Prevent duplicates
    if (collaborators.includes(newCollaborator)) return;
    let collabAdded = false;

    try{
      const res = await axios.post("http://localhost:8080/Itinerary/AddCollaborator", {i_id:tripId, email:newCollaborator, i_name: trip.name}, {withCredentials:true})
      if(res.data){
      //setCollaborators(prev => [...prev, {name: `${res.data[0].first_name} ${res.data[0].last_name}`, email: res.data[0].email}]);
      alert("Email invitation sent!")
      setNewCollaborator("");
    }
    }
    catch(err) {
      if(err.response.status === 401 || err.response.status === 403)
      {
        const errData = err.response;
        const errorMsg = errData.status + ": " + errData.data.message;
        navigate(`/login/${errorMsg}`);
      }      
      if(err.response.status === 500)
      {
        const errData = err.response;
        const errorMsg = errData.data.message;
        setNewCollaborator("");
        alert(errorMsg);
      }
    }
  };

  //Delete collaborator with confirmation
  const handleDeleteCollaborator = async(item) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${item.name} as a collaborator?`
    );

    if (confirmDelete) {
      let deleteConfirm = false; // Check if db returns true if already deleted
      try{
        const res = await axios.delete("http://localhost:8080/Itinerary/DeleteCollaborator", {data:{i_id:tripId, email:item.email}, withCredentials:true})
        deleteConfirm = res.data;
      }
      catch(err){
        if(err.response.status === 401 || err.response.status === 403)
        {
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }      
        if(err.response.status === 500)
        {
          const errData = err.response;
          const errorMsg = errData.data.message;
          alert(errorMsg);
        }
      }

      if(deleteConfirm){
        setCollaborators(
          collaborators.filter(member => member.email !== item.email)
        );
      }
    }
  };

  //Save collaborators and update parent component
  const handleSaveCollaborators = () => {
    //Dispatch event to notify MyTripsPage of the update
    const event = new CustomEvent("updateCollaborators", {
      detail: {
        tripId: trip.id,
        collaborators: collaborators
      }
    });
    window.dispatchEvent(event);
    setShowCollaborators(false);
  };

  if (loading) return <p>Loading..</p>;

  return (
    <div className="tripdetails-page">
      <div className="tripdetails-inner">
        <button className="back-btn" onClick={() => navigate(`/mytrips`)}>
          ← Back to My Trips
        </button>

        <h1 className="tripdetails-title">{trip.name}</h1>
        <p className="trip-date">
          {trip.start} — {trip.end}
        </p>

        {/*Collaborate button*/}
        <div className="trip-actions">
          <button
            className="collaborate-btn"
            onClick={() => setShowCollaborators(true)}
            title="Collaborators"
          >
            👥
          </button>
        </div>

        <label className="completed-label">
          <input
            type="checkbox"
            checked={trip.status === true}
            onChange={(e) =>
              updateTripStatus(e.target.checked ? true : false)
            }
          />
          Trip Completed
        </label>

        {/*Itinerary card*/}
        <div className="section-card">
          <div className="section-content">
            <h2>Itinerary</h2>
            <p>View or edit itinerary here</p>
            <button
              className="view-btn"
              onClick={() =>
                navigate(`/mytrips/trip/itinerary/${trip.id}/default`)
              }
            >
              View
            </button>
          </div>
        </div>

        {/*Timeline card*/}
        <div className="section-card">
          <div className="section-content">
            <h2>Timeline</h2>
            <p>Generate or view timeline here</p>
            <button
              className="view-btn"
              onClick={() =>
                navigate(`/mytrips/trip/timeline/${trip.id}`)
              }
            >
              View
            </button>
          </div>
        </div>

        {/*Media card*/}
        <div className="section-card">
          <div className="section-content">
            <h2>Media</h2>
            <p>Edit or view media here</p>
            <button
              className="view-btn"
              onClick={() =>
                navigate(`/mytrips/trip/media/${trip.id}`)
              }
            >
              View
            </button>
          </div>
        </div>
      </div>

      {(trip.type === "Group") && 
      (<button className="floating-chat-btn" onClick={() => setShowChat(true)} title="Chat">
        Chat
      </button>)}

      {/*Collaborators modal*/}
      {showCollaborators && (
        <div className="collab-overlay">
          <div className="collab-card">
            {isPremium && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 className="collab-title">Add Collaborators</h3>
                <div style={{ background: "#e3f2fd", color: "#0a3d62", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                  {collaborators.length} member{collaborators.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            {/*Input row*/}
            {(isPremium) && <div className="collab-input-row">
              <input
                type="text"
                className="collab-input"
                placeholder="Enter collaborator email"
                value={newCollaborator}
                onChange={(e) =>
                  setNewCollaborator(e.target.value)
                }
              />
              <button
                className="add-btn"
                onClick={handleAddCollaborator}
              >
                Add
              </button>
            </div>}

            {/*Members*/}
            <div className="members-section">
              {isPremium && <p className="members-title">Members</p>}

              {(isPremium && collaborators) && collaborators.map((item, index) => (
                <div key={index} className="member-item">
                  <div className="avatar">
                    {item.name.charAt(0).toUpperCase()}
                  </div>

                  <span className="member-name">{item.name}</span>

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteCollaborator(item)}
                    title="Remove collaborator"
                  >
                    ✕
                  </button>

                </div>
              ))}
              {(isPremium && !collaborators) &&
                <div className="member-item">

                  <span className="member-name">No collaborators found!</span>

                </div>
              }
              <p className="members-title">Share</p>
              <div className="share-icons">
                <img src={link} alt="link.img" className="collab-img" />
                <img src={whatsapp} alt="whatsapp.img" className="collab-img2" />
                <img src={telegram} alt="tele.img" className="collab-img2" />
              </div>
            </div>

            {/*Actions*/}
            <div className="collab-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowCollaborators(false)}
              >
                Cancel
              </button>
              {isPremium && <button
                className="save-btn"
                onClick={handleSaveCollaborators}
              >
                Save
              </button>}
            </div>
          </div>
        </div>
      )}

      {showChat && ( <ItineraryChat onClose={() => {setShowChat(false);}} i_id={tripId}/>)}
    </div>
  );
}

export default TripDetailsPage;