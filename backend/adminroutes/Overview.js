const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js"); // your Postgres pool

// GET /api/overview
router.get("/", async (req, res) => {
  try {
    // Example: total users
    const usersResult = await pool.query("SELECT COUNT(*) FROM users");
    const activeResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE status = 'active'"
    );
    const suspendedResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE status = 'suspended'"
    );

    // Example: posts per month
    const postsResult = await pool.query(`
      SELECT to_char(created_at, 'Mon YYYY') as month, COUNT(*) as count
      FROM posts
      GROUP BY month
      ORDER BY MIN(created_at)
    `);

    // Example: flagged posts
    const flaggedResult = await pool.query(`
      SELECT to_char(created_at, 'Mon YYYY') as month, COUNT(*) as count
      FROM posts
      WHERE flagged = true
      GROUP BY month
      ORDER BY MIN(created_at)
    `);

    res.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0].count),
        activeUsers: parseInt(activeResult.rows[0].count),
        suspendedUsers: parseInt(suspendedResult.rows[0].count),
        pendingTickets: 1, // You can query your tickets table similarly
        flaggedPosts: flaggedResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0),
      },
      barData: postsResult.rows.map(r => ({ label: r.month, value: parseInt(r.count) })),
      lineData: flaggedResult.rows.map(r => ({ label: r.month, value: parseInt(r.count) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch overview data" });
  }
});

module.exports = router;