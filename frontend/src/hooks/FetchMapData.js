import { useState, useEffect } from "react";
import Axios from '../hooks/Axios'

export default function useMapData() {
  const [mapData, setMapData] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      const res = await Axios.get("Itinerary/maps", {withCredentials:true});
      setMapData(res.data);
    };
    fetchMapData();
  }, []);

  return mapData;
}