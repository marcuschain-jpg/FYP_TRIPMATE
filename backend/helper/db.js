// db.js
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });
const{ Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

pool.on('connect', ()=>{
  console.log('Connected to PostgreSQL')
})

module.exports = pool;
