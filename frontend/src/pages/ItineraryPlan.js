import InitMaps from "../helper/InitMaps";
import AddNewActivity from "../helper/AddNewActivity";
import UploadPhoto from "../helper/UploadPhoto";
import useMapData from "../hooks/FetchMapData";
import '../styles/Itinerary.css'

function ItineraryPlan() {
    const mapData = useMapData();

    // Loading states
    if (!mapData) return <div>Loading map data...</div>;
    //if (mapData) return console.log(mapData)

  return (
    <div>
      <h1>Map Page</h1>
      <div className="container">
        <div className="add-itinerary-section">
          <AddNewActivity />
        </div>

        <div className="maps-section">
            <InitMaps mapData={mapData} />
        </div>
        <div className="upload-photo">
          <UploadPhoto />
        </div>
      </div>
    </div>
  );
}

export default ItineraryPlan;
