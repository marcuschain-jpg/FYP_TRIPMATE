const express = require("express");
const router = express.Router();
const pool = require("../helper/db");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user

router.use(RequireAuth(["admin"]))
//User Content

//GET Function
router.get("/", async (req, res) => {
  const { status, sort } = req.query;

  try {
    let query = `
      SELECT
        c.content_id,
        c.title,
        c.status,
        c.reports,
        c.created_at,
        u.email
      FROM user_content c
      JOIN users u ON u.userid = c.userid
    `;
    const values = [];

    if (status && status !== "all") {
      query += ` WHERE c.status = $1`;
      values.push(status);
    }

    if (sort === "old") query += ` ORDER BY c.created_at ASC`;
    else if (sort === "reports") query += ` ORDER BY c.reports DESC`;
    else query += ` ORDER BY c.created_at DESC`; // default = new
    query += ` LIMIT 50`; 

    const result = await pool.query(query, values);

    const content = result.rows.map((row) => ({
      id: row.content_id,
      title: row.title,
      user: row.email,
      reports: row.reports,
      status: row.status,
      created: row.created_at
        .toISOString()
        .replace("T", " ")
        .slice(0, 16),
    }));

    res.json(content);
  } catch (err) {
    console.error("GET /content error:", err);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

//Delete Function
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM user_content WHERE content_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.json({ message: "Content deleted" });
  } catch (err) {
    console.error("Delete content error:", err);
    res.status(500).json({ error: "Failed to delete content" });
  }
});


//Flag Function
router.patch("/:id/flag", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE user_content
      SET status = CASE
        WHEN status = 'published' THEN 'flagged'
        ELSE 'published'
      END
      WHERE content_id = $1
      RETURNING status
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.json({ status: result.rows[0].status });
  } catch (err) {
    console.error("Flag content error:", err);
    res.status(500).json({ error: "Failed to update content status" });
  }
});

//--------------------------------------------
//User Reviews

//GET Function
router.get("/reviews", async (req, res) => {
  const { status, sort } = req.query;

  try {
    let query = `
      SELECT
        r.review_id,
        r.r_content,
        r.r_ratings,
        r.status,
        r.createdat,
        u.email
      FROM review r
      JOIN users u ON u.userid = r.user_id
    `;
    const values = [];

    if (status && status !== "all") {
      query += ` WHERE r.status = $1`;
      values.push(status);
    }

    if (sort === "old") query += ` ORDER BY r.createdat ASC`;
    else if (sort === "rating") query += ` ORDER BY r.r_ratings DESC`;
    else query += ` ORDER BY r.createdat DESC`; // default = new

    const result = await pool.query(query, values);

    const reviews = result.rows.map((row) => ({
      id: row.review_id,
      review: row.r_content,
      rating: row.r_ratings,
      status: row.status,
      user: row.email,
      created: row.createdat
        ? row.createdat.toISOString().replace("T", " ").slice(0, 16)
        : null,
    }));

    res.json(reviews);
  } catch (err) {
    console.error("GET /reviews error:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

//Delete Function
router.delete("/reviews/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM review WHERE review_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

//Flag Function
router.patch("/reviews/:id/flag", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE review
      SET status = CASE
        WHEN status = 'published' THEN 'Flagged'
        ELSE 'published'
      END
      WHERE review_id = $1
      RETURNING status
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ status: result.rows[0].status });
  } catch (err) {
    console.error("Flag review error:", err);
    res.status(500).json({ error: "Failed to update review status" });
  }
});

//--------------------------------------------------------
//Marketing Content

//GET Function
router.get("/marketing", async (req, res) => {
  const { status, sort } = req.query;

  try {
    let query = `
      SELECT
        content_id,
        c_section,
        c_title,
        c_content,
        c_img_url,
        status,
        last_updated
      FROM marketing_content
    `;
    const values = [];

    if (status && status !== "all") {
      query += ` WHERE status = $1`;
      values.push(status);
    }

    if (sort === "old") query += ` ORDER BY last_updated ASC`;
    else if (sort === "section") query += ` ORDER BY c_section ASC`;
    else query += ` ORDER BY last_updated DESC`; // default = new

    const result = await pool.query(query, values);

    const marketing = result.rows.map((row) => ({
      id: row.content_id,
      section: row.c_section,
      title: row.c_title,
      body: row.c_content,
      imageUrl: row.c_img_url,
      author: "Admin",
      status: row.status,
      lastUpdated: row.last_updated
        ? row.last_updated.toISOString().replace("T", " ").slice(0, 16)
        : null,
    }));

    res.json(marketing);
  } catch (err) {
    console.error("GET /marketing error:", err);
    res.status(500).json({ error: "Failed to fetch marketing content" });
  }
});

//Delete Function
router.delete("/marketing/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM marketing_content WHERE content_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Marketing content not found" });
    }

    res.json({ message: "Marketing content deleted" });
  } catch (err) {
    console.error("Delete marketing error:", err);
    res.status(500).json({ error: "Failed to delete marketing content" });
  }
});

// Create Function
router.post("/marketing", async (req, res) => {
  const { section, title, body, imageUrl, status } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO marketing_content (
        c_section,
        c_title,
        c_content,
        c_img_url,
        status,
        last_updated
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        NOW()
      )
      RETURNING *
      `,
      [section, title, body, imageUrl, status || "Published"]
    );

    const row = result.rows[0]; 
    
    res.status(201).json({
      message: "Marketing content created",
      id: row.content_id,
      section: row.c_section,
      title: row.c_title,
      body: row.c_content,
      imageUrl: row.c_img_url,
      author: "Admin",
      status: row.status,
      lastUpdated: row.last_updated
        .toISOString()
        .replace("T", " ")
        .slice(0, 16),
    });

  } catch (err) {
    console.error("Create marketing failed:", err);
    res.status(500).json({ message: "Failed to create marketing content" });
  }
});

//Update Function
router.put("/marketing/:id", async (req, res) => {
  const { id } = req.params;
  const { section, title, body, imageUrl, status } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE marketing_content
      SET
        c_section=$1,
        c_title=$2,
        c_content=$3,
        c_img_url=$4,
        status=$5,
        last_updated=NOW()
      WHERE content_id=$6
      RETURNING *
      `,
      [section, title, body, imageUrl, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Marketing content not found" });
    }

    const row = result.rows[0];

    res.json({
      id: row.content_id,
      section: row.c_section,
      title: row.c_title,
      body: row.c_content,
      imageUrl: row.c_img_url,
      author: "Admin",
      status: row.status,
      lastUpdated: row.last_updated
        .toISOString()
        .replace("T", " ")
        .slice(0, 16),
    });
  } catch (err) {
    console.error("Update marketing failed:", err);
    res.status(500).json({ message: "Failed to update marketing content" });
  }
});

module.exports = router;