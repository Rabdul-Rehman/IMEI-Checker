const crypto = require("crypto");
const { supabase } = require("../lib/supabase");

/*
=========================================================
ADMIN AUTHENTICATION
=========================================================
*/

function requireAdmin(request, reply) {
  const authorization = request.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    reply.code(401).send({
      success: false,
      error: "Missing admin authorization",
    });

    return false;
  }

  const providedKey = authorization
    .substring(7)
    .trim();

  if (!providedKey) {
    reply.code(401).send({
      success: false,
      error: "Missing admin key",
    });

    return false;
  }

  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    reply.code(500).send({
      success: false,
      error: "Admin authentication is not configured",
    });

    return false;
  }

  if (providedKey !== adminKey) {
    reply.code(401).send({
      success: false,
      error: "Invalid admin key",
    });

    return false;
  }

  return true;
}


/*
=========================================================
DATE HELPERS
=========================================================
*/

function startOfDay(daysAgo = 0) {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  date.setDate(
    date.getDate() - daysAgo
  );

  return date;
}


/*
=========================================================
API KEY HELPERS
=========================================================
*/

function generateApiKey() {
  return `imei_live_${crypto
    .randomBytes(32)
    .toString("hex")}`;
}

function hashApiKey(apiKey) {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
}


/*
=========================================================
ADMIN ROUTES
=========================================================
*/

async function adminRoutes(fastify) {

  /*
  ========================================================
  OVERVIEW
  GET /admin/overview
  ========================================================
  */

  fastify.get(
    "/admin/overview",
    async (request, reply) => {

      if (!requireAdmin(request, reply)) {
        return;
      }

      try {

        const [
          apiKeysResult,
          activeKeysResult,
          requestsResult,
          todayResult,
          monthResult,
          phonesResult,
          brandsResult,
          performanceResult,
        ] = await Promise.all([

          /*
          TOTAL API KEYS
          */

          supabase
            .from("api_keys")
            .select("*", {
              count: "exact",
              head: true,
            }),


          /*
          ACTIVE API KEYS
          */

          supabase
            .from("api_keys")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq(
              "is_active",
              true
            ),


          /*
          TOTAL REQUESTS
          */

          supabase
            .from("api_requests")
            .select("*", {
              count: "exact",
              head: true,
            }),


          /*
          REQUESTS TODAY
          */

          supabase
            .from("api_requests")
            .select("*", {
              count: "exact",
              head: true,
            })
            .gte(
              "created_at",
              startOfDay().toISOString()
            ),


          /*
          REQUESTS THIS MONTH
          */

          supabase
            .from("api_requests")
            .select("*", {
              count: "exact",
              head: true,
            })
            .gte(
              "created_at",
              new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ).toISOString()
            ),


          /*
          TOTAL PHONES
          */

          supabase
            .from("phones")
            .select("*", {
              count: "exact",
              head: true,
            }),


          /*
          TOTAL BRANDS
          */

          supabase
            .from("brands")
            .select("*", {
              count: "exact",
              head: true,
            }),


          /*
          PERFORMANCE DATA
          */

          supabase
            .from("api_requests")
            .select(
              "response_time_ms,status_code"
            )
            .not(
              "response_time_ms",
              "is",
              null
            )
            .limit(10000),
        ]);


        const results = [
          apiKeysResult,
          activeKeysResult,
          requestsResult,
          todayResult,
          monthResult,
          phonesResult,
          brandsResult,
          performanceResult,
        ];


        const failed = results.find(
          (item) => item.error
        );


        if (failed) {
          throw failed.error;
        }


        /*
        =====================================================
        AVERAGE RESPONSE TIME
        =====================================================
        */

        const rows =
          performanceResult.data || [];


        const times =
          rows
            .map((row) =>
              Number(
                row.response_time_ms
              )
            )
            .filter(
              Number.isFinite
            );


        const averageResponseTime =
          times.length
            ? Math.round(
                times.reduce(
                  (total, value) =>
                    total + value,
                  0
                ) / times.length
              )
            : 0;


        /*
        =====================================================
        ERROR COUNT
        =====================================================
        */

        const errorCount =
          rows.filter(
            (row) =>
              Number(
                row.status_code
              ) >= 400
          ).length;


        return {
          success: true,

          data: {

            requests: {
              total:
                requestsResult.count || 0,

              today:
                todayResult.count || 0,

              this_month:
                monthResult.count || 0,

              errors:
                errorCount,
            },


            api_keys: {
              total:
                apiKeysResult.count || 0,

              active:
                activeKeysResult.count || 0,
            },


            database: {
              phones:
                phonesResult.count || 0,

              brands:
                brandsResult.count || 0,
            },


            performance: {
              average_response_time_ms:
                averageResponseTime,
            },

          },

        };

      } catch (error) {

        fastify.log.error(
          "Admin overview error:",
          error
        );

        return reply
          .code(500)
          .send({
            success: false,
            error:
              "Failed to load admin overview",
          });
      }
    }
  );


