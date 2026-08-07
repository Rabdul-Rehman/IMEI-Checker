require("dotenv").config({
  path: ".env.local",
});

const Fastify = require("fastify");
const cors = require("@fastify/cors");

const phoneRoutes = require("./routes/phones");
const brandRoutes = require("./routes/brands");
const searchRoutes = require("./routes/search");
const statsRoutes = require("./routes/stats");
const adminRoutes = require("./routes/admin");

const { authenticateApiKey } = require("./lib/apiKeyAuth");

const { supabase } = require("./lib/supabase");


const fastify = Fastify({
  logger: true,
});


// =====================================================
// API REQUEST LOGGING
// =====================================================

fastify.addHook("onRequest", async (request) => {
  request.startTime = Date.now();
});


fastify.addHook("onResponse", async (request, reply) => {

  // Only log authenticated API requests
  if (!request.apiKey) {
    return;
  }

  try {

    const responseTime =
      Date.now() - request.startTime;


    const { error } = await supabase
      .from("api_requests")
      .insert({

        api_key_id:
          request.apiKey.id,

        method:
          request.method,

        endpoint:
          request.url,

        status_code:
          reply.statusCode,

        response_time_ms:
          responseTime,

        ip_address:
          request.ip,

        user_agent:
          request.headers["user-agent"] || null,

      });


    if (error) {

      request.log.error(
        {
          error,
        },
        "Failed to record API request"
      );

    }

  } catch (error) {

    request.log.error(
      error,
      "API request logging failed"
    );

  }

});

async function start() {
  try {

    // =====================================================
    // CORS
    // =====================================================

    await fastify.register(cors, {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],

      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],

      allowedHeaders: [
        "Content-Type",
        "Authorization",
      ],
    });


    // =====================================================
    // PUBLIC HEALTH CHECK
    // =====================================================

    fastify.get("/", async () => {
      return {
        success: true,
        message: "IMEI.info API is running",
        version: "v1",
      };
    });


    // =====================================================
    // AUTHENTICATION
    // =====================================================

    fastify.addHook("onRequest", async (request, reply) => {

      request.startTime = Date.now();

      // Allow CORS preflight
      if (request.method === "OPTIONS") {
        return;
      }

      // Public health check
      if (request.url === "/") {
        return;
      }

      /*
      =====================================================
      ADMIN ROUTES

      Admin routes use ADMIN_API_KEY from .env.local.

      They MUST NOT go through normal API-key
      authentication.

      admin.js handles admin authentication itself.
      =====================================================
      */

      if (request.url.startsWith("/api/v1/admin")) {
        return;
      }


      /*
      =====================================================
      NORMAL API ROUTES

      Phones, brands, search, stats etc.
      require a normal user API key.
      =====================================================
      */

      /*if (request.url.startsWith("/api")) {
        return authenticateApiKey(request, reply);
      }*/

    });

    fastify.addHook("onResponse", async (request, reply) => {
  try {
    // Only log authenticated API requests
    if (!request.apiKey) {
      return;
    }

    const startTime = request.startTime || Date.now();

    const responseTimeMs =
      Date.now() - startTime;

    await supabase
      .from("api_requests")
      .insert({
        api_key_id: request.apiKey.id,
        method: request.method,
        endpoint: request.url,
        status_code: reply.statusCode,
        response_time_ms: responseTimeMs,
        ip_address:
          request.ip || null,
        user_agent:
          request.headers["user-agent"] || null,
      });

  } catch (error) {
    request.log.error(
      error,
      "Failed to record API request"
    );
  }
});


    // =====================================================
    // API ROUTES
    // =====================================================

    await fastify.register(phoneRoutes, {
      prefix: "/api/v1",
    });

    await fastify.register(brandRoutes, {
      prefix: "/api/v1",
    });

    await fastify.register(searchRoutes, {
      prefix: "/api/v1",
    });

    await fastify.register(statsRoutes, {
      prefix: "/api/v1",
    });

    await fastify.register(adminRoutes, {
      prefix: "/api/v1",
    });


    // =====================================================
    // START SERVER
    // =====================================================

    await fastify.listen({
      port: 8000,
      host: "0.0.0.0",
    });

    console.log(
      "IMEI.info API running at http://localhost:8000"
    );

  } catch (error) {

    fastify.log.error(error);

    process.exit(1);
  }
}

start();





