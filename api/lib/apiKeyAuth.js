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

  /*
  -------------------------------------------------------
  GET AUTHORIZATION HEADER
  -------------------------------------------------------
  */

  const authorization =
    request.headers.authorization;


  /*
  -------------------------------------------------------
  CHECK AUTHORIZATION EXISTS
  -------------------------------------------------------
  */

  if (!authorization) {

    return reply
      .code(401)
      .send({

        success: false,

        error:
          "Missing API key",

        message:
          "Use Authorization: Bearer YOUR_API_KEY",

      });

  }


  /*
  -------------------------------------------------------
  CHECK BEARER FORMAT
  -------------------------------------------------------
  */

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {

    return reply
      .code(401)
      .send({

        success: false,

        error:
          "Invalid authorization format",

        message:
          "Use Authorization: Bearer YOUR_API_KEY",

      });

  }


  /*
  -------------------------------------------------------
  EXTRACT API KEY
  -------------------------------------------------------
  */

  const apiKey =
    authorization
      .substring(7)
      .trim();


  /*
  -------------------------------------------------------
  CHECK API KEY EXISTS
  -------------------------------------------------------
  */

  if (!apiKey) {

    return reply
      .code(401)
      .send({

        success: false,

        error:
          "Missing API key",

      });

  }


  /*
  -------------------------------------------------------
  HASH PROVIDED KEY
  -------------------------------------------------------
  */

  const keyHash =
    hashApiKey(apiKey);


  /*
  -------------------------------------------------------
  FIND API KEY
  -------------------------------------------------------
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

    .eq(
      "key_hash",
      keyHash
    )

    .eq(
      "is_active",
      true
    )

    .single();


  /*
  -------------------------------------------------------
  INVALID KEY
  -------------------------------------------------------
  */

  if (
    error ||
    !data
  ) {

    return reply
      .code(401)
      .send({

        success: false,

        error:
          "Invalid API key",

      });

  }


  /*
  =======================================================
  DAILY LIMIT LOGIC
  =======================================================
  */


  const today =
    startOfToday();


  const lastUsed =
    data.last_used_at
      ? new Date(
          data.last_used_at
        )
      : null;


  /*
  -------------------------------------------------------
  DETERMINE CURRENT DAILY USAGE
  -------------------------------------------------------

  If the key was last used before today,
  its current daily usage is zero.

  Otherwise keep the existing count.
  */

  let currentRequests =
    data.requests_count || 0;


  if (
    !lastUsed ||
    lastUsed < today
  ) {

    currentRequests = 0;

  }


  /*
  -------------------------------------------------------
  CHECK DAILY LIMIT
  -------------------------------------------------------
  */

  if (
    currentRequests >=
    data.daily_limit
  ) {

    return reply
      .code(429)
      .send({

        success: false,

        error:
          "API daily limit exceeded",

        limit:
          data.daily_limit,

        used:
          currentRequests,

        remaining:
          0,

      });

  }


  /*
  -------------------------------------------------------
  NEW REQUEST COUNT
  -------------------------------------------------------
  */

  const newRequestCount =
    currentRequests + 1;


  /*
  -------------------------------------------------------
  UPDATE API KEY USAGE
  -------------------------------------------------------
  */

  const {
    error:
      updateError,
  } = await supabase

    .from("api_keys")

    .update({

      requests_count:
        newRequestCount,

      last_used_at:
        new Date().toISOString(),

    })

    .eq(
      "id",
      data.id
    );


  /*
  -------------------------------------------------------
  HANDLE UPDATE ERROR
  -------------------------------------------------------
  */

  if (updateError) {

    request.log.error(
      updateError
    );

    return reply
      .code(500)
      .send({

        success: false,

        error:
          "Failed to update API usage",

      });

  }


  /*
  -------------------------------------------------------
  ATTACH API KEY TO REQUEST
  -------------------------------------------------------
  */

  request.apiKey = {

    ...data,

    requests_count:
      newRequestCount,

  };

}


module.exports = {

  authenticateApiKey,

  hashApiKey,

};