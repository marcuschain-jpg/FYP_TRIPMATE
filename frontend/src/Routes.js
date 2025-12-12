import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Navbars
import UserNavbar from "./navs/UserNavbar";
import UnregisteredUserNavbar from "./navs/UnregisteredUserNavBar";

// Pages
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
import HomePage from "./pages/HomePage";   // 👈 ADDED

// Temporary placeholder component
function Placeholder({ title }) {
  return (
    <div style={{ padding: "40px" }}>
      <h1>{title}</h1>
      <p>This page will be created later.</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route element={<UnregisteredUserNavbar />}>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<CreateAccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Route>

        {/* ================ LOGGED-IN USER ROUTES ================ */}
        <Route element={<UserNavbar />}>
          {/* Home after login */}
          <Route path="/home" element={<HomePage />} />   {/* 👈 ADDED */}

          {/* Trips */}
          <Route path="/mytrips/:userID" element={<MyTripsPage />} />
          <Route path="/mytrips/trip/:tripId" element={<TripDetailsPage />} />
          <Route
            path="/mytrips/trip/itinerary/:tripId"
            element={<ItineraryPage />}
          />

          {/* Activity Form */}
          <Route
            path="/mytrips/trip/:tripId/activity/:mode"
            element={<ActivityFormPage />}
          />
          <Route
            path="/mytrips/trip/:tripId/activity/:mode/:index"
            element={<ActivityFormPage />}
          />

          {/* Media */}
          <Route
            path="/mytrips/trip/:tripId/media"
            element={<MediaPage />}
          />

          {/* Timeline */}
          <Route
            path="/mytrips/trip/:tripId/timeline"
            element={<TimelinePage />}
          />

          {/* Saved Timelines */}
          <Route
            path="/mytrips/trip/:tripId/saved-timelines"
            element={<SavedTimelinesPage />}
          />

          {/* Placeholders */}
          <Route path="/feed" element={<Placeholder title="Feed" />} />
          <Route path="/join" element={<Placeholder title="Join A Trip" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
