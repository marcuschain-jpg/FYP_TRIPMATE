import InitMaps from "../components/InitMaps";
import AddNewActivity from "../components/AddNewActivity";
import UploadPhoto from "../components/UploadPhoto";
import useMapData from "../hooks/FetchMapData";
import '../styles/Itinerary.css';
import Test from "../components/Test";

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
          <Test />
        </div>
      </div>
    </div>
  );
}

export default ItineraryPlan;
