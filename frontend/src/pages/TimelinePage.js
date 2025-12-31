import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Timeline.css";
import axios from "axios";

function TimelinePage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [gallery, setGallery] = useState([]);
  const [selected, setSelected] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8080/Timeline/GetPhotoTimeline", {params:{i_id: tripId}, withCredentials:true})
      .then(response => {
      renderLoadGallery(response.data);
      setLoading(false);
    })
    .catch(err => {
      const errData = err.response;
      const errorMsg = errData.status + ": " + errData.data.message;
      if(err.response.status === 401 || 403){
        navigate(`/login/${errorMsg}`);
      }
      else if(err.response.status === 500){
        console.log(errorMsg);
      }
    });
  }, [])

  const renderLoadGallery = (res) => {
    
    setGallery(res
    .filter(obj => obj.photo_id !== null)
    .map(obj => ({      
        id: obj.photo_id,
        url: obj.photo_url,
        name: obj.photo_title,
        date: obj.activity_date
    })));
  }

  //Toggle photo selection
  const toggleSelect = (item) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((s) => s !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  //Generate timeline--> zigzag format (one up one down)
  const generateTimeline = () => {
    const sorted = [...selected].sort((a, b) => a.date?.localeCompare(b.date));

    const positioned = sorted.map((item, index) => {
      const media = gallery.find((m) => m.id === item.id);

      return {
        mediaId: media.id,
        url: media.url,
        name: media.name,
        date: media.date,
        x: 10 + (index * (80 / (sorted.length - 1))),
        y: index % 2 === 0 ? 20 : 65, //zigzag
      };
    });

    setTimeline(positioned);
  };

  //Save timeline with positions
  const saveTimeline = async() => {
    if (timeline.length === 0) return;

    const name = prompt("Enter a name for this timeline:");
    if (!name) return;

    //const tripKey = getTripKey();
    //const saved = JSON.parse(localStorage.getItem(tripKey) || "[]");

    /*const updatedTrips = saved.map((t) => {
      if (t.id !== trip.id) return t;

      const newTimeline = {
        id: Date.now(),
        name,
        createdAt: new Date().toISOString(),
        nodes: timeline 
      };

      return {
        ...t,
        savedTimelines: [...(t.savedTimelines || []), newTimeline],
      };
    });

    localStorage.setItem(tripKey, JSON.stringify(updatedTrips));*/

    await axios.post("http://localhost:8080/Timeline/SaveTimeline", {i_id:tripId, name:name, timeline_photos:timeline}, {withCredentials:true})
    .then(res => {
      if(res.data)
      {
        alert("Timeline saved!");
      }
    })
    .catch(err =>{
      const errData = err.response;
      const errorMsg = errData.status + ": " + errData.data.message;
      if(err.response.status === 401|| err.response.status === 403)
      {
        navigate(`/login/${errorMsg}`);
      }
      else if(err.response.status === 500)
      {
        console.log(errorMsg);  
      }
    });

    const newTimeline = {
        id: Date.now(),
        name,
        createdAt: new Date().toISOString(),
        nodes: timeline 
      };
    console.log(newTimeline);
  };

  { loading && <p>Loading..</p> }

  return (
    <div className="timeline-page">
      <button className="back-btn" onClick={() => navigate(`/mytrips/trip/${tripId}`)}>
        ← Back
      </button>

      <h1 className="timeline-title">To Singapore — Timeline</h1>

      {/*"View saved timelines" button*/}
      <button
        className="generate-btn"
        onClick={() => navigate(`/mytrips/trip/saved-timelines/${tripId}`)}
      >
        View Saved Timelines
      </button>

      <p className="timeline-subtitle">
        Select photos from your media library to generate a visual trip timeline.
      </p>

      <h2 className="section-heading">Select Photos</h2>

      <div className="timeline-select-grid">
        {gallery.map((item) => (
          <div
            key={item.id}
            className={`timeline-photo-select ${
              selected.includes(item) ? "selected" : ""
            }`}
            onClick={() => toggleSelect(item)}
          >
            <img src={item.url} alt={item.name} />
            <p>{item.name}</p>
            <p>{item.date}</p>
          </div>
        ))}
      </div>

      <button
        className="generate-btn"
        disabled={selected.length === 0}
        onClick={generateTimeline}
      >
        Generate Timeline
      </button>

      {/*Render generated timeline*/}
      {timeline.length > 0 && (
        <>
          <h2 className="section-heading">Generated Timeline</h2>

          <button className="generate-btn" onClick={saveTimeline}>
            Save Timeline
          </button>

          <div className="timeline-render-box">

            {/*Connecting line for points on timeline*/}
            <svg className="timeline-svg" viewBox="0 0 1000 400" preserveAspectRatio="none">
              <polyline
                points={timeline
                  .map((p) => `${(p.x / 100) * 1000},${(p.y / 100) * 400}`)
                  .join(" ")}
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/*Individual nodes*/}
            {timeline.map((item) => (
              <div
                key={item.mediaId}
                className="timeline-node"
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
              >
                <img src={item.url} alt={item.name} className="timeline-circle" />
                <div className="pin">📍</div>
                <p className="timeline-caption">{item.name}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TimelinePage;
