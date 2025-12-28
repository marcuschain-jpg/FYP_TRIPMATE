import React, { useEffect, useState } from "react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import useMapData from "../hooks/FetchMapData";

function InitMaps({ DefaultMapData, centerChange }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: DefaultMapData.apiKey, // from keys.env
  });

  const [mapData, setMapData] = useState({
    apiKey:DefaultMapData.apiKey,
    center:DefaultMapData.center
  });

  useEffect(() => {
    if(centerChange){
    setMapData(prev => ({
      ...prev,
      center:{lat:centerChange.lat, lng:centerChange.lng}
    }))
    }
  },[centerChange])

  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: "600px", height: "400px" }}
      center={mapData.center}
      zoom={12}
    >
      {mapData.center && (
        <MarkerF position={mapData.center} />
      )}
    </GoogleMap>
  );
}

export default InitMaps;