import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Landing.css";
import axios from 'axios';

function ConfirmationFromEmail (){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [invalid, setInvalid] = useState (false);
    const [invalidMsg, setInvalidMsg] = useState("");
    const { invID } = useParams();

    const acceptCollab = async() => {
    try{
        const res = await axios.post("http://localhost:8080/Itinerary/AcceptCollabInv", {inv_id:invID})
        console.log(res);
        if(res.data === true) setLoading(false);
        else if(res.data.check === false) setInvalid(true); setInvalidMsg(res.data.message);
    }
    catch(err){
        if(err.response.status === 500)
        {
            console.log(err.response.data.message);
        }      
    }
}

    return(
        <div className="landing-container">
            {invalid && <h1>{invalidMsg}</h1>}
            {loading && !invalid && <h1>You have been invited to edit with your friends!</h1>}
            {loading && !invalid && <button className="back-btn" onClick={() => acceptCollab()}> Accept invite </button>}
            {!loading && !invalid && <h1>Invitation successfully accepted! Log in now to plan together!</h1>}
            {!loading && !invalid && <button className="back-btn" onClick={() => navigate(`/login`)}> Login </button>}

        </div>
    );
}

export default ConfirmationFromEmail;