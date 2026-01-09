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
            `SELECT i.itinerary_id, u.userid, u.first_name, u.last_name, i.itinerary_name, i.capacity, i.num_ppl,
             i.description, gt.user_id as gt_user_id, i.itinerary_dest,
             TO_CHAR(i.start_date, 'YYYY-MM-DD') AS start_date,
             TO_CHAR(i.end_date, 'YYYY-MM-DD') AS end_date
             FROM itinerary i
             LEFT JOIN users u ON i.user_host_id = u.userid
             LEFT JOIN group_trip gt ON i.itinerary_id = gt.itinerary_id AND gt.user_id = $1
             WHERE i.type='Group' 
	`, [userid]
        )
        const data = rawdata.rows.map(item => ({
            itinerary_id: item.itinerary_id,
            owner: item.userid !== userid ? `${item.first_name} ${item.last_name}` : "You",
            location: item.itinerary_dest,
            title: item.itinerary_name,
            start_date: item.start_date,
            end_date: item.end_date,
            capacity: item.capacity,
            num_ppl: item.num_ppl,
            description: item.description,
            joinedByYou: (item.userid === userid) || (item.gt_user_id !== null) ? true : false,
            isHost: (item.userid === userid) ? true : false
        }));
        console.log(data);
        return res.send(data);
    }
    catch(err){
        console.log(err);
        return res.send(500).send({message: "Get group trips failed"})
    }
});


router.patch("/JoinGroupTrip", RequireAuth(["premium"]), async(req,res) => {
    const {i_id} = req.body;
    const userid = req.userid;
    let num_ppl = 0;
    let capacity = 0;

    // Inner validation if trip is full
    try {
        const data = await pool.query(
            `SELECT num_ppl, capacity FROM itinerary WHERE itinerary_id = $1`, [i_id]
        )
        num_ppl = data.rows[0].num_ppl;
        capacity = data.rows[0].capacity;
    }
    catch(err) { console.log(err); return res.status(500).send({message: "Failed to add user in group trips"});}

    // Insert user into group trips they joined and also update count
    if(num_ppl >= capacity) return res.status(500).send({message: "This trip is now full, please refresh and select another trip"})
    else {
        try {
            const data = await pool.query(
                `WITH inserted AS(
                INSERT INTO group_trip(itinerary_id, user_id)
                VALUES ($1, $2)
                RETURNING itinerary_id
                )
                UPDATE itinerary
                SET num_ppl = ($3)
                WHERE itinerary_id = (SELECT itinerary_id FROM inserted)
                RETURNING num_ppl`, [i_id, userid, num_ppl + 1]
            );
            if(data.rowCount > 0) return res.send(data.rows[0].num_ppl);
            }
            catch(err) { console.log(err); res.status(500).send({message: "Failed to add user in group trips"});}
    }
});




module.exports = router