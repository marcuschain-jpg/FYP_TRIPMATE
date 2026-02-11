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
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ViewItineraryOnlyPage from "./pages/ViewItineraryOnlyPage";

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

  

  return (
    <BrowserRouter>
      <Routes>
        {/* ================= VIEW-ONLY ITINERARY (TOP LEVEL - NO NAVBAR) ================= */}
        <Route path="/itineraryviewonly/:uuid" element={<ViewItineraryOnlyPage />} />

        {/* ================= PUBLIC ================= */}
        <Route element={<UnregisteredUserNavbar />}>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<CreateAccountPage />} />
          <Route path="/login" element={<LoginPage setCurrentUserProfile={setCurrentUserProfile} markAsFirstTimeUser={markAsFirstTimeUser} />} />
          <Route path='/login/:errorMsg' element={<LoginPage setCurrentUserProfile={setCurrentUserProfile} markAsFirstTimeUser={markAsFirstTimeUser} />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          {/* ================= RESET PASSWORD (TOP LEVEL - NO NAVBAR) ================= */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* ================= EMAIL CONFIRMATION (TOP LEVEL) ================= */}
          <Route path="/confirm/:invID" element={<ConfirmationFromEmail/>}/>
        </Route>

        {/* ================= LOGGED-IN ================= */}
        <Route
          element={
            <UserNavbar
              
            />
          }
        >
          {/*Redirect first-time users to setup-profile, otherwise show HomePage*/}
          <Route path="/home" element={ <HomePage />} />
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