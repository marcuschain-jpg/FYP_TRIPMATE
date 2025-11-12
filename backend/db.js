// db.js
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: "keys.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,               // e.g., https://xyz.supabase.co
  process.env.SUPABASE_SERVICE_ROLE_KEY   // use anon key for basic insert
);

module.exports = supabase;
