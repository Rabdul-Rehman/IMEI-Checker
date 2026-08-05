require("dotenv").config({
  path: ".env.local",
});

const crypto = require("crypto");

const { supabase } = require("./lib/supabase");
const { hashApiKey } = require("./lib/apiKeyAuth");

async function createApiKey() {

  const randomPart = crypto
    .randomBytes(32)
    .toString("hex");

  const apiKey = `imei_live_${randomPart}`;

  const keyHash = hashApiKey(apiKey);

  const keyPrefix = apiKey.substring(0, 16);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      name: "API Key Development",
      key_hash: keyHash,
      key_prefix: keyPrefix,
      daily_limit: 1000,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create API key:");
    console.error(error);
    process.exit(1);
  }

  console.log("");
  console.log("======================================");
  console.log("API KEY CREATED");
  console.log("======================================");
  console.log("");
  console.log(apiKey);
  console.log("");
  console.log("Name:", data.name);
  console.log("Daily limit:", data.daily_limit);
  console.log("");
  console.log("SAVE THIS KEY.");
  console.log("You will NOT be able to retrieve it later.");
  console.log("");
}

createApiKey();