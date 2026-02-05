const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const InsertPhoto = require("../middlewares/PhotoImp.js");
const { ImportPhotoS3 } = require("../helper/S3FileSys.js");
const AWS = require("aws-sdk");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user
router.use(RequireAuth(["admin"]))

const s3 = new AWS.S3({
    accessKeyId: process.env.AWSKEY,
    region: "ap-southeast-2",
    secretAccessKey: process.env.AWSSECRETKEY
});
const myBucket = process.env.AWSBUCKET

// GET Function
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.ticket_id, 
        t.userid, 
        u.email AS user_email,
        t.title, 
        t.status, 
        t.priority, 
        t.category, 
        t.created_at,
        m.content AS latest_message, 
        m.created_at AS last_updated
      FROM support_ticket t
      JOIN users u ON t.userid = u.userid
      LEFT JOIN LATERAL (
        SELECT content, attachments, created_at
        FROM support_ticket_message
        WHERE ticket_id = t.ticket_id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      ORDER BY t.created_at DESC
    `);

    const tickets = result.rows.map(t => ({
      ticketId: t.ticket_id,
      userId: t.userid,
      userEmail: t.user_email,
      title: t.title,
      status: t.status.toUpperCase(),
      priority: t.priority.toUpperCase(),
      category: t.category,
      createdAt: t.created_at,
      latestMessage: t.latest_message || "",
      latestMessageAttachments: t.attachments || [],
      lastUpdated: t.last_updated || t.created_at
    }));

    res.json(tickets);
  } catch (err) {
    console.error("GET /support-tickets error:", err);
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

// Support Messages Within Tickets
// Get Function
router.get("/:ticketId/messages", async (req, res) => {
  const { ticketId } = req.params;
  try {
    const result = await pool.query(`
      SELECT message_id, sender, content, created_at, attachments
      FROM support_ticket_message
      WHERE ticket_id = $1
      ORDER BY created_at ASC
    `, [ticketId]);

    const messages = result.rows.map(m => ({
      ...m,
      attachments: m.attachments || []
    }));

    res.json(messages);
  } catch (err) {
    console.error(`GET /support-tickets/${ticketId}/messages error:`, err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// --- Actions ---
// Update Status/Priority Function
router.patch("/:ticketId", async (req, res) => {
  const { ticketId } = req.params;
  const { status, priority } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (status) {
      fields.push(`status=$${idx++}`);
      values.push(status);
    }

    if (priority) {
      fields.push(`priority=$${idx++}`);
      values.push(priority);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const result = await pool.query(
      `
      UPDATE support_ticket
      SET ${fields.join(", ")}
      WHERE ticket_id=$${idx}
      RETURNING *
      `,
      [...values, ticketId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({ updated: true, ticket: result.rows[0] });

  } catch (err) {
    console.error("PATCH /support-tickets error:", err);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

// Message Reply Function
router.post("/:ticketId/message", async (req, res) => {
  const { ticketId } = req.params;
  const { content, attachments } = req.body;

  try {
    const safeAttachments = Array.isArray(attachments) ? attachments : [];

    const result = await pool.query(`
      INSERT INTO support_ticket_message (
        ticket_id,
        sender,
        content,
        attachments
      )
      VALUES ($1, 'admin', $2, $3)
      RETURNING *
    `, [ticketId, content, safeAttachments]);

    await pool.query(
      `UPDATE support_ticket
       SET status='OPEN'
       WHERE ticket_id=$1`,
      [ticketId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`POST /support-tickets/${ticketId}/message error:`, err);
    res.status(500).json({ error: "Failed to post message" });
  }
});

// Delete Ticket Function
router.delete("/:ticketId", async (req, res) => {
  const { ticketId } = req.params;

  try {
    await pool.query("BEGIN");

    const result = await pool.query(`
      DELETE FROM support_ticket
      WHERE ticket_id = $1
      RETURNING ticket_id
    `, [ticketId]);

    if (result.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "Ticket not found" });
    }

    await pool.query("COMMIT");
    res.json({ deleted: true, ticketId: ticketId });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(`DELETE /support-tickets/${ticketId} error:`, err);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

//Upload Attachment Function
router.post("/:ticketId/upload", InsertPhoto(), async (req, res) => {
  const { ticketId } = req.params;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    // Upload files from local to S3
    const uploadKeys = await ImportPhotoS3(`tickets/${ticketId}`, req.uploadSessionID);

    // Generate signed URLs with type
    const signedFiles = uploadKeys.map(f => {
      const ext = f.split(".").pop().toLowerCase();
      const type = ["mp4","mov","avi","mkv"].includes(ext) ? "video" : "image";
      
      const url = s3.getSignedUrl("getObject", {
        Bucket: myBucket,
        Key: f,
        Expires: 30 * 60 // 30 mins
      });

      return { type, url, key: f };
    });

    res.json(signedFiles);

  } catch (err) {
    console.error("File upload failed:", err);
    res.status(500).json({ error: "Failed to upload files" });
  }
});

module.exports = router;
