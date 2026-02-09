const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");

// GET /api/overview
router.get("/", async (req, res) => {
  try {
    // Total users
    const usersResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Active users (not suspended)
    const activeResult = await pool.query("SELECT COUNT(*) FROM users WHERE suspended = false");
    const activeUsers = parseInt(activeResult.rows[0].count);

    // Suspended users
    const suspendedResult = await pool.query("SELECT COUNT(*) FROM users WHERE suspended = true");
    const suspendedUsers = parseInt(suspendedResult.rows[0].count);

    // Pending tickets
    const ticketsResult = await pool.query(
      "SELECT COUNT(*) FROM support_ticket WHERE status = 'PENDING'"
    );
    const pendingTickets = parseInt(ticketsResult.rows[0].count);

    res.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingTickets,
    });
  } catch (err) {
    console.error("Overview fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch overview data" });
  }
});

module.exports = router;