import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef, useMemo } from "react";
import "../styles/Itinerary.css";
import Axios from '../hooks/Axios';
import { socket } from "../hooks/Socket";
import ItineraryChat from "../components/ItineraryChat";
import { useTranslation } from "react-i18next";

//Normalize any date string to YYYY-MM-DD
function normDate(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

//Date formatting (DD/MM/YYYY format)
function formatDateForDisplay(dateValue) {
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
}

function ItineraryPage() {
  const { tripId, firstdate } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("itinerary");

  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [Loading, setLoading] = useState(true);
  const [isArranging, setIsArranging] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activityCoords, setActivityCoords] = useState([]);
  const [mapConfig, setMapConfig] = useState(null);
  const [lang, setLang] = useState(i18n.language||"en")

  //Google Maps refs
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef([]);

  //Get google maps key from backend with proper auth
  useEffect(() => {
    Axios
      .get("Itinerary/maps", {
        withCredentials: true,
      })
      .then((res) => {
        console.log("✓ Maps config response:", res.data);
        if (res.data?.apiKey) {
          setMapConfig(res.data);
          console.log("✓ Map config set successfully with apiKey from backend");
        } else {
          console.error("✗ No apiKey in response:", res.data);
        }
      })
      .catch((err) => {
        console.error(
          "✗ Failed to retrieve Google Maps config from backend.",
          "Status:",
          err?.response?.status,
          "Message:",
          err.message
        );
      });
  }, []);

  useEffect(() => {
    // Run when ititialized(default) & lang changed
    i18n.on("languageChanged", function(lng) {
      setLang(lng);
    });

    return() => {
      i18n.off("languageChanged", function(lng) {});
    };
  }, [i18n])

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

  function clearDirections() {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
  }

  function clearMarkers() {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  }

  //Initialize maps 
  useEffect(() => {
    if (!mapConfig?.apiKey) return;

    let cancelled = false;

    (async () => {
      try {
        console.log("Loading Google Maps...");
        await loadGoogleMaps(mapConfig.apiKey);
        
        if (cancelled) return;

        if (mapDivRef.current && !mapRef.current) {
          console.log("Creating map instance");
          const center = mapConfig.center || { lat: 1.3521, lng: 103.8198 };

          mapRef.current = new window.google.maps.Map(mapDivRef.current, {
            center,
            zoom: 12,
            styles: [],
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });

          //Initialize directions objects
          directionsServiceRef.current = new window.google.maps.DirectionsService();
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: mapRef.current,
            suppressMarkers: true,
            preserveViewport: false,
            polylineOptions: {
              strokeColor: "#393F86", 
              strokeOpacity: 0.9,
              strokeWeight: 6,
            },
          });

          console.log("Map created successfully");
        }
      } catch (e) {
        console.error("Google Maps initialization failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapConfig]);

  //Load trips and activities
  useEffect(() => {
    Axios
      .get("Itinerary/GetAllActivities", {
        params: { i_id: tripId },
        withCredentials: true,
      })
      .then((res) => {
        const data = res.data;
        console.log("Activity data:", data);

        //Format trip dates using formatDateForDisplay function
        const mapTrips = {
          id: tripId,
          name: data?.[0]?.itinerary_name,
          start: formatDateForDisplay(data?.[0]?.start_date),
          end: formatDateForDisplay(data?.[0]?.end_date),
          type: data?.[0]?.type,
          numPpl: data?.[0]?.num_ppl
        };
        console.log("Trip object:", mapTrips);
        setTrip(mapTrips);

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

        console.log("Activity coords created:", coordAct);
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
          const errorMsg = err.response.status + ": " + err.response.data?.message;
          navigate(`/login/${errorMsg}`);
        } else if (err?.response?.status === 500) {
          const errorMsg = err.response.status + ": " + err.response.data?.message;
          console.log(errorMsg);
        } else {
          console.log(err);
        }
      });
  }, [isArranging, tripId, firstdate, navigate]);

  //Functions to load upon receiving realtime socket updates 
  const renderUpdateActivities = (res, message) => {
    if (message === "activity created!") {
      const mapAct = res.map((a) => ({
        id: a.activity_id,
        name: a.activity_name,
        date: normDate(a.activity_date),
        address: a.activity_address,
        location: a.activity_location,
      }));

      const coordAct = res.map((a) => ({
        id: a.activity_id,
        coords: {
          lng: parseFloat(a.longitude),
          lat: parseFloat(a.latitude),
        },
        date: normDate(a.activity_date),
      }));

      setActivityCoords((prev) => [...prev, ...coordAct]);
      setActivities((prev) => [...prev, ...mapAct]);
    } else if (message === "activity edited!") {
      setActivities((prev) =>
        prev.map((a) => {
          const updated = res.find((r) => r.activity_id === a.id);
          if (updated) {
            return {
              ...a,
              name: updated.activity_name,
              date: normDate(updated.activity_date),
              address: updated.activity_address,
              location: updated.activity_location,
            };
          }
          return a;
        })
      );

      setActivityCoords((prev) =>
        prev.map((coord) => {
          const updated = res.find((r) => r.activity_id === coord.id);
          if (updated) {
            return {
              ...coord,
              coords: {
                lng: parseFloat(updated.longitude),
                lat: parseFloat(updated.latitude),
              },
              date: normDate(updated.activity_date),
            };
          }
          return coord;
        })
      );
    } else if (message === "activity deleted!") {
      setActivities((prev) => prev.filter((a) => a.id !== res[0].activity_id));
      setActivityCoords((prev) => prev.filter((a) => a.id !== res[0].activity_id));
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.connect();
    socket.emit("joinTrip", `trip_${tripId}`);

    socket.on("Arranging", (data) => {
      if (data.running) setIsArranging(true);
    });

    socket.on("Arranged", (data) => {
      if (!data.running) {
        console.log("Arranged event received", data);
        setIsArranging(false);
      }
    });

    socket.on("notification", (data) => {
      if (data.message) {
        console.log(data.message);
        console.log("payload", data.payload);
        renderUpdateActivities(data.payload, data.message);
      }
    });

    return () => {
      socket.off("Arranging");
      socket.off("Arranged");
      socket.off("notification");
    };
  }, [tripId]);

  //List matches map date logic
  const filteredActivities = useMemo(
    () => activities.filter((a) => normDate(a.date) === normDate(selectedDate)),
    [activities, selectedDate]
  );

  //Draw driving route and markers & center map 
  useEffect(() => {
    if (!mapRef.current || !(window.google && window.google.maps)) return;
    if (!selectedDate) return;
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;

    console.log("Route effect triggered. selectedDate:", selectedDate);
    console.log("All activityCoords:", activityCoords);

    const filteredCoord = activityCoords.filter(
      (a) => normDate(a.date) === normDate(selectedDate)
    );

    console.log("Filtered coords for date:", filteredCoord);

    const points = (filteredCoord || [])
      .map((a) => a.coords)
      .filter((c) => Number.isFinite(c?.lat) && Number.isFinite(c?.lng))
      .map((c) => ({ lat: c.lat, lng: c.lng }));

    console.log("Valid points:", points);

    //Clear previous markers and route
    clearMarkers();
    clearDirections();

    //Add markers for all points
    points.forEach((point, index) => {
      const marker = new window.google.maps.Marker({
        position: point,
        map: mapRef.current,
        title: `Activity ${index + 1}`,
        label: String(index + 1),
      });
      markersRef.current.push(marker);
      console.log(`Marker ${index + 1} created at:`, point);
    });

    // IMPROVED CENTERING LOGIC
    if (points.length === 0) {
      // No activities: center to default location
      const defaultCenter = mapConfig?.center || { lat: 1.3521, lng: 103.8198 };
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(12);
      console.log("No activities - centered to default location");
      return;
    }

    if (points.length === 1) {
      //If only single activity-->center on it with closer zoom
      mapRef.current.setCenter(points[0]);
      mapRef.current.setZoom(14);
      console.log("Single activity - centered on activity");
      return;
    }

    //More than 1 activity--> center and showall points & routes
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));

    const origin = points[0];
    const destination = points[points.length - 1];
    const waypoints = points.slice(1, -1).map((p) => ({
      location: p,
      stopover: true,
    }));

    console.log("Drawing route with origin:", origin, "destination:", destination, "waypoints:", waypoints);

    directionsServiceRef.current.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        console.log("Directions API response status:", status);
        if (status === "OK" && result) {
          directionsRendererRef.current.setDirections(result);
          
          //Fit bounds to show entire route
          const routeBounds = new window.google.maps.LatLngBounds();
          result.routes[0].overview_path.forEach((point) => {
            routeBounds.extend(point);
          });
          
          mapRef.current.fitBounds(routeBounds);
          
          mapRef.current.panBy(0, -50);
          console.log("Route drawn and map fitted to bounds successfully");
        } else {
          console.error("Directions request failed:", status, result);
          mapRef.current.fitBounds(bounds);
          console.log("Directions failed - fallback to activity bounds");
        }
      }
    );
  }, [activityCoords, selectedDate, mapConfig]);

  //Delete activity
  const handleDeleteActivity = async (index) => {
    if (!window.confirm(t("msg_confirmdel"))) return;

    await Axios
      .delete("Itinerary/DeleteActivity", {
        data: { activityid: index, i_id: tripId },
        withCredentials: true,
      })
      .then((response) => {
        if (response.data === true) {
          setActivities((prev) => prev.filter((a) => a.id !== index));
          setActivityCoords((prev) => prev.filter((a) => a.id !== index));
        }
      });

    alert(t("msg_deleted"));
  };

  const arrangeItinerary = async () => {
    await Axios.get("Itinerary/ArrangeItinerary", {
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
        ← {t("back_btn")}
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
          <h2>{t("title")}</h2>

          {useMemo(() => {
            const validActivities = filteredActivities.filter((act) => act.id && act.name);
            return validActivities.length > 0 ? (
              <>
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
                          {new Date(d).toLocaleDateString(lang, {
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
                    {isArranging ? t("arranging") : t("arrange")}
                  </button>
                </div>

                <div className="activities-section">
                  {validActivities.map((act) => (
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
                          {t("edit_btn")}
                        </button>

                        <button
                          className="activity-delete-btn"
                          disabled={isArranging}
                          onClick={() => handleDeleteActivity(act.id)}
                        >
                          {t("delete_btn")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null;
          }, [filteredActivities, activities, selectedDate, isArranging, t, tripId, navigate])}

          <button
            className="add-activity-big"
            disabled={isArranging}
            onClick={() => navigate(`/mytrips/trip/activity/create/${tripId}`)}
          >
            {t("addact_btn")} +
          </button>
        </div>

        <div className="right-side">
          {!mapConfig ? (
            <p className="map-loading-text">{t("loading_map")}</p>
          ) : (
            <div
              ref={mapDivRef}
              style={{ width: "100%", height: "100%", borderRadius: "12px" }}
            />
          )}
        </div>
      </div>

      {!Loading && trip?.type === "Group" && 
      (<button className="floating-chat-btn" onClick={() => setShowChat(true)} title="Chat">
        {t("chat_btn")}
      </button>)}
      {showChat && ( <ItineraryChat onClose={() => {setShowChat(false);}} i_id={tripId}/>)}
    </div>
  );
}

export default ItineraryPage;