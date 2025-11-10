import { useState, useEffect } from "react";
import axios from "axios";

export default function useMapData() {
  const [mapData, setMapData] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      const res = await axios.get("http://localhost:8080/Itinerary/maps");
      setMapData(res.data);
    };
    fetchMapData();
  }, []);

  return mapData;
}