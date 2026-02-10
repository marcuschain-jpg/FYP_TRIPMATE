const express = require("express");
const router = express.Router();
const pool = require("../helper/db");
const PhotoImp = require("../middlewares/PhotoImp");
const { ImportPhotoS3 } = require("../helper/S3FileSys");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user

router.use(RequireAuth(["admin"]))
//User Reviews

//GET Function
router.get("/", async (req, res) => {
  const { status, sort } = req.query;

  try {
    let query = `
      SELECT
        r.review_id,
        r.r_content,
        r.r_rating,
        r.status,
        r.createdat,
        u.email
      FROM review r
      JOIN users u ON u.userid = r.userid
    `;
    const values = [];

    if (status && status !== "all") {
      query += ` WHERE r.status = $1`;
      values.push(status);
    }

    if (sort === "old") query += ` ORDER BY r.createdat ASC`;
    else if (sort === "rating") query += ` ORDER BY r.r_rating DESC`;
    else query += ` ORDER BY r.createdat DESC`; // default = new

    const result = await pool.query(query, values);

    const reviews = result.rows.map((row) => ({
      id: row.review_id,
      review: row.r_content,
      rating: row.r_rating,
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

// View Single Review
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        r.review_id,
        r.r_content,
        r.r_rating,
        r.status,
        r.createdat,
        u.email
      FROM review r
      JOIN users u ON u.userid = r.userid
      WHERE r.review_id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    const row = result.rows[0];

    res.json({
      id: row.review_id,
      review: row.r_content,
      rating: row.r_rating,
      status: row.status,
      user: row.email,
      created: row.createdat
        .toISOString()
        .replace("T", " ")
        .slice(0, 16)
    });

  } catch (err) {
    console.error("GET review by id error:", err);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});


module.exports = router;