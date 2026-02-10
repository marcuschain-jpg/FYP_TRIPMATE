const express = require("express");
const router = express.Router();
const pool = require("../helper/db");
const PhotoImp = require("../middlewares/PhotoImp");
const { ImportPhotoS3 } = require("../helper/S3FileSys");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user

router.use(RequireAuth(["admin"]))

//Marketing Content

//GET Function
router.get("/", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
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
router.post("/", PhotoImp(), async (req, res) => {
  const { section, title, body, status } = req.body;
  let imageUrl = null;

  try {
    // Upload image to S3 if any
    if (req.uploadSessionID) {
      const uploaded = await ImportPhotoS3("marketing", req.uploadSessionID);
      if (Array.isArray(uploaded) && uploaded.length > 0) imageUrl = uploaded[0];
    }

    // Insert content into DB
    const result = await pool.query(
      `
      INSERT INTO marketing_content (c_section, c_title, c_content, c_img_url, status, last_updated)
      VALUES ($1, $2, $3, $4, $5, NOW())
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
      lastUpdated: row.last_updated.toISOString().replace("T", " ").slice(0, 16),
    });
  } catch (err) {
    console.error("Create marketing failed:", err);
    res.status(500).json({ message: "Failed to create marketing content" });
  }
});

//Update Function
router.put("/:id", PhotoImp(), async (req, res) => {
  const { id } = req.params;
  const { section, title, body, status } = req.body;
  let imageUrl = null;

  try {
    // Upload image to S3 if any
    if (req.uploadSessionID) {
      const uploaded = await ImportPhotoS3("marketing", req.uploadSessionID);
      if (Array.isArray(uploaded) && uploaded.length > 0) imageUrl = uploaded[0];
    }

    // Update DB
    const result = await pool.query(
      `
      UPDATE marketing_content
      SET c_section=$1, c_title=$2, c_content=$3, c_img_url=COALESCE($4, c_img_url), status=$5, last_updated=NOW()
      WHERE content_id=$6
      RETURNING *
      `,
      [section, title, body, imageUrl, status, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Marketing content not found" });

    const row = result.rows[0];
    res.json({
      id: row.content_id,
      section: row.c_section,
      title: row.c_title,
      body: row.c_content,
      imageUrl: row.c_img_url,
      author: "Admin",
      status: row.status,
      lastUpdated: row.last_updated.toISOString().replace("T", " ").slice(0, 16),
    });
  } catch (err) {
    console.error("Update marketing failed:", err);
    res.status(500).json({ message: "Failed to update marketing content" });
  }
});


module.exports = router;