/*
========================================================
RECENT REQUESTS
GET /admin/recent-requests
========================================================
*/

fastify.get(
  "/admin/recent-requests",
  async (request, reply) => {

    if (!requireAdmin(request, reply)) {
      return;
    }

    try {

      /*
      ====================================================
      LOAD RECENT REQUESTS
      ====================================================
      */

      const {
        data: requests,
        error: requestsError,
      } = await supabase
        .from("api_requests")
        .select(`
          id,
          api_key_id,
          method,
          endpoint,
          status_code,
          response_time_ms,
          ip_address,
          user_agent,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(20);


      /*
      ====================================================
      CHECK REQUEST QUERY ERROR
      ====================================================
      */

      if (requestsError) {

        fastify.log.error(
          "Recent requests Supabase error:",
          requestsError
        );

        throw requestsError;
      }


      /*
      ====================================================
      GET API KEY IDS
      ====================================================
      */

      const apiKeyIds = [
        ...new Set(
          (requests || [])
            .map(
              (request) =>
                request.api_key_id
            )
            .filter(Boolean)
        ),
      ];


      /*
      ====================================================
      LOAD API KEY INFORMATION
      ====================================================
      */

      let apiKeys = [];


      if (apiKeyIds.length > 0) {

        const {
          data,
          error,
        } = await supabase
          .from("api_keys")
          .select(
            "id,name,key_prefix"
          )
          .in(
            "id",
            apiKeyIds
          );


        if (error) {

          fastify.log.error(
            "API key lookup error:",
            error
          );

          /*
          Do not fail the request history
          if API key metadata cannot be loaded.
          */

          apiKeys = [];

        } else {

          apiKeys = data || [];

        }
      }


      /*
      ====================================================
      CREATE API KEY LOOKUP MAP
      ====================================================
      */

      const apiKeyMap = new Map();


      for (const key of apiKeys) {

        apiKeyMap.set(
          String(key.id),
          key
        );

      }


      /*
      ====================================================
      COMBINE REQUEST + API KEY DATA
      ====================================================
      */

      const result =
        (requests || []).map(
          (request) => {

            const apiKey =
              apiKeyMap.get(
                String(
                  request.api_key_id
                )
              );


            return {

              ...request,

              api_key:
                apiKey
                  ? {
                      name:
                        apiKey.name,

                      key_prefix:
                        apiKey.key_prefix,
                    }
                  : null,

            };

          }
        );


      /*
      ====================================================
      SUCCESS
      ====================================================
      */

      return {

        success: true,

        data: result,

      };


    } catch (error) {

      fastify.log.error(
        "Failed to load recent requests:",
        error
      );


      return reply
        .code(500)
        .send({

          success: false,

          error:
            "Failed to load recent requests",

        });

    }

  }
);

  /*
  ========================================================
  GET API KEYS
  GET /admin/api-keys
  ========================================================
  */

  fastify.get(
    "/admin/api-keys",
    async (request, reply) => {

      if (!requireAdmin(request, reply)) {
        return;
      }

      try {

        const {
          data,
          error,
        } = await supabase
          .from("api_keys")
          .select(`
            id,
            name,
            key_prefix,
            is_active,
            requests_count,
            daily_limit,
            created_at,
            last_used_at
          `)
          .order(
            "created_at",
            {
              ascending: false,
            }
          );


        if (error) {
          throw error;
        }


        return {
          success: true,
          data: data || [],
        };

      } catch (error) {

        fastify.log.error(
          "Admin API keys error:",
          error
        );

        return reply
          .code(500)
          .send({
            success: false,
            error:
              "Failed to load API keys",
          });
      }
    }
  );


  /*
  ========================================================
  CREATE CLIENT API KEY
  POST /admin/api-keys
  ========================================================
  */

  fastify.post(
    "/admin/api-keys",
    async (request, reply) => {

      if (!requireAdmin(request, reply)) {
        return;
      }

      try {

        const {
          name,
          daily_limit,
        } = request.body || {};


        /*
        VALIDATE NAME
        */

        if (
          !name ||
          !String(name).trim()
        ) {

          return reply
            .code(400)
            .send({
              success: false,
              error:
                "API key name is required",
            });
        }


        /*
        VALIDATE DAILY LIMIT
        */

        const limit =
          daily_limit === null ||
          daily_limit === undefined ||
          daily_limit === ""
            ? null
            : Number(
                daily_limit
              );


        if (
          limit !== null &&
          (
            !Number.isInteger(
              limit
            ) ||
            limit < 1 ||
            limit > 1000000
          )
        ) {

          return reply
            .code(400)
            .send({
              success: false,
              error:
                "Daily limit must be between 1 and 1,000,000, or null for unlimited",
            });
        }


        /*
        GENERATE KEY
        */

        const apiKey =
          generateApiKey();


        /*
        HASH KEY
        */

        const keyHash =
          hashApiKey(
            apiKey
          );


        /*
        PREFIX
        */

        const keyPrefix =
          apiKey.substring(
            0,
            18
          );


        /*
        SAVE
        */

        const {
          data,
          error,
        } = await supabase
          .from("api_keys")
          .insert({
            name:
              String(name).trim(),

            key_hash:
              keyHash,

            key_prefix:
              keyPrefix,

            is_active:
              true,

            requests_count:
              0,

            daily_limit:
              limit,
          })
          .select(`
            id,
            name,
            key_prefix,
            is_active,
            requests_count,
            daily_limit,
            created_at,
            last_used_at
          `)
          .single();


        if (error) {
          throw error;
        }


        return reply
          .code(201)
          .send({
            success: true,

            message:
              "API key created. Save this key now because it will not be shown again.",

            data: {
              api_key:
                apiKey,

              key:
                data,
            },
          });

      } catch (error) {

        fastify.log.error(
          "Create API key error:",
          error
        );

        return reply
          .code(500)
          .send({
            success: false,
            error:
              "Failed to create API key",
          });
      }
    }
  );


  /*
  ========================================================
  UPDATE API KEY
  PATCH /admin/api-keys/:id
  ========================================================
  */

  fastify.patch(
    "/admin/api-keys/:id",
    async (request, reply) => {

      if (!requireAdmin(request, reply)) {
        return;
      }

      try {

        /*
        Don't force the ID to Number.
        Supabase may use UUID or integer.
        */

        const id =
          request.params.id;


        if (
          !id ||
          String(id).trim() === ""
        ) {

          return reply
            .code(400)
            .send({
              success: false,
              error:
                "Invalid API key ID",
            });
        }


        const {
          name,
          daily_limit,
          is_active,
        } = request.body || {};


        const updates = {};


        /*
        NAME
        */

        if (
          name !== undefined
        ) {

          const cleanName =
            String(name).trim();


          if (!cleanName) {

            return reply
              .code(400)
              .send({
                success: false,
                error:
                  "Name cannot be empty",
              });
          }


          updates.name =
            cleanName;
        }


        /*
        DAILY LIMIT
        */

        if (
          daily_limit !== undefined
        ) {

          const limit =
            daily_limit === null ||
            daily_limit === ""
              ? null
              : Number(
                  daily_limit
                );


          if (
            limit !== null &&
            (
              !Number.isInteger(
                limit
              ) ||
              limit < 1 ||
              limit > 1000000
            )
          ) {

            return reply
              .code(400)
              .send({
                success: false,
                error:
                  "Daily limit must be between 1 and 1,000,000, or null",
              });
          }


          updates.daily_limit =
            limit;
        }


        /*
        ACTIVE / DISABLED
        */

        if (
          is_active !== undefined
        ) {

          if (
            typeof is_active !==
            "boolean"
          ) {

            return reply
              .code(400)
              .send({
                success: false,
                error:
                  "is_active must be true or false",
              });
          }


          updates.is_active =
            is_active;
        }


        /*
        NO CHANGES
        */

        if (
          Object.keys(
            updates
          ).length === 0
        ) {

          return reply
            .code(400)
            .send({
              success: false,
              error:
                "No changes supplied",
            });
        }


        /*
        UPDATE
        */

        const {
          data,
          error,
        } = await supabase
          .from("api_keys")
          .update(updates)
          .eq(
            "id",
            id
          )
          .select(`
            id,
            name,
            key_prefix,
            is_active,
            requests_count,
            daily_limit,
            created_at,
            last_used_at
          `)
          .single();


        if (error) {
          throw error;
        }


        return {
          success: true,

          message:
            "API key updated",

          data,
        };

      } catch (error) {

        fastify.log.error(
          "Update API key error:",
          error
        );

        return reply
          .code(500)
          .send({
            success: false,
            error:
              "Failed to update API key",
          });
      }
    }
  );


  /*
  ========================================================
  REVOKE API KEY
  DELETE /admin/api-keys/:id
  ========================================================
  */

  fastify.delete(
    "/admin/api-keys/:id",
    async (request, reply) => {

      if (!requireAdmin(request, reply)) {
        return;
      }

      try {

        const id =
          request.params.id;


        if (
          !id ||
          String(id).trim() === ""
        ) {

          return reply
            .code(400)
            .send({
              success: false,
              error:
                "Invalid API key ID",
            });
        }


        const {
          data,
          error,
        } = await supabase
          .from("api_keys")
          .update({
            is_active:
              false,
          })
          .eq(
            "id",
            id
          )
          .select(`
            id,
            name,
            key_prefix,
            is_active,
            requests_count,
            daily_limit,
            created_at,
            last_used_at
          `)
          .single();


        if (error) {
          throw error;
        }


        return {
          success: true,

          message:
            "API key revoked",

          data,
        };

      } catch (error) {

        fastify.log.error(
          "Revoke API key error:",
          error
        );

        return reply
          .code(500)
          .send({
            success: false,
            error:
              "Failed to revoke API key",
          });
      }
    }
  );


  /*
  ========================================================
  ANALYTICS
  GET /admin/analytics
  ========================================================
  */

  fastify.get(
    "/admin/analytics",
    async (request, reply) => {

      if (!requireAdmin(request, reply)) {
        return;
      }

      try {

        const days =
          Math.min(
            Math.max(
              Number(
                request.query.days
              ) || 7,
              1
            ),
            30
          );


        const since =
          startOfDay(
            days - 1
          ).toISOString();


        const {
          data,
          error,
        } = await supabase
          .from("api_requests")
          .select(
            "endpoint,status_code,created_at"
          )
          .gte(
            "created_at",
            since
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          )
          .limit(
            10000
          );


        if (error) {
          throw error;
        }


        const dayMap =
          new Map();

        const endpointMap =
          new Map();

        const statusMap =
          new Map();


        /*
        CREATE DAYS
        */

        for (
          let i = days - 1;
          i >= 0;
          i--
        ) {

          const date =
            startOfDay(i);


          const key =
            date
              .toISOString()
              .slice(
                0,
                10
              );


          dayMap.set(
            key,
            {
              date:
                key,

              label:
                date.toLocaleDateString(
                  "en-US",
                  {
                    weekday:
                      "short",
                  }
                ),

              requests:
                0,
            }
          );
        }


        /*
        PROCESS REQUESTS
        */

        for (
          const row of data || []
        ) {

          const dateKey =
            new Date(
              row.created_at
            )
              .toISOString()
              .slice(
                0,
                10
              );


          if (
            dayMap.has(
              dateKey
            )
          ) {

            dayMap.get(
              dateKey
            ).requests += 1;
          }


          const endpoint =
            row.endpoint ||
            "unknown";


          endpointMap.set(
            endpoint,
            (
              endpointMap.get(
                endpoint
              ) || 0
            ) + 1
          );


          const status =
            String(
              row.status_code ||
              0
            );


          statusMap.set(
            status,
            (
              statusMap.get(
                status
              ) || 0
            ) + 1
          );
        }


        /*
        TOP ENDPOINTS
        */

        const endpoints =
          [
            ...endpointMap.entries()
          ]
            .map(
              ([
                endpoint,
                requests,
              ]) => ({
                endpoint,
                requests,
              })
            )
            .sort(
              (a, b) =>
                b.requests -
                a.requests
            )
            .slice(
              0,
              10
            );


        /*
        STATUS CODES
        */

        const statuses =
          [
            ...statusMap.entries()
          ]
            .map(
              ([
                status,
                requests,
              ]) => ({
                status,
                requests,
              })
            )
            .sort(
              (a, b) =>
                Number(
                  a.status
                ) -
                Number(
                  b.status
                )
            );


        return {
          success: true,

          data: {

            days:
              [
                ...dayMap.values()
              ],

            endpoints,

            statuses,

          },
        };

      } catch (error) {

        fastify.log.error(
          "Analytics error:",
          error
        );

        return reply
          .code(500)
          .send({
            success: false,
            error:
              "Failed to load analytics",
          });
      }
    }
  );
}


module.exports =
  adminRoutes;