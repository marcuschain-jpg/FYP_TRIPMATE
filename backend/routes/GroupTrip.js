const express = require("express");
const router = express.Router();
// --- DB stuff ---
const pool = require("../helper/db.js");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user
// --- S3 File Storage ---
const DeletePhotoS3 = require("../helper/S3FileSys.js");


router.post("/CreateGroupTrip", RequireAuth(["premium"]), async(req,res) => {
    const {iName, iDest ,start, end, num_ppl, description} = req.body;
    const userid = req.userid
    const triptype = "Group"
    console.log(iDest);

    try{
    const data = await pool.query(
      `WITH creategt AS(INSERT INTO itinerary (itinerary_name, itinerary_dest, start_date, end_date, user_host_id, type, capacity, description
      , placeid, longitude, latitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING itinerary_id
        )
       INSERT INTO chat_room(itinerary_id)
       SELECT itinerary_id FROM creategt
       RETURNING itinerary_id`, [iName, iDest.name, start, end, userid, triptype, num_ppl, description, iDest.placeid, iDest.lng, iDest.lat]
    );
    if(data.rowCount > 0) return res.json(data.rows);
  }
  catch(err){
    console.log(err);
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


router.delete("/ExitGroupTrip", RequireAuth(["premium"]), async(req,res) => {
    const {i_id, isHost} = req.body;
    const userid = req.userid;
    let num_ppl = 0;

    // Retrieve num of ppl for update later
    try {
        const data = await pool.query(`SELECT num_ppl, capacity FROM itinerary WHERE itinerary_id = $1`, [i_id])
        num_ppl = data.rows[0].num_ppl;
    }
    catch(err) { console.log(err); return res.status(500).send({message: "Failed to add user in group trips"});}

    // If only 1 ppl/host > delete itinerary
    if(num_ppl === 1 && isHost){
        try{
            // Delete photos of itinerary if have
            photoData = await pool.query(
                `SELECT ap.photo_url FROM activity_photo ap
                JOIN activity a ON ap.activity_id = a.activity_id
                JOIN itinerary i on a.itinerary_id = i.itinerary_id
                WHERE i.itinerary_id = $1`, [i_id]
            );
            }
            catch(err) {photoData = null;}

            if(photoData){
            await Promise.all(
                photoData.rows.map(data => {DeletePhotoS3(data.photo_url);
            })
            );
        }
        try{
            const data = await pool.query(
                `DELETE FROM itinerary
                 WHERE itinerary_id=$1`, [i_id]
            );
            if(data.rowCount > 0) return res.send({deleteItinerary: true})
        }
        catch(err) {console.log(err); return res.send({message: "Fail to remove itinerary"});}
    }

    // else if more than 1 person 
    else if(isHost && num_ppl > 1){
        // Remove record from group_trip returning user_id
        // Update user_host_id in itinerary
        // Update num_ppl in db
        try{
            const data = await pool.query(
            `WITH selectrandom AS(
             SELECT user_id
             FROM group_trip
             WHERE itinerary_id=$1
             ORDER BY random()
             LIMIT 1
             ),
             transferhost AS(
             DELETE FROM group_trip
             WHERE itinerary_id=$1 AND user_id=(SELECT user_id from selectrandom)
             )
             UPDATE itinerary
             SET user_host_id = (SELECT user_id from selectrandom),
             num_ppl = $2
             WHERE itinerary_id = $1
             RETURNING num_ppl`, [i_id, num_ppl - 1]
            );
            if(data.rowCount > 0) return res.send(data.rows[0].num_ppl);
        }
        catch(err) {console.log(err); return res.send({message: "Fail to delegate new host"});}
    }
    else if(!isHost && num_ppl > 1){
        // Remove user from group_trips table
        try{
            const data = await pool.query(
                `WITH deleteuser AS(
                 DELETE FROM group_trip
                 WHERE itinerary_id=$1 AND user_id=$2
                 )
                 UPDATE itinerary
                 SET num_ppl = $3
                 WHERE itinerary_id = $1
                 RETURNING num_ppl`, [i_id, userid, num_ppl-1]
            );
            if(data.rowCount > 0) return res.send(data.rows[0].num_ppl);
        }
        catch(err) {console.log(err); return res.send({message: "Fail to delegate new host"});}
    }
});

router.get("/GetChatMsg", RequireAuth(["premium"]), async(req,res)=>{
    const i_id = req.query["i_id"];
    const userid = req.userid

    try{
        const rawdata = await pool.query(
            `SELECT cm.msg_id, cm.content, u.first_name, u.last_name, u.userid, cr.chat_id, i.itinerary_name
             FROM chat_room cr
             LEFT JOIN chat_msg cm ON cm.chat_id = cr.chat_id
             LEFT JOIN users u ON cm.user_id = u.userid
             LEFT JOIN itinerary i ON cr.itinerary_id = i.itinerary_id
             WHERE cr.itinerary_id = $1
             ORDER BY cm.sent_at asc
             `, [i_id]
        );
        const data = rawdata.rows.map(item => ({
            id: item.msg_id,
            sender: item.userid === userid ? "You" : `${item.first_name} ${item.last_name}`,
            type: item.userid === userid? "sent" : "received",
            text: item.content,
            chat_id: item.chat_id,
            itinerary_name: item.itinerary_name
        }));
        return res.send(data);
    }
    catch(err) {console.log(err); return res.send({message: "Fail to retrieve all chat msg"});}
});

router.post("/SendMessage", RequireAuth(["premium"]), async(req,res) => {
    const {content, chatID} = req.body;
    const userid = req.userid;
    const io = req.app.get("io");

    try{
        const rawdata = await pool.query(
            `WITH sendmsg AS(INSERT INTO chat_msg(content, user_id, chat_id)
             VALUES ($1, $2, $3)
             RETURNING msg_id
             )
             SELECT first_name, last_name, userid, (SELECT msg_id FROM sendmsg) AS msg_id
             FROM users
             WHERE userid = $2`, [content, userid, chatID]
        );
        if(rawdata.rowCount > 0){
            const dataToSender = {
                id: rawdata.rows[0].msg_id,
                sender: "You",
                type: "sent",
                text: content
            };
            const dataToReceiver = {
                id: rawdata.rows[0].msg_id,
                sender: `${rawdata.rows[0].first_name} ${rawdata.rows[0].last_name}`,
                type: "received",
                text: content
            };
            io.to(`chat_${chatID}`).emit("notification", { message: "new message received!", payload:dataToReceiver });
            return res.send(dataToSender);
        }
        
    }
    catch(err) {console.log(err); return res.send({message: "Fail to send chat msg"});}
});

module.exports = router