import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Axios from '../hooks/Axios.js';
import "../styles/Itinerary.css";
import "../styles/Collab.css";
import link from "../Assets/link.png"
import whatsapp from "../Assets/Whatsapp.png"
import telegram from "../Assets/Telegram.png"
import ItineraryChat from "../components/ItineraryChat";
import { useTranslation } from "react-i18next";

//Date formatter function--> so that correct data appears across all pages and can be updatd through edit button
const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return "";
  
  let date;
  
  if (typeof dateValue === "string") {
    date = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return "";
  }
  
  if (isNaN(date.getTime())) {
    return "";
  }
  
  return date.toLocaleDateString("en-GB");
};

function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { t,i18n } = useTranslation("tripdetails");

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [lang, setLang] = useState(i18n.language||"en");

  //State to control collaborator modal
  const [showCollaborators, setShowCollaborators] = useState(false);

  //Dummy collaborators (UI only)
  const [collaborators, setCollaborators] = useState([]);

  //Input value
  const [newCollaborator, setNewCollaborator] = useState("");

  //Chat modal
  const[showChat, setShowChat] = useState(false);

  //Load trips and set current trip
  useEffect(() => {
    Axios.get("Itinerary/GetItinerary", {
        params: { i_id: tripId },
        withCredentials: true
      })
      .then((response) => {
        renderLoadTrip(response.data);
        setLoading(false);
      })
      .catch(err =>{
        if(err.response){
          if(err.response.status === 401 || err.response.status === 403)
          {
            const errData = err.response;
            const errorMsg = errData.status + ": " + errData.data.message;
            navigate(`/login/${errorMsg}`);
          }
        }
        else console.log("general error", err);      
      });
      
    Axios.post("GetRoleForUser", {}, {withCredentials:true})
    .then(res => {
      setUserRole(res.data.role);
    })
  }, []);

  useEffect(() => {
    if(userRole === "premium") setIsPremium(true);
  }, [userRole])

  useEffect(() => {
      // Run when ititialized(default) & lang changed
      i18n.on("languageChanged", function(lng) {
        setLang(lng);
      });
  
      return() => {
        i18n.off("languageChanged", function(lng) {});
      };
    }, [i18n])

  const renderLoadTrip = (res) => {
    //Format dates using the formatter function
    const formattedSDate = formatDateForDisplay(res[0].start_date);
    const formattedEDate = formatDateForDisplay(res[0].end_date);

    let mapCollab = "";

    const mapTrips = {
      id: res[0].itinerary_id,
      name: res[0].itinerary_name,
      destination: res[0].itinerary_dest,
      start: formattedSDate,
      end: formattedEDate,
      status: res[0].completed,
      type: res[0].type,
      numPpl: res[0].num_ppl,
      isHost: res[0].isHost
    };

    if(res.length > 1){
      mapCollab = [
        {name: "Me", email:""},
        ...res
        .filter (item => item.email !== null)
        .map(item => ({name: item.first_name + " " + item.last_name, email: item.email}))
      ];
    }
    else{
      mapCollab = [
        {name: "Me", email: ""}
      ]
    }
    
    console.log("test!!", mapCollab);
    setCollaborators(mapCollab);
    setTrip(mapTrips);
  };

  const updateTripStatus = (status) => {
    //main method to update completed
    Axios
      .patch("Itinerary/UpdateItineraryComplete", {
        i_id: tripId,
        completed: status,
      }, {withCredentials:true})
      .then((response) => {
        if (response.data === true) {
          setTrip({ ...trip, status });
        }
      });
  };

  //Add collaborator (dummy only)
  const handleAddCollaborator = async() => {
    if (newCollaborator.trim() === "") {
      alert(t("err_enteremail"));
      return;
    }
    if (trip.numPpl >= 5){
      console.log(trip.numPpl)
      alert(t("err_maxcollab"));
      return;
    }

    //Prevent duplicates
    if (collaborators.includes(newCollaborator)){
      alert(t("err_alrcollab"))
      return;
    }

    try{
      const res = await Axios.post("Itinerary/AddCollaborator", {i_id:tripId, email:newCollaborator, i_name: trip.name}, {withCredentials:true})
      if(res.data){
      //setCollaborators(prev => [...prev, {name: `${res.data[0].first_name} ${res.data[0].last_name}`, email: res.data[0].email}]);
      alert(t("succ_email"));
      setNewCollaborator("");
    }
    }
    catch(err) {
      if(err.response){
        if(err.response.status === 401 || err.response.status === 403)
        {
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }      
        if(err.response.status === 500)
        {
          const errData = err.response;
          const errorMsg = errData.data.message;
          setNewCollaborator("");
          alert(errorMsg);
        }
      }
      else{
        console.log(err);
      }
    }
  };

  //Delete collaborator with confirmation
  const handleDeleteCollaborator = async(item) => {
    const confirmDelete = window.confirm(
      `${t("modal_confirmdel_pt1")} ${item.name} ${t("modal_confirmdel_pt2")}`
    );

    if (confirmDelete) {
      let deleteConfirm = false; // Check if db returns true if already deleted
      try{
        const res = await Axios.delete("Itinerary/DeleteCollaborator", {data:{i_id:tripId, email:item.email, type:trip.type}, withCredentials:true})
        deleteConfirm = res.data;
      }
      catch(err){
        if(err.response.status === 401 || err.response.status === 403)
        {
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }      
        if(err.response.status === 500)
        {
          const errData = err.response;
          const errorMsg = errData.data.message;
          alert(errorMsg);
        }
      }

      if(deleteConfirm){
        setCollaborators(
          collaborators.filter(member => member.email !== item.email)
        );
      }
    }
  };

  //Save collaborators and update parent component
  const handleSaveCollaborators = () => {
    //Dispatch event to notify MyTripsPage of the update
    const event = new CustomEvent("updateCollaborators", {
      detail: {
        tripId: trip.id,
        collaborators: collaborators
      }
    });
    window.dispatchEvent(event);
    setShowCollaborators(false);
  };

  // Handle sharing itinerary externally
  const handleShareExt = async(shareType) => {
    // link, ws, tele
    let link = '';

    try{
      if(shareType === "ws" || shareType === "tele"){
        const res = await Axios.post("Itinerary/ShareExt", {i_id: tripId, shareType}, {withCredentials:true});
        if(res.data){
          window.open(res.data, '_blank', 'noopener, noreferrer');
          alert("Shared successfully!");
        }
      }
      else{
        const { ClipboardItem } = window;
          await navigator.clipboard.write([new ClipboardItem({"text/plain": getURL(shareType)})])
          .then(() => alert("Link copied!"));
      }
    }
    catch(err){
      if(err.response){
        if(err.response.status === 401 || err.response.status === 403)
        {
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }      
        if(err.response.status === 500)
        {
          alert(err.response.data.message);
        }
      }
      else{
        console.log(err);
      }
    }
  }

  const getURL = async() => {
    const{data: url} = await Axios.post("Itinerary/ShareExt", {i_id: tripId, shareType:"link"}, {withCredentials:true});
    return url;
  }

  if (loading) return <p>{t("loading")}</p>;

  return (
    <div className="tripdetails-page">
      <div className="tripdetails-inner">
        <button className="back-btn" onClick={() => navigate(`/mytrips`)}>
          ← {t("back_to_mytrips")}
        </button>

        <h1 className="tripdetails-title">{trip.name}</h1>
        <p className="trip-date">
          {trip.start} — {trip.end}
        </p>

        {/*Collaborate button*/}
        <div className="trip-actions">
          <button
            className="collaborate-btn"
            onClick={() => setShowCollaborators(true)}
            title="Collaborators"
          >
            👥
          </button>
        </div>

        <label className="completed-label">
          <input
            type="checkbox"
            checked={trip.status === true}
            onChange={(e) =>
              updateTripStatus(e.target.checked ? true : false)
            }
          />
          {t("trip_completed")}
        </label>

        {/*Itinerary card*/}
        <div className="section-card">
          <div className="section-content">
            <h2>{t("itinerary")}</h2>
            <p>{t("itinerary_title")}</p>
            <button
              className="view-btn"
              onClick={() =>
                navigate(`/mytrips/trip/itinerary/${trip.id}/default`)
              }
            >
              {t("view_btn")}
            </button>
          </div>
        </div>

        {/*Timeline card*/}
        <div className="section-card">
          <div className="section-content">
            <h2>{t("timeline")}</h2>
            <p>{t("timeline_title")}</p>
            <button
              className="view-btn"
              onClick={() =>
                navigate(`/mytrips/trip/timeline/${trip.id}`)
              }
            >
              {t("view_btn")}
            </button>
          </div>
        </div>

        {/*Media card*/}
        <div className="section-card">
          <div className="section-content">
            <h2>{t("media")}</h2>
            <p>{t("media_title")}</p>
            <button
              className="view-btn"
              onClick={() =>
                navigate(`/mytrips/trip/media/${trip.id}`)
              }
            >
              {t("view_btn")}
            </button>
          </div>
        </div>
      </div>

      {(trip.type === "Group") && 
      (<button className="floating-chat-btn" onClick={() => setShowChat(true)} title="Chat">
        {t("chat_btn")}
      </button>)}

      {/*Collaborators modal*/}
      {showCollaborators && (
        <div className="collab-overlay">
          <div className="collab-card">
            {isPremium && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 className="collab-title">{t("modal_title")}</h3>
                <div style={{ background: "#e3f2fd", color: "#0a3d62", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                  {collaborators.length} {t("modal_member")}{collaborators.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            {/*Input row*/}
            {(isPremium && trip.type === "Private" && trip.isHost) && <div className="collab-input-row">
              <input
                type="text"
                className="collab-input"
                placeholder= {t("modal_emailph")}
                value={newCollaborator}
                onChange={(e) =>
                  setNewCollaborator(e.target.value)
                }
              />
              <button
                className="add-btn"
                onClick={handleAddCollaborator}
              >
                {t("modal_add_btn")}
              </button>
            </div>}

            {/*Members*/}
            <div className="members-section">
              {isPremium && <p className="members-title">{t("modal_members_title")}</p>}

              {(isPremium && collaborators) && collaborators.map((item, index) => (
                <div key={index} className="member-item">
                  <div className="avatar">
                    {item.name.charAt(0).toUpperCase()}
                  </div>

                  <span className="member-name">{item.name}</span>

                  {trip.isHost && item.name !== "Me" && <button
                    className="delete-btn"
                    onClick={() => handleDeleteCollaborator(item)}
                    title="Remove collaborator"
                  >
                    ✕
                  </button>}

                </div>
              ))}
              {(isPremium && !collaborators) &&
                <div className="member-item">

                  <span className="member-name">{t("modal_nocolab")}</span>

                </div>
              }
              <p className="members-title">{t("modal_share")}</p>
              <div className="share-icons">
                <img src={link} alt="link.img" className="collab-img" onClick={() => handleShareExt("link")}/>
                <img src={whatsapp} alt="whatsapp.img" className="collab-img2" onClick={() => handleShareExt("ws")}/>
                <img src={telegram} alt="tele.img" className="collab-img2" onClick={() => handleShareExt("tele")}/>
              </div>
            </div>

            {/*Actions*/}
            <div className="collab-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowCollaborators(false)}
              >
                {t("modal_cancel_btn")}
              </button>
              {isPremium && <button
                className="save-btn"
                onClick={handleSaveCollaborators}
              >
                {t("modal_save_btn")}
              </button>}
            </div>
          </div>
        </div>
      )}

      {showChat && ( <ItineraryChat onClose={() => {setShowChat(false);}} i_id={tripId}/>)}
    </div>
  );
}

export default TripDetailsPage;