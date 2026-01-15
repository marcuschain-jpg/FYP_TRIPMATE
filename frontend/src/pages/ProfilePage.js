import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Profile.css";
import Axios from '../hooks/Axios';

const BookmarkIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#333" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

//Current user profile
const initialProfile = {
  username: "Loading..",
  bio: "",
  accountType: "Premium",
  interests: {
    food: true,
    adventure: true,
    artMusic: false,
    history: false,
    sightseeing: false,
  },
  profilePic: "",
};

//Formats any date to YYYY-MM-DD format for consistency
function formatDateForCalendar(dateValue) {
  if (!dateValue) return null;
  
  let date;
  
  if (typeof dateValue === "string") {
    date = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return null;
  }
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(initialProfile);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); 
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  //Load trips data
  useEffect(() => {
    const loadTrips = async () => {
      try {
        //Get private trips
        const [privateRes, userRes] = await Promise.all([
          Axios.get("Itinerary/GetAllItineraries",{ withCredentials: true }),
          Axios.get("Users/GetProfileDetails", { withCredentials: true})
        ]);

        console.log("Trips from backend:", privateRes.data);

        //Format all trips (both private and group)
        const allTrips = privateRes.data.map((trip) => ({
          id: trip.itinerary_id,
          title: trip.itinerary_name,
          //Use formatDateForCalendar--> dates from database
          startDate: formatDateForCalendar(trip.start_date),
          endDate: formatDateForCalendar(trip.end_date),
          //Set type based on trip type from database (group or private)
          type: trip.type === "Group" ? "group" : "private",
          destination: trip.itinerary_dest,
        }));

        const userDetails = {
          username: userRes.data[0].email,
          bio: userRes.data[0].bio,
          accountType: userRes.data[0].type,
          profilePic: userRes.data[0].photo_url
        }

        console.log("Formatted all trips (private + group):", allTrips);

        setTrips(allTrips);
        setProfile(userDetails);
        setLoading(false);
      } catch (err) {
        console.error("Error loading trips:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          const errorMsg = `${err.response.status}: ${err.response.data.message}`;
          navigate(`/login/${errorMsg}`);
        }
        setLoading(false);
      }
    };
    

    loadTrips();
  }, [navigate]); 

  //Sync profile info when edits are made
  useEffect(() => {
    if (location.state?.updatedProfile) {
      setProfile(location.state.updatedProfile);
      navigate("/profile", { replace: true });
    }
  }, [location.state, navigate]);

  //Calendar functions
  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getTripsOnDate = (day) => {
    return trips.filter((trip) => {
      if (!trip.startDate || !trip.endDate) return false;
      
      const tripStart = trip.startDate;
      const tripEnd = trip.endDate;
      const checkDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      return checkDate >= tripStart && checkDate <= tripEnd;
    });
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);

    return days;
  };

  const handlePrevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );

  const handleNextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );

  const handleToday = () => setCurrentDate(new Date());

  const handleTripClick = (tripId) => {
    navigate(`/mytrips/trip/${tripId}`);
  };

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const calendarDays = generateCalendarDays();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === currentDate.getFullYear() &&
    today.getMonth() === currentDate.getMonth();
  const isPremium = profile.accountType === "Premium";

  return (
    <div className="profile-page">
      <div className="profile-main-full">

        {/*Profile header*/}
        <div className="profile-header-container">
          <div className="profile-avatar-large">
            {profile.profilePic ? (
              <img src={profile.profilePic} alt="User Avatar" />
            ) : (
              <div className="avatar-placeholder-empty" />
            )}
          </div>

          <div className="profile-info">
            <div className="profile-username-row">
              <h1>{profile.username}</h1>
              {isPremium && <span className="premium-badge">Premium</span>}
            </div>

            <p className="profile-bio">{profile.bio}</p>

            <div className="profile-actions">
              <button
                className="profile-btn edit-btn"
                onClick={() => navigate("/edit-profile", { state: { profile } })}
              >
                Edit Profile
              </button>
              <button
                className="profile-btn help-btn"
                onClick={() => navigate("/help")}
              >
                Help
              </button>
            </div>
          </div>
        </div>

        {/*Calendar section*/}
        <div className="calendar-section">
          <h2>Trip Calendar</h2>

          {loading ? (
            <p className="loading">Loading calendar...</p>
          ) : (
            <>
              {/*Calendar controls--> navigate between months*/}
              <div className="calendar-controls">
                <button className="today-btn" onClick={handleToday}>
                  Today
                </button>
                <button className="nav-btn" onClick={handlePrevMonth}>
                  ←
                </button>
                <h3>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button className="nav-btn" onClick={handleNextMonth}>
                  →
                </button>
              </div>

              {/*Legends--> blue for private, red for group/public*/}
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-color private"></div>
                  <span>Private Trips</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color group"></div>
                  <span>Group Trips</span>
                </div>
              </div>

              {/*Calendar grid*/}
              <div className="calendar-grid">
                <div className="day-names-row">
                  {dayNames.map((day) => (
                    <div key={day} className="day-name">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="calendar-days">
                  {calendarDays.map((day, index) => {
                    const tripsOnDay = day ? getTripsOnDate(day) : [];
                    const isToday =
                      isCurrentMonth && day === today.getDate();

                    return (
                      <div
                        key={index}
                        className={`calendar-day ${day ? "" : "empty"} ${
                          isToday ? "today" : ""
                        }`}
                      >
                        {day && (
                          <>
                            <div className="day-number">{day}</div>
                            <div className="trips-container">
                              {tripsOnDay.map((trip, tripIndex) => (
                                <div
                                  key={`${trip.id}-${tripIndex}`}
                                  className={`trip-badge ${trip.type}`}
                                  title={trip.title}
                                  onClick={() => handleTripClick(trip.id)}
                                  style={{ cursor: "pointer" }}
                                >
                                  {trip.title}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;