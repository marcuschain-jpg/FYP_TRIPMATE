//Skeleton of db (DO check the logic im not confident)

const { Pool } = require("pg");

//Setup
const pool = new Pool({
  user: "postgres",         // your PostgreSQL username
  host: "localhost",        // usually localhost
  database: "fyp_tripmate", // replace with your DB name
  password: "TRDP1757!",// your DB password
  port: 5432                // default PostgreSQL port
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};