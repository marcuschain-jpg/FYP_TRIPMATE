import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Itinerary.css";
import "../styles/Collab.css";

//Ensures that trips created by each user are only visible by that user
function getTripKey() {
  const loggedStr = localStorage.getItem("loggedInUser");
  if (loggedStr) {
    try {
      const user = JSON.parse(loggedStr);
      const uniqueId = user.id || user.email; //Use id/email
      if (uniqueId) {
        return `trips_${uniqueId}`;
      }
    } catch (e) {
      //Ignore JSON parse errors and fall back
    }
  }
  return "trips_guest";
}

function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  //State to control collaborator modal
  const [showCollaborators, setShowCollaborators] = useState(false);

  //Dummy collaborators (UI only)
  const [collaborators, setCollaborators] = useState([
    "Williwonka",
    "Chris Pratt",
    "Kylie",
  ]);

  //Input value
  const [newCollaborator, setNewCollaborator] = useState("");

  //Load trips and set current trip
  useEffect(() => {
    axios
      .get("http://localhost:8080/Itinerary/GetItinerary", {
        params: { i_id: tripId },
      })
      .then((response) => {
        renderLoadTrip(response.data);
        setLoading(false);
      });
  }, []);

  const renderLoadTrip = (res) => {
    // format date from timestamp to dd/mm/yyyy
    const tempSDate = res[0].start_date.split("T")[0];
    const dateObj = new Date(tempSDate);
    const formattedSDate = dateObj.toLocaleDateString("en-GB");

    const tempEDate = res[0].start_date.split("T")[0];
    const dateObj2 = new Date(tempEDate);
    const formattedEDate = dateObj2.toLocaleDateString("en-GB");

    const mapTrips = {
      id: res[0].itinerary_id,
      name: res[0].itinerary_name,
      destination: res[0].itinerary_dest,
      start: formattedSDate,
      end: formattedEDate,
      status: res[0].completed,
    };

    setTrip(mapTrips);
  };

  const updateTripStatus = (status) => {
    //main method to update completed
    axios
      .patch("http://localhost:8080/Itinerary/UpdateItineraryComplete", {
        i_id: tripId,
        completed: status,
      })
      .then((response) => {
        if (response.data === true) {
          setTrip({ ...trip, status });
        }
      });
  };

  //Add collaborator (dummy only)
  const handleAddCollaborator = () => {
    if (newCollaborator.trim() === "") return;

    //Prevent duplicates
    if (collaborators.includes(newCollaborator)) return;

    setCollaborators([...collaborators, newCollaborator]);
    setNewCollaborator("");
  };

  //Delete collaborator with confirmation
  const handleDeleteCollaborator = (name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${name} as a collaborator?`
    );

    if (confirmDelete) {
      setCollaborators(
        collaborators.filter((member) => member !== name)
      );
    }
  };

  if (!trip) return <p>Trip not found.</p>;

  return (
    <div className="tripdetails-page">
      <div className="tripdetails-inner">
        <button className="back-btn" onClick={() => navigate(-1)}>
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
                navigate(`/mytrips/trip/${trip.id}/timeline`)
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
                navigate(`/mytrips/trip/${trip.id}/media`)
              }
            >
              View
            </button>
          </div>
        </div>
      </div>

      {/*Collaborators modal*/}
      {showCollaborators && (
        <div className="collab-overlay">
          <div className="collab-card">
            <h3 className="collab-title">Add Collaborators</h3>

            {/*Input row*/}
            <div className="collab-input-row">
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
            </div>

            {/*Members*/}
            <div className="members-section">
              <p className="members-title">Members</p>

              {collaborators.map((name, index) => (
                <div key={index} className="member-item">
                  <div className="avatar">
                    {name.charAt(0).toUpperCase()}
                  </div>

                  <span className="member-name">{name}</span>

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteCollaborator(name)}
                    title="Remove collaborator"
                  >
                    ✕
                  </button>

                </div>
              ))}
            </div>

            {/*Actions*/}
            <div className="collab-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowCollaborators(false)}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={() => setShowCollaborators(false)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripDetailsPage;
