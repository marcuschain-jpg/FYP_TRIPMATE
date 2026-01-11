import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

//Navbars
import UserNavbar from "./navs/UserNavbar";
import UnregisteredUserNavbar from "./navs/UnregisteredUserNavBar";
import AdminNavbar from "./navs/AdminNavbar";

//Pages
import Landing from "./pages/Landing";
import QuizPage from "./pages/QuizPage";
import LoginPage from "./pages/LoginPage";
import MyTripsPage from "./pages/MyTripsPage";
import TripDetailsPage from "./pages/TripDetailsPage";
import ItineraryPage from "./pages/ItineraryPage";
import ActivityFormPage from "./pages/ActivityFormPage";
import MediaPage from "./pages/MediaPage";
import TimelinePage from "./pages/TimelinePage";
import SavedTimelinesPage from "./pages/SavedTimelinesPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import PricingPage from "./pages/PricingPage";
import HomePage from "./pages/HomePage";
import ChatbotPage from "./pages/ChatbotPage";
import GroupTripsPage from "./pages/GroupTripsPage";
import GroupChatPage from "./pages/GroupChatPage";
//import ItineraryFeedPage from "./pages/ItineraryFeedPage";
import ProfilePage from "./pages/ProfilePage"; 
import EditProfilePage from "./pages/EditProfilePage";
import ReviewsPage from "./pages/ReviewsPage";
import HelpPage from "./pages/HelpPage";
import ConfirmationFromEmail from "./pages/ConfirmationFromEmail";

//import admin pages
import Overview from "./pages/Overview";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import Content from "./pages/Content";
import Support from "./pages/Support";



