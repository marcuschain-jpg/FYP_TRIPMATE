const pool = require("./db.js");
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });

const arrangeTimers = {}; 

function InitRealtime(io, i_id, runAlgo) {
    // reset timer if arrange is run for that itinerary
    if(arrangeTimers[i_id]){
        clearTimeout(arrangeTimers[i_id]);
    }

    arrangeTimers[i_id] = setTimeout(async() => {
        console.log(`Arranging trip: ${i_id}`);
        io.to(`trip_${i_id}`).emit("Arranging", { running: true });

        await runAlgo(i_id);
        io.to(`trip_${i_id}`).emit("Arranged", { running: false });
        
        delete arrangeTimers[i_id];
    }, 5000);
}

module.exports = InitRealtime;
