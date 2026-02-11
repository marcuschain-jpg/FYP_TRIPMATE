const express = require("express");
const router = express.Router();
const pool = require("../helper/db");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user

router.use(RequireAuth(["admin"]))
//GET Function
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
        last_login
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
    await pool.query("BEGIN");

    //Fetch email and current status
    const userRes = await pool.query(
      `SELECT email, suspended FROM users WHERE userid = $1`,
      [id]
    );

    if (userRes.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const { email, suspended } = userRes.rows[0];

    //Toggle Updated Status
    const newStatus = !suspended;
    const action = newStatus ? "SUSPENDED" : "ACTIVATED";

    await pool.query(
      `UPDATE users SET suspended = $1 WHERE userid = $2`,
      [newStatus, id]
    );

    //Insert activity log with correct email
    await pool.query(
      `INSERT INTO users_activity_logs (user_id, user_email, action)
       VALUES ($1, $2, $3)`,
      [id, email, action]
    );

    await pool.query("COMMIT");

    res.json({ status: newStatus ? "Suspended" : "Active" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Suspend toggle error:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("BEGIN");

    // Fetch email before deletion
    const userRes = await pool.query(
      `SELECT email FROM users WHERE userid = $1`,
      [id]
    );

    if (userRes.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const { email } = userRes.rows[0];

    // Insert activity log BEFORE deleting
    await pool.query(
      `INSERT INTO users_activity_logs (user_id, user_email, action)
       VALUES ($1, $2, 'DELETED')`,
      [id, email]
    );

    // Delete user
    await pool.query(
      `DELETE FROM users WHERE userid = $1`,
      [id]
    );

    await pool.query("COMMIT");

    res.json({ message: "User deleted" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

//Delete Function
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("BEGIN");

    //Remember the user BEFORE deletion
    const userResult = await pool.query(
      `SELECT email FROM users WHERE userid = $1`,
      [id]
    );

    if (userResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const email = userResult.rows[0].email;

    //Write audit log
    await pool.query(
      `
      INSERT INTO users_activity_logs (user_id, user_email, action)
      VALUES ($1, $2, 'DELETED');
      `,
      [id, email]
    );

    //Delete the user
    await pool.query(
      `DELETE FROM users WHERE userid = $1`,
      [id]
    );

    await pool.query("COMMIT");

    res.json({ message: "User deleted" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

//Activity Logs
//GET Function
router.get("/activity", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        l.log_id,
        l.user_email AS email,
        l.action,
        l.created_at
      FROM users_activity_logs l
      ORDER BY l.created_at DESC
      LIMIT 50
    `);

    const logs = result.rows.map((row) => {
      const timestamp = row.created_at
        .toISOString()
        .replace("T", " ")
        .slice(0, 16);

      return `${timestamp} | user "${row.email}" ${row.action.toLowerCase()}`;
    });

    res.json(logs);
  } catch (err) {
    console.error("Fetch activity logs error:", err);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

module.exports = router;