function AppRoutes() {
  //Track if user is a first-time user
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  
  //Store current user profile data
  const [userProfile, setUserProfile] = useState(null);

  //Function to set user profile after login
  const setCurrentUserProfile = (profile) => {
    setUserProfile(profile);
  };

  //Function to mark first-time user
  const markAsFirstTimeUser = (isFirst) => {
    setIsFirstTimeUser(isFirst);
  };

  //Function to complete profile setup
  const completeProfileSetup = () => {
    setIsFirstTimeUser(false);
  };

  //Function to clear user data on logout
  const clearUserData = () => {
    setUserProfile(null);
    setIsFirstTimeUser(false);
  };

  //Group trips data - loaded from backend
  const [groupTrips, setGroupTrips] = useState([]);

  //trips that appear on My Trips page (group trips you joined/created)
  const [myTrips, setMyTrips] = useState([]);
  const [groupChats, setGroupChats] = useState({});

  //Load all itineraries from backend on mount
  useEffect(() => {
    const loadAllItineraries = async () => {
      try {
        //Get group trips from GetGroupTrips endpoint
        const response = await axios.get(
          "http://localhost:8080/GroupTrips/GetGroupTrips",
          { withCredentials: true }
        );
        
        console.log("All group trips from backend:", response.data);
        
        //Map group trips
        const groupTripsData = (response.data || [])
          .map((trip) => ({
            id: trip.itinerary_id,
            owner: trip.owner || "Unknown",
            title: trip.title,
            date: `${trip.start_date} – ${trip.end_date}`,
            capacity: trip.capacity || 0,
            joined: trip.num_ppl || 0,
            description: trip.description || "",
            startDate: trip.start_date,
            endDate: trip.end_date,
            type: "group",
          }));
        
        setGroupTrips(groupTripsData);
        console.log("Processed group trips:", groupTripsData);
      } catch (err) {
        console.error("Error loading group trips:", err);
      }
    };

    loadAllItineraries();
  }, []);

  //Create group trip
  const createTrip = (trip) => {
    setGroupTrips((prev) => [trip, ...prev]);
    //Creator = auto joined
    setMyTrips((prev) => {
      if (prev.find((t) => t.id === trip.id)) return prev;
      return [...prev, trip];
    });
    setGroupChats((prev) => ({
      ...prev,
      [trip.id]: [],
    }));
  };

  //Join trip/add to My trips page 
  const joinTrip = async (trip) => {
    try {
      console.log("Joining trip:", trip);
      
      //Add to myTrips immediately 
      setMyTrips((prev) => {
        if (prev.find((t) => t.id === trip.id)) return prev;
        return [...prev, trip];
      });

      //Try to call backend if endpoints exist
      try {
        const response = await axios.post(
          `http://localhost:8080/GroupTrips/JoinGroupTrip/${trip.id}`,
          {},
          {withCredentials: true}
        );
        console.log("Backend join successful:", response);
      } catch(apiErr) {
        console.log("Backend endpoint not available (expected), using local state");
      }

      //Update group trip member count
      setGroupTrips((prev) =>
        prev.map((t) =>
          t.id === trip.id ? { ...t, joined: t.joined + 1 } : t
        )
      );

      //Initialize group chat
      setGroupChats((prev) => ({
        ...prev,
        [trip.id]: prev[trip.id] || [],
      }));
    } catch(err) {
      console.error("Error in joinTrip:", err);
      throw err;
    }
  };

  //Exit trip--> remove from my trips
  const exitTrip = async (tripId) => {
    try {
      console.log("Exiting trip:", tripId);
      
      //Remove from my trips immediately 
      setMyTrips((prev) => prev.filter((t) => t.id !== tripId));

      //Try to call backend if endpoints exist
      try {
        const response = await axios.post(
          `http://localhost:8080/GroupTrips/ExitGroupTrip/${tripId}`,
          {},
          {withCredentials: true}
        );
        console.log("Backend exit successful:", response);
      } catch(apiErr) {
        console.log("Backend endpoint not available (expected), using local state");
      }

      //Update group trip member count
      setGroupTrips((prev) =>
        prev.map((t) =>
          t.id === tripId ? { ...t, joined: Math.max(0, t.joined - 1) } : t
        )
      );
    } catch(err) {
      console.error("Error in exitTrip:", err);
      throw err;
    }
  };

  const removeTripFromJoinPage = (tripId) => {
    setGroupTrips((prev) => prev.filter((t) => t.id !== tripId));
  };

  const sendMessage = (tripId, message) => {
    setGroupChats((prev) => ({
      ...prev,
      [tripId]: [...(prev[tripId] || []), message],
    }));
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route element={<UnregisteredUserNavbar />}>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<CreateAccountPage />} />
          <Route path="/login" element={<LoginPage setCurrentUserProfile={setCurrentUserProfile} markAsFirstTimeUser={markAsFirstTimeUser} />} />
          <Route path='/login/:errorMsg' element={<LoginPage setCurrentUserProfile={setCurrentUserProfile} markAsFirstTimeUser={markAsFirstTimeUser} />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          
        </Route>
        <Route path="/confirm/:invID" element={<ConfirmationFromEmail/>}/>

        {/* ================= LOGGED-IN ================= */}
        <Route
          element={
            <UserNavbar
              outletContext={{
                groupTrips,
                myTrips,
                groupChats,
                createTrip,
                joinTrip,
                exitTrip,
                removeTripFromJoinPage,
                sendMessage,
                isFirstTimeUser,
                completeProfileSetup,
                clearUserData,
                userProfile,
              }}
            />
          }
        >
          {/*Redirect first-time users to setup-profile, otherwise show HomePage*/}
          <Route path="/home" element={isFirstTimeUser ? <Navigate to="/setup-profile" replace /> : <HomePage />} />
          <Route path="/mytrips" element={<MyTripsPage />} />
          
          {/*First time user setup*/}
          <Route path="/setup-profile" element={<EditProfilePage />} />
          <Route path="/mytrips/trip/:tripId" element={<TripDetailsPage />} />
          <Route
            path="/mytrips/trip/itinerary/:tripId/:firstdate"
            element={<ItineraryPage />}
          />
          <Route
            path="/mytrips/trip/activity/:mode/:tripId"
            element={<ActivityFormPage />}
          />
          <Route
            path="/mytrips/trip/activity/:mode/:tripId/:index"
            element={<ActivityFormPage />}
          />

          {/*Media*/}
          <Route path="/mytrips/trip/media/:tripId" element={<MediaPage />} />

          {/*Timeline*/}
          <Route
            path="/mytrips/trip/timeline/:tripId"
            element={<TimelinePage />}
          />
          <Route
            path="/mytrips/trip/saved-timelines/:tripId"
            element={<SavedTimelinesPage />}
          />
          
          {/*Profile*/}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />

          <Route path="/chatbot" element={<ChatbotPage />} />

          {/*Join a trip*/}
          <Route path="/join-trip" element={<GroupTripsPage />} />

          {/*Help Centre page*/}
          <Route path="/help" element={<HelpPage />} />
         
          <Route path="/group-chat/:tripId" element={<GroupChatPage />} />
        </Route>
        
        {/* ================= ADMIN ROUTES ================= */}
        <Route path="/admin" element={<AdminNavbar />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserProfile />} />
          <Route path="content" element={<Content />} />
          <Route path="support" element={<Support />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;