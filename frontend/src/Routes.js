import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

//Navbars
import UserNavbar from "./navs/UserNavbar";
import UnregisteredUserNavbar from "./navs/UnregisteredUserNavBar";

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
import ItineraryFeedPage from "./pages/ItineraryFeedPage";


//Placeholder
function Placeholder({ title }) {
  return (
    <div style={{ padding: "40px" }}>
      <h1>{title}</h1>
      <p>This page will be created later.</p>
    </div>
  );
}

function AppRoutes() {
  //Shared state (dummy)
  const [groupTrips, setGroupTrips] = useState([
    {
      id: 1,
      owner: "JohnWick123",
      title: "Egypt Sightseeing Tour",
      date: "22 Jan 2026 – 31 Jan 2026",
      capacity: 8,
      joined: 1,
      description:
        "Explore the wonders of Egypt including iconic pyramids and indulge in countless delicacies.",
    },
    {
      id: 2,
      owner: "MileyCyrus",
      title: "Majestic Maldives",
      date: "13 Dec 2025 – 29 Dec 2025",
      capacity: 4,
      joined: 2,
      description:
        "Perfect getaway from the city. Rest, relax, and enjoy the beautiful beaches in Maldives.",
    },
    {
      id: 3,
      owner: "DylanWang",
      title: "Italy Adventures!",
      date: "1 Feb 2026 – 20 Feb 2026",
      capacity: 10,
      joined: 5,
      description:
        "Explore local hotspots in Italy, perfect for those traveling to Europe for the first time.",
    },
  ]);

  // trips that appear on My Trips page (group trips you joined/created)
  const [myTrips, setMyTrips] = useState([]);

  const [groupChats, setGroupChats] = useState({});

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
  const joinTrip = (trip) => {
    setMyTrips((prev) => {
      if (prev.find((t) => t.id === trip.id)) return prev;
      return [...prev, trip];
    });

    setGroupTrips((prev) =>
      prev.map((t) =>
        t.id === trip.id ? { ...t, joined: t.joined + 1 } : t
      )
    );

    setGroupChats((prev) => ({
      ...prev,
      [trip.id]: prev[trip.id] || [],
    }));
  };

  //Exit remove from My Trips 
  const exitTrip = (tripId) => {
    setMyTrips((prev) => prev.filter((t) => t.id !== tripId));

    setGroupTrips((prev) =>
      prev.map((t) =>
        t.id === tripId ? { ...t, joined: Math.max(0, t.joined - 1) } : t
      )
    );
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Route>

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
              }}
            />
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/mytrips" element={<MyTripsPage />} />
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
          {/*Feed*/}
          <Route path="/feed" element={<ItineraryFeedPage />} />

          <Route path="/chatbot" element={<ChatbotPage />} />

          {/*Join a trip*/}
          <Route path="/join-trip" element={<GroupTripsPage />} />

         
          <Route path="/group-chat/:tripId" element={<GroupChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
