import { BrowserRouter, Routes, Route } from "react-router-dom";

// USER PAGES
import Landing from "./pages/Landing";
import MyTripsPage from "./pages/MyTripsPage";
import TripDetailsPage from "./pages/TripDetailsPage";
import ItineraryPage from "./pages/ItineraryPage";
import ActivityFormPage from "./pages/ActivityFormPage";
import MediaPage from "./pages/MediaPage";
import TimelinePage from "./pages/TimelinePage";
import SavedTimelinesPage from "./pages/SavedTimelinesPage";


// NAVBARS
import UserNavbar from "./navs/UserNavbar";
import AdminNavbar from "./navs/AdminNavbar";

// TEMP PLACEHOLDER
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

        {/* =============================== */}
        {/* USER ROUTES (with User Navbar) */}
        {/* =============================== */}
        <Route element={<UserNavbar />}>
          <Route path="/" element={<Landing />} />

          {/* My Trips main page */}
          <Route path="/mytrips/:userID" element={<MyTripsPage />} />

          {/* Trip details */}
          <Route path="/mytrips/trip/:tripId" element={<TripDetailsPage />} />

          {/* Itinerary view */}
          <Route
            path="/mytrips/trip/:tripId/itinerary"
            element={<ItineraryPage />}
          />

          {/* Activity create/edit */}
          <Route
            path="/mytrips/trip/:tripId/activity/:mode"
            element={<ActivityFormPage />}
          />
          <Route
            path="/mytrips/trip/:tripId/activity/:mode/:index"
            element={<ActivityFormPage />}
          />

          {/* Media page */}
          <Route
            path="/mytrips/trip/:tripId/media"
            element={<MediaPage />}
          />
          {/*Timeline Page*/}
          <Route path="/mytrips/trip/:tripId/timeline" element={<TimelinePage />} />

          {/*SavedTimelinesPage*/}
          <Route
            path="/mytrips/trip/:tripId/saved-timelines"
            element={<SavedTimelinesPage />}
          />



          {/* Other placeholder pages */}
          <Route path="/ourstory" element={<Placeholder title="Our Story" />} />
          <Route path="/feed" element={<Placeholder title="Feed" />} />
          <Route path="/pricing" element={<Placeholder title="Pricing" />} />
          <Route path="/join" element={<Placeholder title="Join A Trip" />} />
        </Route>

        {/* =============================== */}
        {/* ADMIN ROUTES (with Admin Navbar) */}
        {/* =============================== */}
        <Route element={<AdminNavbar />}>
          <Route path="/overview" element={<Placeholder title="Overview" />} />
          <Route path="/users" element={<Placeholder title="Users" />} />
          <Route path="/systems" element={<Placeholder title="Systems" />} />
          <Route path="/content" element={<Placeholder title="Content" />} />
          <Route path="/support" element={<Placeholder title="Support" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
