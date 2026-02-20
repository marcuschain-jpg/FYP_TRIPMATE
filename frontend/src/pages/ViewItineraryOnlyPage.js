import { useParams } from "react-router-dom";
import React, { useState, useEffect, useRef, useMemo } from "react";
import "../styles/ViewItineraryOnly.css";
import Axios from '../hooks/Axios.js';

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

function ViewItineraryOnlyPage() {
  const { uuid } = useParams(); 

  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [Loading, setLoading] = useState(true);
  const [activityCoords, setActivityCoords] = useState([]);
  const [mapConfig, setMapConfig] = useState(null);
  const [lang, setLang] = useState("en");

  //Google maps refs
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef([]);

  const [isMapReady, setIsMapReady] = useState(false);

  //Get google maps key from backend
  useEffect(() => {
    Axios
      .get("Itinerary/maps", {
        withCredentials: true, 
      })
      .then((res) => {
        console.log("✓ Maps config response:");
        if (res.data?.apiKey) {
          setMapConfig(res.data);
          console.log("✓ Map config set successfully with apiKey from backend");
        } else {
          console.error("✗ No apiKey in response:");
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

  function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve();

    const existing = document.querySelector('script[data-google-maps="true"]');
    if (existing) {
      // If script exists, wait for google.maps to be available
      if (window.google && window.google.maps) {
        return resolve();
      }
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Google Maps timeout'));
      }, 10000);
      return;
    }

    // Create callback
    const callbackName = `initGoogleMaps_${Date.now()}`;
    window[callbackName] = () => {
      delete window[callbackName];
      resolve();
    };

    const script = document.createElement("script");
    script.dataset.googleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = (error) => {
      delete window[callbackName];
      reject(error);
    };
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
 
       if (!window.google || !window.google.maps) {
         console.error("Google Maps not available after loading");
         return;
       }
 
       if (mapDivRef.current && !mapRef.current) {
         console.log("Creating map instance");
         const center = (trip?.t_lat && trip?.t_lng) 
           ? { lat: trip.t_lat, lng: trip.t_lng }
           : mapConfig.center;
 
         mapRef.current = new window.google.maps.Map(mapDivRef.current, {
           center,
           zoom: 12,
           styles: [],
           mapTypeControl: true,
           streetViewControl: false,
           fullscreenControl: true,
         });
 
         // Wait for map to be fully initialized
         window.google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
           console.log("Map is ready - initializing directions");
           
           // Initialize directions objects after map is ready
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
 
           console.log("Map and directions initialized successfully");
           setIsMapReady(true); // Signal that map is ready
         });
       }
     } catch (e) {
       console.error("Google Maps initialization failed:", e);
     }
   })();
 
   return () => {
     cancelled = true;
   };
 }, [mapConfig, trip?.t_lat, trip?.t_lng]);

  //Load activities
  useEffect(() => {
    if (!uuid) {
      console.error("No UUID provided");
      setLoading(false);
      return;
    }

    console.log("Loading activities for UUID:", uuid);

    Axios.get("Itinerary/GetAllActivitiesViewOnly",{params:{token: uuid}})
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];

        if (!data || data.length === 0) {
          console.warn("No activities found for this itinerary");
          setLoading(false);
          return;
        }

        //Format trip dates
        const mapTrips = {
          id: uuid,
          name: data?.[0]?.itinerary_name,
          start: formatDateForDisplay(data?.[0]?.start_date),
          end: formatDateForDisplay(data?.[0]?.end_date),
          type: data?.[0]?.type,
          numPpl: data?.[0]?.num_ppl,
          t_lat: parseFloat(data?.[0]?.i_latitude),
          t_lng: parseFloat(data?.[0]?.i_longitude)
        };
        console.log("Trip object:", mapTrips);
        setTrip(mapTrips);

        const mapAct = data.map((a) => ({
          id: a.activity_id,
          name: a.activity_name,
          date: normDate(a.activity_date),
          address: a.activity_address,
          location: a.activity_location,
          cost: parseFloat(a.activity_cost) || 0,
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

        //Set default date to first date
        const uniqueDates = Array.from(new Set(mapAct.map((x) => x.date))).sort();
        if (uniqueDates.length > 0) setSelectedDate(uniqueDates[0]);

        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        console.error("Error loading itinerary:", err);
        console.error("Error response:", err?.response?.data);
        console.error("Error status:", err?.response?.status);
      });
  }, [uuid]);

  //List matches map date logic
  const filteredActivities = useMemo(
    () => activities.filter((a) => normDate(a.date) === normDate(selectedDate)),
    [activities, selectedDate]
  );

  //Calculate costs
  const selectedDateCost = useMemo(() => {
    return filteredActivities.reduce((sum, activity) => sum + (activity.cost || 0), 0);
  }, [filteredActivities]);

  const totalTripCost = useMemo(() => {
    return activities.reduce((sum, activity) => sum + (activity.cost || 0), 0);
  }, [activities]);

  const costsByDate = useMemo(() => {
    const costs = {};
    activities.forEach((activity) => {
      const date = normDate(activity.date);
      costs[date] = (costs[date] || 0) + (activity.cost || 0);
    });
    return costs;
  }, [activities]);

  //Draw driving route and markers
  useEffect(() => {
    if (!mapRef.current || !(window.google && window.google.maps)) return;
    if (!selectedDate) return;
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;
    if (!isMapReady) {
      console.log("Map not ready yet, skipping route draw");
      return;
    }

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

    if (points.length === 0) {
      const defaultCenter = (trip?.t_lat && trip?.t_lng) 
        ? { lat: trip.t_lat, lng: trip.t_lng }
        : mapConfig.center;
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(12);
      console.log("No activities - centered to default location");
      return;
    }

    if (points.length === 1) {
      mapRef.current.setCenter(points[0]);
      mapRef.current.setZoom(14);
      console.log("Single activity - centered on activity");
      return;
    }

    //Multiple activities - show all with route
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
  }, [isMapReady, activityCoords, selectedDate, mapConfig]);

  //Render
  const tripName = trip?.name || "Trip";
  const tripStart = trip?.start || "";
  const tripEnd = trip?.end || "";

  return (
    <div className="view-only-container">
      <div className="view-only-header">
        <h1>{tripName}</h1>
        <p className="trip-date">
          {tripStart} – {tripEnd}
        </p>
      </div>

      <div className="view-only-layout">
        <div className="view-only-left">
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
                      {new Date(d).toLocaleDateString(lang, {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                      })}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/*cost summary cards*/}
          {activities.length > 0 && (
            <div className="cost-summary-cards">
              <div className="cost-card selected-date">
                <div className="cost-label">Today's Cost</div>
                <div className="cost-amount">${selectedDateCost.toFixed(2)}</div>
              </div>
              <div className="cost-card total-trip">
                <div className="cost-label">Total Trip Cost</div>
                <div className="cost-amount">${totalTripCost.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/*Daily cost breakdown table*/}
          {activities.length > 0 && (
            <>
              <h2 style={{ marginTop: '28px', marginBottom: '14px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Daily Breakdown</h2>
              <div className="cost-breakdown-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(costsByDate)
                      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                      .map(([date, cost]) => (
                        <tr key={date}>
                          <td>
                            {new Date(date).toLocaleDateString(lang, {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                          <td className="cost-cell">${cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    <tr className="total-row">
                      <td>Total</td>
                      <td className="cost-cell">${totalTripCost.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="activities-section">
            {Loading && <p>Loading itinerary...</p>}
            {!Loading && filteredActivities.length === 0 && <p>No activities for this day.</p>}

            {!Loading &&
              filteredActivities.map((act) => (
                <div key={act.id} className="activity-card-view-only">
                  <h3>{act.name}</h3>
                  <p>
                    <strong>{act.date}</strong>
                  </p>
                  <p>{act.location}</p>
                  {act.address && <p>{act.address}</p>}
                  {act.cost > 0 && (
                    <p className="activity-cost">
                      <strong>Cost: ${act.cost.toFixed(2)}</strong>
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="view-only-right">
          {!mapConfig ? (
            <p className="map-loading-text">Loading map…</p>
          ) : (
            <div
              ref={mapDivRef}
              style={{ width: "100%", height: "100%", borderRadius: "12px" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewItineraryOnlyPage;