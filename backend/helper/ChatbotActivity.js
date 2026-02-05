// Access to Database
const pool = require("./db.js");

// --- Create Activities From Chatbot ---
async function createActivity({
  aName,
  aLoc,
  aAddress,
  aDate,
  i_id,
  aPlaceID,
  lng,
  lat,
  aCost
}) {

  const result = await pool.query(
    `INSERT INTO activity (
        activity_name, 
        activity_location, 
        activity_address,
        activity_date, 
        gmaps_placeid, 
        itinerary_id,
        longitude, 
        latitude,  
        activity_cost
        )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING activity_id`,
    [aName, aLoc, aAddress, aDate, aPlaceID, i_id, lng, lat, aCost]
  );

  return result.rows[0].activity_id;
}

module.exports = { createActivity };
