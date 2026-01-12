import React, { useEffect, useState } from "react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import useMapData from "../hooks/FetchMapData";

function InitMaps({ DefaultMapData, centerChange, activityCoords }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: DefaultMapData.apiKey, // from keys.env
  });

  const [mapData, setMapData] = useState(null);

  useEffect(() => {
    if(!mapData||!centerChange) return;
    mapData.panTo({
      lat: centerChange.lat,
      lng: centerChange.lng
    });
  },[mapData,centerChange])

  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: "600px", height: "400px" }}
      center={DefaultMapData.center}
      zoom={12}
      onLoad={setMapData}
    >
      {activityCoords.map(coord => (
        <div key={coord.id}>
          <MarkerF position={coord.coords} />
        </div>
      ))}
    </GoogleMap>
  );
}

export default InitMaps;