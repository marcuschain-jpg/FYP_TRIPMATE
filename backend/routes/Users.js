const express = require("express");
const router = express.Router();
const pool = require("../helper/db");

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
    await pool.query("BEGIN");

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
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const suspended = result.rows[0].suspended;
    const action = suspended ? "SUSPENDED" : "ACTIVATED";

    await pool.query(
      `
      INSERT INTO users_activity_logs (user_id, action)
      VALUES ($1, $2)
      `,
      [id, action]
    );

    await pool.query("COMMIT");

    res.json({ status: suspended ? "Suspended" : "Active" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Suspend user error:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

//Delete Function
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("BEGIN");

    const userExists = await pool.query(
      `SELECT userid FROM users WHERE userid = $1`,
      [id]
    );

    if (userExists.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    await pool.query(
      `
      INSERT INTO users_activity_logs (user_id, action)
      VALUES ($1, 'DELETED')
      `,
      [id]
    );

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
        u.email,
        l.action,
        l.created_at
      FROM users_activity_logs l
      JOIN users u ON u.userid = l.user_id
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

