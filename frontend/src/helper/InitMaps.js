import React from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

export default function InitMaps({ mapData }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: mapData.apiKey, // always valid
  });

  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: "600px", height: "400px" }}
      center={mapData.center}
      zoom={12}
    >
      {mapData.markers?.map((m) => (
        <Marker key={m.id} position={{ lat: m.lat, lng: m.lng }} />
      ))}
    </GoogleMap>
  );
}