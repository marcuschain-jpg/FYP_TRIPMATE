const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        userid,
        email,
        first_name,
        last_name,
        suspended,
        created_at,
        last_login,
        posts,
        flags
      FROM users
      ORDER BY created_at DESC
    `);

    const users = result.rows.map((u) => ({
      id: u.userid, 
      name: `${u.first_name} ${u.last_name}`,
      email: u.email,
      status: u.suspended ? "Suspended" : "Active",
      dateJoined: u.created_at
        ? u.created_at.toISOString().split("T")[0]
        : "-",
      lastLogin: u.last_login
        ? u.last_login.toISOString().split("T")[0]
        : "-",
      posts: u.posts,
      flags: u.flags,
    }));

    res.json(users);
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }

});

//Suspend Function
router.patch("/:id/suspend", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE users
      SET suspended = NOT suspended
      WHERE userid = $1
      RETURNING suspended
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      status: result.rows[0].suspended ? "Suspended" : "Active",
    });
  } catch (err) {
    console.error("Suspend user error:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

//Delete Function
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM users WHERE userid = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;

