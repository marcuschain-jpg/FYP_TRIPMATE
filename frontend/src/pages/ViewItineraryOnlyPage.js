import { useParams } from "react-router-dom";
import React, { useState, useEffect, useRef, useMemo } from "react";
import "../styles/ViewItineraryOnly.css";
import Axios from '../hooks/Axios.js';

//Normalize any date string to YYYY-MM-DD
function normDate(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

//Date formatting (DD/MM/YYYY)
function formatDateForDisplay(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
}

function ViewItineraryOnlyPage() {
  const { uuid } = useParams(); 

  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [activityCoords, setActivityCoords] = useState([]);
  const [mapConfig, setMapConfig] = useState(null);

  //Google maps refs
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    Axios
      .get("Itinerary/maps", {
        withCredentials: true, 
      })
      .then((res) => {
        if (res.data?.apiKey) {
          setMapConfig({
            apiKey: res.data.apiKey,
            center: res.data.center || { lat: 1.3521, lng: 103.8198 },
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load map config", err);
      });
  }, []);

  function loadGoogleMaps(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) return resolve();

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function clearMarkers() {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }

  function clearDirections() {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
  }
  /*Init map*/
  useEffect(() => {
    if (!mapConfig?.apiKey) return;

    (async () => {
      await loadGoogleMaps(mapConfig.apiKey);

      if (mapDivRef.current && !mapRef.current) {
        mapRef.current = new window.google.maps.Map(mapDivRef.current, {
          center: mapConfig.center,
          zoom: 12,
        });

        directionsServiceRef.current =
          new window.google.maps.DirectionsService();

        directionsRendererRef.current =
          new window.google.maps.DirectionsRenderer({
            map: mapRef.current,
            suppressMarkers: true,
          });
      }
    })();
  }, [mapConfig]);

  useEffect(() => {
    Axios.get("Itinerary/GetAllActivitiesViewOnly",{params:{token: uuid}})
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];

        if (data.length === 0) {
          setLoading(false);
          return;
        }

        setTrip({
          name: data[0].itinerary_name,
          start: formatDateForDisplay(data[0].start_date),
          end: formatDateForDisplay(data[0].end_date),
        });

        const acts = data.map((a) => ({
          id: a.activity_id,
          name: a.activity_name,
          date: normDate(a.activity_date),
          address: a.activity_address,
          location: a.activity_location,
        }));

        const coords = data
          .filter((a) => a.latitude && a.longitude)
          .map((a) => ({
            id: a.activity_id,
            date: normDate(a.activity_date),
            coords: {
              lat: Number(a.latitude),
              lng: Number(a.longitude),
            },
          }));

        setActivities(acts);
        setActivityCoords(coords);

        const dates = [...new Set(acts.map((a) => a.date))].sort();
        if (dates.length > 0) setSelectedDate(dates[0]);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load view-only itinerary", err);
        setLoading(false);
      });
  }, [uuid]);

  const filteredActivities = useMemo(
    () => activities.filter((a) => a.date === selectedDate),
    [activities, selectedDate]
  );

  useEffect(() => {
    if (!mapRef.current || !selectedDate) return;

    const points = activityCoords
      .filter((a) => a.date === selectedDate)
      .map((a) => a.coords)
      .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));

    clearMarkers();
    clearDirections();

    points.forEach((p, i) => {
      markersRef.current.push(
        new window.google.maps.Marker({
          position: p,
          map: mapRef.current,
          label: String(i + 1),
        })
      );
    });

    if (points.length < 2) return;

    directionsServiceRef.current.route(
      {
        origin: points[0],
        destination: points[points.length - 1],
        waypoints: points.slice(1, -1).map((p) => ({ location: p })),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          directionsRendererRef.current.setDirections(result);
        }
      }
    );
  }, [activityCoords, selectedDate]);

  /*Render*/
  return (
    <div className="view-only-container">
      <div className="view-only-header">
        <h1>{trip?.name}</h1>
        <p className="trip-date">
          {trip?.start} – {trip?.end}
        </p>
      </div>

      <div className="view-only-layout">
        <div className="view-only-left">
          <h2>Activities</h2>

          {!loading && (
            <div className="date-row">
              <select
                className="date-filter-dropdown"
                value={selectedDate}
                onChange={(e) => setSelectedDate(normDate(e.target.value))}
              >
                {[...new Set(activities.map((a) => a.date))].map((d) => (
                  <option key={d} value={d}>
                    {new Date(d).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="activities-section">
            {filteredActivities.map((act) => (
              <div key={act.id} className="activity-card-view-only">
                <h3>{act.name}</h3>
                <p><strong>{act.date}</strong></p>
                <p>{act.location}</p>
                {act.address && <p>{act.address}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="view-only-right">
          {!mapConfig ? (
            <p className="map-loading-text">Loading map…</p>
          ) : (
            <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewItineraryOnlyPage;
