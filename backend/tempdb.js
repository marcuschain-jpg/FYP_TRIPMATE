//For testing db
const db = require("./db");

async function testConnection() {
  try {
    const res = await db.query("SELECT NOW()");
    console.log("PostgreSQL Time:", res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
}

testConnection();