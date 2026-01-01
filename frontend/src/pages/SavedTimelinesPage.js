import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Timeline.css";
import axios from 'axios';

function SavedTimelinesPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [timeline, setTimeline] = useState([
    {
      id: 1,
      name: "new timeline!",
      nodes:
      [
        {
        date: "2025-12-12",
        mediaid: 1,
        name: "me on a beach",
        url: "http://localhost:8080/images/me_beach.jpg",
        x: 10,
        y: 10
        },
        {
          date: "2025-12-24",
          mediaid: 2,
          name: "resevoir picture 2",
          url: "http://localhost:8080/images/image.jpg",
          x: 50,
          y: 65
        },
        {
          date: "2025-12-25",
          mediaid: 3,
          name: "resevoir picture 3",
          url: "http://localhost:8080/images/download.jpg",
          x: 90,
          y: 20
        }
      ]
    },
    {
      id: 2,
      name: "another timeline!",
      nodes:
      [
        {
        date: "2025-12-12",
        mediaid: 1,
        name: "me on a beach",
        url: "http://localhost:8080/images/me_beach.jpg",
        x: 10,
        y: 10
        },
        {
          date: "2025-12-24",
          mediaid: 2,
          name: "resevoir picture 2",
          url: "http://localhost:8080/images/image.jpg",
          x: 50,
          y: 65
        },
        {
          date: "2025-12-25",
          mediaid: 3,
          name: "resevoir picture 3",
          url: "http://localhost:8080/images/download.jpg",
          x: 90,
          y: 20
        }
      ]
    }
  ]);

  //Load saved timelines
  /*useEffect(() => {
    const tripKey = getTripKey();
    const trips = JSON.parse(localStorage.getItem(tripKey) || "[]");
    const found = trips.find((t) => t.id === Number(tripId));
    if (found) setTrip(found);
  }, [tripId]);*/

  //if (!trip) return <p>Trip not found.</p>;

  useEffect(() => {
    axios.get("http://localhost:8080/Timeline/GetSavedTimelines", {params:{i_id: tripId}, withCredentials:true})
    .then(response => {
      renderLoadTimelines(response.data);
      setLoading(false);
    })
    .catch(err => {
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
  }, []);

  const renderLoadTimelines = (res) => {
    const rawTimelinesArr = res.map(item => {return{
      id: item.timeline_id,
      name: item.timeline_name,
      nodes: []
    }})
    const timelineArr = [];
    rawTimelinesArr.forEach(element => {
      if(!timelineArr.find(item => item.id === element.id)) timelineArr.push(element)
    });
    res.forEach(item => {
      const curTimelineArr = timelineArr.find(arrItem => arrItem.id === item.timeline_id);
      if(curTimelineArr){
        curTimelineArr.nodes.push({
        date: item.activity_date,
        mediaid: item.photo_id,
        name: item.photo_title,
        url: item.photo_url,
        x: item.x_coord,
        y:item.y_coord
      });
      }
    });
    console.log(timelineArr);

    setTimeline(timelineArr);
  };

  const timelines = timeline || [];

  //Delete saved timeline
  const handleDelete = async(id) => {
    //const timeline = timelines.find((tl) => tl.id === id);
    const selectedTimeline = timeline.filter(i => i.id === id)
    //Confirmation popup message
    const ok = window.confirm(
      `Are you sure you want to delete the timeline "${selectedTimeline[0].name}"?`
    );

    if (!ok) return; 

    /*const tripKey = getTripKey();
    const trips = JSON.parse(localStorage.getItem(tripKey) || "[]");

    const updatedTrips = trips.map((t) => {
      if (t.id !== trip.id) return t;

      return {
        ...t,
        savedTimelines: t.savedTimelines.filter((tl) => tl.id !== id),
      };
    });

    localStorage.setItem(tripKey, JSON.stringify(updatedTrips));
    setTrip(updatedTrips.find((t) => t.id === trip.id));*/

    //Success popup message 
    

    await axios.delete("http://localhost:8080/Timeline/DeleteSavedTimeline", {data:{t_id:id}, withCredentials:true})
    .then(res => {
      if(res.data === true){
        const updatedTimelines = timeline.filter(i => i.id !== id)
        setTimeline(updatedTimelines);
        alert("Timeline deleted successfully.");
      }
    })
    .catch(err => {
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
  };

  //View timeline inside the page
  const handleView = (timelineId) => {
    const tl = timelines.find((t) => t.id === timelineId);
    if (tl) setActiveTimeline(tl);
  };

  {loading && <p>Loading..</p>}

  return (
    <div className="timeline-page">
      
      <button
        className="back-btn"
        onClick={() => {
          if (activeTimeline) {
            setActiveTimeline(null);
          } else {
            navigate(-1);
          }
        }}
      >
        ← Back
      </button>

      {/*View saved timeline mode*/}
      {activeTimeline && (
        <>
          <h1 className="timeline-title">{activeTimeline.name}</h1>

          <div className="timeline-render-box">

            {/*Connecting line between nodes on timeline*/}
            <svg
              className="timeline-svg"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
            >
              <polyline
                points={(activeTimeline.nodes || [])
                  .map((p) => `${(p.x / 100) * 1000},${(p.y / 100) * 400}`)
                  .join(" ")}
                fill="none"
                stroke="white"
                strokeWidth="6"
              />
            </svg>

            {/*Individual timeline nodes*/}
            {(activeTimeline.nodes || []).map((item, index) => (
              <div
                key={index}
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

      {/*Displays saved timeline--> grid formatting*/}
      {!activeTimeline && (
        <>
          <h1 className="timeline-title">Saved Timelines</h1>

          <div className="timeline-grid">
            {timelines.map((tl) => {
              const preview =
                tl.nodes?.[0]?.url ||
                "https://via.placeholder.com/300x200?text=Timeline";

              return (
                <div key={tl.id} className="timeline-card">
                  <img className="timeline-thumb" src={preview} alt="preview" />

                  <h3 className="timeline-title" style={{ color: "#053f6b" }}>
                    {tl.name}
                  </h3>

                  <div className="timeline-actions">
                    <button className="view-btn" onClick={() => handleView(tl.id)}>
                      View
                    </button>

                    <button className="delete-btn" onClick={() => handleDelete(tl.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {timelines.length === 0 && (
            <p style={{ marginTop: "20px" }}>No saved timelines yet.</p>
          )}
        </>
      )}
    </div>
  );
}

export default SavedTimelinesPage;
