// Access to Database
const pool = require("./db.js");

// --- Create Itinerary from Chatbot ---
async function createItinerary({
  iName,
  iDest,
  start,
  end,
  type,
  userid
}) {
  const result = await pool.query(
    `INSERT INTO itinerary (
      itinerary_name, 
      itinerary_dest,   
      start_date, 
      end_date,
      user_host_id, 
      type, 
      placeid,  
      longitude,
      latitude
      )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING itinerary_id`,
    [
      iName,
      iDest.name,
      start,
      end,
      userid,
      type,
      iDest.placeid,
      iDest.lat,
      iDest.lng
    ]
  );

  return result.rows[0].itinerary_id;
}

module.exports = { createItinerary };