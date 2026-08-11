const crypto = require("crypto");
const { supabase } = require("./supabase");

/*
=========================================================
HASH API KEY
=========================================================
*/

function hashApiKey(apiKey) {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
}

/*
=========================================================
START OF TODAY
=========================================================
*/

function startOfToday() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

/*
=========================================================
AUTHENTICATE API KEY
=========================================================
*/

async function authenticateApiKey(request, reply) {
  try {
    /*
    =====================================================
    GET AUTHORIZATION HEADER
    =====================================================
    */

    const authorization =
      request.headers.authorization || "";

    /*
    =====================================================
    CHECK AUTHORIZATION EXISTS
    =====================================================
    */

    if (!authorization) {
      reply.code(401).send({
        success: false,
        error: "Missing API key",
        message:
          "Use Authorization: Bearer YOUR_API_KEY",
      });

      return false;
    }

    /*
    =====================================================
    CHECK BEARER FORMAT
    =====================================================
    */

    if (!authorization.startsWith("Bearer ")) {
      reply.code(401).send({
        success: false,
        error: "Invalid authorization format",
        message:
          "Use Authorization: Bearer YOUR_API_KEY",
      });

      return false;
    }

    /*
    =====================================================
    EXTRACT API KEY
    =====================================================
    */

    const apiKey = authorization
      .substring(7)
      .trim();

    /*
    =====================================================
    CHECK API KEY EXISTS
    =====================================================
    */

    if (!apiKey) {
      reply.code(401).send({
        success: false,
        error: "Missing API key",
      });

      return false;
    }

    /*
    =====================================================
    HASH PROVIDED KEY
    =====================================================
    */

    const keyHash = hashApiKey(apiKey);

    /*
    =====================================================
    FIND API KEY
    =====================================================
    */

    const {
      data,
      error,
    } = await supabase
      .from("api_keys")
      .select(`
        id,
        name,
        key_prefix,
        key_hash,
        is_active,
        requests_count,
        daily_limit,
        last_used_at
      `)
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single();

    /*
    =====================================================
    INVALID KEY
    =====================================================
    */

    if (error || !data) {
      reply.code(401).send({
        success: false,
        error: "Invalid API key",
      });

      return false;
    }

    /*
    =====================================================
    DAILY LIMIT LOGIC
    =====================================================
    */

    const today = startOfToday();

    const lastUsed = data.last_used_at
      ? new Date(data.last_used_at)
      : null;

    let currentRequests =
      Number(data.requests_count || 0);

    /*
    If the key was not used today,
    reset the current daily usage.
    */

    if (!lastUsed || lastUsed < today) {
      currentRequests = 0;
    }

    /*
    =====================================================
    CHECK DAILY LIMIT
    =====================================================

    IMPORTANT:

    daily_limit === null means UNLIMITED.

    We must NOT compare currentRequests >= null.
    */

    const dailyLimit =
      data.daily_limit === null ||
      data.daily_limit === undefined
        ? null
        : Number(data.daily_limit);

    if (
      dailyLimit !== null &&
      currentRequests >= dailyLimit
    ) {
      reply.code(429).send({
        success: false,
        error: "API daily limit exceeded",
        limit: dailyLimit,
        used: currentRequests,
        remaining: 0,
      });

      return false;
    }

    /*
    =====================================================
    NEW REQUEST COUNT
    =====================================================
    */

    const newRequestCount =
      currentRequests + 1;

    /*
    =====================================================
    UPDATE API KEY USAGE
    =====================================================
    */

    const {
      error: updateError,
    } = await supabase
      .from("api_keys")
      .update({
        requests_count:
          newRequestCount,

        last_used_at:
          new Date().toISOString(),
      })
      .eq("id", data.id);

    /*
    =====================================================
    HANDLE UPDATE ERROR
    =====================================================
    */

    if (updateError) {
      request.log.error(
        updateError,
        "Failed to update API usage"
      );

      reply.code(500).send({
        success: false,
        error: "Failed to update API usage",
      });

      return false;
    }

    /*
    =====================================================
    ATTACH API KEY TO REQUEST
    =====================================================
    */

    request.apiKey = {
      id: data.id,
      name: data.name,
      key_prefix: data.key_prefix,
      key_hash: data.key_hash,
      is_active: data.is_active,
      requests_count: newRequestCount,
      daily_limit: dailyLimit,
      last_used_at:
        new Date().toISOString(),
    };

    return true;

  } catch (error) {
    request.log.error(
      error,
      "API key authentication failed"
    );

    if (!reply.sent) {
      reply.code(500).send({
        success: false,
        error: "API authentication failed",
      });
    }

    return false;
  }
}

/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {
  authenticateApiKey,
  hashApiKey,
};