const express = require("express");
const router = express.Router();
// --- DB stuff ---
const pool = require("../helper/db.js");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user


router.post("/CreateGroupTrip", RequireAuth(["premium"]), async(req,res) => {
    const {iName, start, end, num_ppl, description} = req.body;
    const iDest = iName;
    const userid = req.userid
    const triptype = "Group"

    try{
    const data = await pool.query(
      `INSERT INTO itinerary (itinerary_name, itinerary_dest, start_date, end_date, user_host_id, type, capacity, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING itinerary_id`, [iName, iDest, start, end, userid, triptype, num_ppl, description]
    );
    if(data.rowCount > 0) return res.json(data.rows);
  }
  catch(err){
    return res.status(500).send({message: "Create Group Trips failed"});
  }
});

router.get("/GetGroupTrips", RequireAuth(["premium"]), async(req,res)=>{
    const userid = req.userid;

    try{
        const rawdata = await pool.query(
            `SELECT i.itinerary_id, u.userid, u.first_name, u.last_name, i.itinerary_name, i.capacity, i.num_ppl, i.description, gt.user_id as gt_user_id,
             TO_CHAR(i.start_date, 'YYYY-MM-DD') AS start_date,
             TO_CHAR(i.end_date, 'YYYY-MM-DD') AS end_date
             FROM itinerary i
             LEFT JOIN users u ON i.user_host_id = u.userid
             LEFT JOIN group_trip gt ON u.userid = gt.user_id
             WHERE i.type='Group'`
        )
        console.log("rows: ", rawdata.rows);
        const data = rawdata.rows.map(item => ({
            itinerary_id: item.itinerary_id,
            owner: item.userid !== userid ? `${item.first_name} ${item.last_name}` : "You",
            title: item.itinerary_name,
            start_date: item.start_date,
            end_date: item.end_date,
            capacity: item.capacity,
            num_ppl: item.num_ppl,
            description: item.description,
            joinedByYou: (item.userid === userid) || (item.gt_user_id !== null) ? true : false
        }))
        console.log("new rows: ", data);
        return res.send(data);
    }
    catch(err){
        console.log(err);
        return res.send(500).send({message: "Get group trips failed"})
    }
});




module.exports = router