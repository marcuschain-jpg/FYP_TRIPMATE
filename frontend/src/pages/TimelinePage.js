import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Timeline.css";
import Axios from '../hooks/Axios';
import { useTranslation } from "react-i18next";

function TimelinePage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("itinerary");

  const [gallery, setGallery] = useState([]);
  const [selected, setSelected] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [itineraryName, setItineraryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios.get("Timeline/GetPhotoTimeline", {params:{i_id: tripId}, withCredentials:true})
      .then(response => {
      renderLoadGallery(response.data);
      setLoading(false);
    })
    .catch(err => {
      const errData = err.response;
      const errorMsg = errData.status + ": " + errData.data.message;
      const errStatus = err.response.status;
      if([401, 403].includes(errStatus)){
        navigate(`/login/${errorMsg}`);
      }
      else if([500].includes(errStatus)){
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
    setItineraryName(res[0].itinerary_name)
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

    const name = prompt(`${t("tl_err_name")}:`);
    if (!name) return;

    await Axios.post("Timeline/SaveTimeline", {i_id:tripId, name:name, timeline_photos:timeline}, {withCredentials:true})
    .then(res => {
      if(res.data)
      {
        alert(t("tl_succ_saved"));
      }
    })
    .catch(err =>{
      if(err.response)
      {
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

  { loading && <p>{t("Loading")}</p> }

  return (
    <div className="timeline-page">
      <button className="back-btn" onClick={() => navigate(`/mytrips/trip/${tripId}`)}>
        ← {t("back_btn")}
      </button>

      <h1 className="timeline-title">{itineraryName} — {t("tl_timeline")}</h1>

      {/*"View saved timelines" button*/}
      <button
        className="generate-btn"
        onClick={() => navigate(`/mytrips/trip/saved-timelines/${tripId}`)}
      >
        {t("tl_viewsavedtimeline_btn")}
      </button>

      <p className="timeline-subtitle">
        {t("tl_instructions")}
      </p>

      <h2 className="section-heading">{t("tl_selectphoto")}</h2>

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
        {t("tl_generatetimeline_btn")}
      </button>

      {/*Render generated timeline*/}
      {timeline.length > 0 && (
        <>
          <h2 className="section-heading">{t("tl_generatetimeline")}</h2>

          <button className="generate-btn" onClick={saveTimeline}>
            {t("tl_savetimeline_btn")}
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
