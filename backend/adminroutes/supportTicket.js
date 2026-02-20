const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
const InsertPhoto = require("../middlewares/PhotoImp.js");
const { ImportPhotoS3 } = require("../helper/S3FileSys.js");
const AWS = require("aws-sdk");
const SendEmail = require("../helper/SendEmail.js");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user
router.use(RequireAuth(["admin"]))

const s3 = new AWS.S3({
    accessKeyId: process.env.AWSKEY,
    region: "ap-southeast-2",
    secretAccessKey: process.env.AWSSECRETKEY
});
const myBucket = process.env.AWSBUCKET

const normalizeCategory = (raw) => {
  if (!raw) return "others";

  const v = raw;

  if (v === "bug" || v === "bug_report") return "bugs";
  if (v === "account") return "account";
  if (v === "technical") return "technical";
  if (v === "other" || v === "others") return "others";

  return "others";
};

//Summary Tickets (For Dashboard)
router.get("/summary", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
      COUNT(*) FILTER (WHERE status = 'NEW') AS "newTickets",
        COUNT(*) FILTER (WHERE status = 'PENDING') AS "pendingReports"
      FROM support_ticket
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /support-tickets/summary error:", err);
    res.status(500).json({ error: "Failed to fetch ticket summary" });
  }
});

// GET Function
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
      t.ticket_id, 
      t.userid, 
      u.email AS user_email,
      t.title, 
      t.contents,            -- ✅ source of truth
      t.status, 
      t.category, 
      t.created_at,
      t.created_at AS last_updated
    FROM support_ticket t
    JOIN users u ON t.userid = u.userid
    ORDER BY t.created_at DESC
    `);

    const tickets = result.rows.map(t => ({
      ticketId: t.ticket_id,
      userId: t.userid,
      userEmail: t.user_email,
      title: t.title,
      status: t.status.toUpperCase(),
      category: normalizeCategory(t.category),
      createdAt: t.created_at,
      description: t.contents || "",
      reason: t.contents || t.title,
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
// Update Status/Category Function
router.patch("/:ticketId", async (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ message: "Status required" });

  try {
    const result = await pool.query(
      `UPDATE support_ticket
       SET status=$1
       WHERE ticket_id=$2
       RETURNING *`,
      [status, ticketId]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Ticket not found" });

    res.json({ updated: true, ticket: result.rows[0] });

  } catch (err) {
    console.error("PATCH /support-tickets error:", err);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

// Message Reply Function (Email)
router.post("/:ticketId/send-email", async (req, res) => {
  const { ticketId } = req.params;

  try {
    // Fetch ticket + user email
    const ticketRes = await pool.query(`
      SELECT
      u.email,
      t.title,
      t.contents AS description,
      t.category,
      t.status
    FROM support_ticket t
    JOIN users u ON t.userid = u.userid
    WHERE t.ticket_id = $1
    `, [ticketId]);

    if (ticketRes.rowCount === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticket = ticketRes.rows[0];

    //Send email
    const issueContent = ticket.description || ticket.title;

    const emailSent = await SendEmail({
      recipient: ticket.email,
      subject: `Support Ticket Update — ${ticket.title}`,
      text: `
    Hello,

    We have received your support request.

    Title:
    ${ticket.title}

    Category:
    ${ticket.category.toUpperCase()}

    Description:
    ${ticket.description}

    Status:
    ${ticket.status}

    Our support team will follow up with you shortly.

    Best regards,
    TripMate Support Team
    `,
      html: `
        <p>Hello,</p>

        <p>We have received your support request. Below are the details:</p>

        <table style="border-collapse: collapse;">
          <tr>
            <td><strong>Title</strong></td>
            <td>${ticket.title}</td>
          </tr>
          <tr>
            <td><strong>Category</strong></td>
            <td>${ticket.category.toUpperCase()}</td>
          </tr>
          <tr>
            <td><strong>Description</strong></td>
            <td>${ticket.description}</td>
          </tr>
          <tr>
            <td><strong>Status</strong></td>
            <td>${ticket.status}</td>
          </tr>
        </table>

        <p>
        To help us investigate your issue more efficiently, could you reply to this email with:
        </p>
        <ul>
          <li>A screenshot or photo of the issue</li>
          <li>A brief description of what happened</li>
          <li>Steps you took before the issue occurred (if applicable)</li>
        </ul>

        <p>Once we receive this information, our team will continue the investigation.</p>

        <p>Best regards,<br/>
        <strong>TripMate Support Team</strong></p>
      `
    });

    if (!emailSent) {
      return res.status(500).json({ error: "Email service failed" });
    }

    // UPDATE STATUS — PUT IT HERE
    await pool.query(
      `UPDATE support_ticket SET status='PENDING' WHERE ticket_id=$1`,
      [ticketId]
    );

    // Respond success
    res.json({ success: true });

  } catch (err) {
    console.error("Failed to send ticket email:", err);
    res.status(500).json({ error: "Failed to send email" });
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

module.exports = router;
