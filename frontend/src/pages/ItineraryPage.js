import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef, useMemo } from "react";
import "../styles/Itinerary.css";
import axios from "axios";
import { io } from "socket.io-client";
import ItineraryChat from "../components/ItineraryChat";

const socket = io("http://localhost:8080");

//Normalize any date string to YYYY-MM-DD--> connecting lines will reset when toggled to a diff day (wont connect all days together)
function normDate(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

function ItineraryPage() {
  const { tripId, firstdate } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [Loading, setLoading] = useState(true);
  const [isArranging, setIsArranging] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activityCoords, setActivityCoords] = useState([]);

  //Get google maps key from backend
  const [mapConfig, setMapConfig] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8080/Itinerary/maps")
      .then((res) => {
        if (!res.data?.apiKey) {
          console.error("Maps endpoint returned no apiKey:", res.data);
          return;
        }
        setMapConfig(res.data); 
      })
      .catch((err) => {
        console.error(
          "Failed to retrieve Google Maps config:",
          err?.response?.data || err.message
        );
      });
  }, []);

  //Google Maps (in this page)
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  function loadGoogleMaps(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) return resolve();

      const existing = document.querySelector('script[data-google-maps="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.dataset.googleMaps = "true";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function clearMarkers() {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }

  function clearPolyline() { //Connecting lines between way markers to display routes
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }

  function fitToPoints(latLngs) {
    const bounds = new window.google.maps.LatLngBounds();
    latLngs.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!mapConfig?.apiKey) return;

        await loadGoogleMaps(mapConfig.apiKey);
        if (cancelled) return;

        if (!mapRef.current && mapDivRef.current) {
          const center = mapConfig.center || { lat: 1.3521, lng: 103.8198 };

          mapRef.current = new window.google.maps.Map(mapDivRef.current, {
            center,
            zoom: 12,
            styles: [], //Force light mode--> so that line is not too dark
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }
      } catch (e) {
        console.error("Google Maps failed to load:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapConfig]);

  // LOAD TRIP & ACTIVITIES
  useEffect(() => {
    setLoading(true);

    axios
      .get("http://localhost:8080/Itinerary/GetAllActivities", {
        params: { i_id: tripId },
        withCredentials: true,
      })
      .then((res) => {
        const data = res.data;

        //Trip
        const mapTrips = {
          id: tripId,
          name: data?.[0]?.itinerary_name,
          start: data?.[0]?.start_date,
          end: data?.[0]?.end_date,
        };
        setTrip(mapTrips);

        //Activities & coords
        const mapAct = data.map((a) => ({
          id: a.activity_id,
          name: a.activity_name,
          date: normDate(a.activity_date),
          address: a.activity_address,
          location: a.activity_location,
        }));

        const coordAct = data.map((a) => ({
          id: a.activity_id,
          coords: {
            lng: parseFloat(a.longitude),
            lat: parseFloat(a.latitude),
          },
          date: normDate(a.activity_date),
        }));

        setActivities(mapAct);
        setActivityCoords(coordAct);

        //Set default date
        if (firstdate === "default") {
          const uniqueDates = Array.from(new Set(mapAct.map((x) => x.date))).sort();
          if (uniqueDates.length > 0) setSelectedDate(uniqueDates[0]);
        } else {
          setSelectedDate(normDate(firstdate));
        }

        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        } else if (err?.response?.status === 500) {
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          console.log(errorMsg);
        } else {
          console.log(err);
        }
      });
  }, [isArranging, tripId, firstdate, navigate]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("joinTrip", `trip_${tripId}`);

    socket.on("Arranging", (data) => {
      if (data.running) setIsArranging(true);
    });

    socket.on("Arranged", (data) => {
      if (!data.running) setIsArranging(false);
    });

    return () => {
      socket.off("Arranging");
      socket.off("Arranged");
    };
  }, [tripId]);

  //List matches map date logic
  const filteredActivities = useMemo(
    () => activities.filter((a) => normDate(a.date) === normDate(selectedDate)),
    [activities, selectedDate]
  );

  //Draw markers & connecting line for selected date in drop line (without displaying lines from previous days )
  useEffect(() => {
    if (!mapRef.current || !(window.google && window.google.maps)) return;
    if (!selectedDate) return;

    const filteredCoord = activityCoords.filter(
      (a) => normDate(a.date) === normDate(selectedDate)
    );

    const latLngs = (filteredCoord || [])
      .map((a) => a.coords)
      .filter((c) => Number.isFinite(c?.lat) && Number.isFinite(c?.lng))
      .map((c) => new window.google.maps.LatLng(c.lat, c.lng));

    //Removes previous day's lines (prevents overlap)
    clearMarkers();
    clearPolyline();

    if (latLngs.length === 0) return;

    //Markers
    latLngs.forEach((pos, idx) => {
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        label: `${idx + 1}`,
      });
      markersRef.current.push(marker);
    });

    fitToPoints(latLngs);

    //Displayed oute (for selected day)
    polylineRef.current = new window.google.maps.Polyline({
      path: latLngs,
      geodesic: true,
      strokeColor: "#393F86", // ✅ your colour
      strokeOpacity: 0.95,
      strokeWeight: 6,
      map: mapRef.current,
    });
  }, [activityCoords, selectedDate]);

  //Delete activity
  const handleDeleteActivity = async (index) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;

    await axios
      .delete("http://localhost:8080/Itinerary/DeleteActivity", {
        data: { activityid: index },
        withCredentials: true,
      })
      .then((response) => {
        if (response.data === true) {
          setActivities((prev) => prev.filter((a) => a.id !== index));
          setActivityCoords((prev) => prev.filter((a) => a.id !== index));
        }
      });

    alert("Activity deleted successfully!");
  };

  const arrangeItinerary = async () => {
    await axios.get("http://localhost:8080/Itinerary/ArrangeItinerary", {
      params: { i_id: tripId },
      withCredentials: true,
    });
  };

  //Render
  const tripName = trip?.name || "Trip";
  const tripStart = trip?.start || "";
  const tripEnd = trip?.end || "";

  return (
    <div className="itinerary-view">
      <button className="back-btn" onClick={() => navigate(`/mytrips/trip/${tripId}`)}>
        ← Back
      </button>

      <div className="itinerary-top-row">
        <div>
          <h1>{tripName}</h1>
          <p className="date-text">
            {tripStart} – {tripEnd}
          </p>
        </div>
      </div>

      <div className="view-layout">
        <div className="left-side">
          <h2>Activities</h2>

          {!Loading && activities.length > 0 && (
            <div className="date-row">
              <select
                className="date-filter-dropdown"
                value={selectedDate}
                onChange={(e) => setSelectedDate(normDate(e.target.value))}
              >
                {Array.from(new Set(activities.map((a) => normDate(a.date))))
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

              <button
                className="arrange-btn"
                onClick={() => arrangeItinerary()}
                disabled={isArranging}
              >
                {isArranging ? "Arranging..." : "Arrange"}
              </button>
            </div>
          )}

          <div className="activities-section">
            {Loading && <p>Loading..</p>}
            {!Loading && filteredActivities.length === 0 && <p>No activities for this day.</p>}

            {!Loading &&
              filteredActivities.map((act) => (
                <div key={act.id} className="activity-card">
                  <h3>{act.name}</h3>
                  <p>
                    <strong>{act.date}</strong>
                  </p>
                  <p>{act.location}</p>
                  {act.address && <p>{act.address}</p>}

                  <div className="activity-actions">
                    <button
                      className="activity-edit-btn"
                      disabled={isArranging}
                      onClick={() =>
                        navigate(`/mytrips/trip/activity/edit/${tripId}/${act.id}`)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="activity-delete-btn"
                      disabled={isArranging}
                      onClick={() => handleDeleteActivity(act.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <button
            className="add-activity-big"
            disabled={isArranging}
            onClick={() => navigate(`/mytrips/trip/activity/create/${tripId}`)}
          >
            Add Activity +
          </button>
        </div>

        <div className="right-side">
          {!mapConfig ? (
            <p className="map-loading-text">Loading map…</p>
          ) : (
            <div
              ref={mapDivRef}
              style={{ width: "100%", height: "600px", borderRadius: "12px" }}
            />
          )}
        </div>
      </div>

      <button className="floating-chat-btn" onClick={() => setShowChat(true)} title="Chat">
        Chat
      </button>
      {showChat && <ItineraryChat onClose={() => setShowChat(false)} />}
    </div>
  );
}

export default ItineraryPage;
