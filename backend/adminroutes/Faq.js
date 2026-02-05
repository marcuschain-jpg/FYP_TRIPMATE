const express = require("express");
const router = express.Router();
const pool = require("../helper/db.js");
// --- Authenticate ---
const RequireAuth = require("../middlewares/RequireAuths.js"); // Authenticate and authorize user

router.use(RequireAuth(["admin"]))

//Get Function
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
      faq_id, 
      faq_category, 
      faq_question, 
      faq_answer, 
      last_updated
      FROM faq
      ORDER BY last_updated DESC
    `);

    const faqs = result.rows.map(f => ({
      faqId: f.faq_id,
      category: f.faq_category,
      question: f.faq_question,
      answer: f.faq_answer,
      lastUpdated: f.last_updated
  }));
  
    res.json(faqs);
  } catch (err) {
    console.error("Get FAQ Failed:", err);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// --- Action ---
//Create New FAQ
router.post("/", async (req, res) => {
  const { faq_category, faq_question, faq_answer } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO faq (
      faq_category, 
      faq_question, 
      faq_answer
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `, [faq_category, faq_question, faq_answer]
    );

    const row = result.rows[0];

    res.status(201).json({
      message: "FAQ created",
      faqId: row.faq_id,
      category: row.faq_category,
      question: row.faq_question,
      answer: row.faq_answer,
      lastUpdated: row.last_updated
        .toISOString()
        .replace("T", " ")
        .slice(0, 16),
    });

  } catch (err) {
    console.error("Create FAQ Failed:", err);
    res.status(500).json({ error: "Failed to create FAQ" });
  }
});

//Update Existing FAQ
router.patch("/:faqId", async (req, res) => {
  const { faqId } = req.params;
  const { faq_category, faq_question, faq_answer } = req.body;

  try {
    const result = await pool.query(`
      UPDATE faq
      SET faq_category = $1,
          faq_question = $2,
          faq_answer = $3,
          last_updated = NOW()
      WHERE faq_id = $4
      RETURNING *
    `, [faq_category, faq_question, faq_answer, faqId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res.json({ updated: true, faq: result.rows[0] });
  } catch (err) {
    console.error(`PATCH /faq/${faqId} error:`, err);
    res.status(500).json({ error: "Failed to update FAQ" });
  }
});

//Delete FAQ
router.delete("/:faqId", async (req, res) => {
  const { faqId } = req.params;

  try {
    const result = await pool.query(`
      DELETE FROM faq
      WHERE faq_id = $1
      RETURNING faq_id
    `, [faqId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res.json({ deleted: true, faqId });
  } catch (err) {
    console.error(`DELETE /faq/${faqId} error:`, err);
    res.status(500).json({ error: "Failed to delete FAQ" });
  }
});

module.exports = router;