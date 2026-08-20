require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});

const Fastify = require("fastify");
const cors = require("@fastify/cors");

const phoneRoutes = require("./routes/phones");
const imeiGeneratorRoutes = require("./routes/imeiGenerator");
const brandRoutes = require("./routes/brands");
const searchRoutes = require("./routes/search");
const statsRoutes = require("./routes/stats");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

const { authenticateApiKey } = require("./lib/apiKeyAuth");
const { supabase } = require("./lib/supabase");

const fastify = Fastify({
  logger: true,
});

/*
=====================================================
REQUEST START TIME
=====================================================
*/

fastify.addHook("onRequest", async (request) => {
  request.startTime = Date.now();
});

/*
=====================================================
API REQUEST LOGGING
=====================================================

Only requests authenticated with a client API key
are recorded in api_requests.
=====================================================
*/

fastify.addHook("onResponse", async (request, reply) => {
  if (!request.apiKey) {
    return;
  }

  try {
    const responseTimeMs =
      Date.now() - (request.startTime || Date.now());

    const { error } = await supabase
      .from("api_requests")
      .insert({
        api_key_id: request.apiKey.id,
        method: request.method,
        endpoint: request.url,
        status_code: reply.statusCode,
        response_time_ms: responseTimeMs,
        ip_address: request.ip || null,
        user_agent:
          request.headers["user-agent"] || null,
      });

    if (error) {
      request.log.error(
        error,
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

/*
=====================================================
START SERVER
=====================================================
*/

async function start() {
  try {
    /*
    =================================================
    CORS
    =================================================
    */

    await fastify.register(cors, {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    // Cloudflare frontend
    "https://hist-bugs-dna-america.trycloudflare.com",
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

  credentials: true,
});

    /*
    =================================================
    PUBLIC HEALTH CHECK
    =================================================
    */

    fastify.get("/", async () => {
      return {
        success: true,
        message: "IMEI.info API is running",
        version: "v1",
      };
    });

    /*
    =================================================
    GLOBAL AUTHENTICATION
    =================================================

    PUBLIC:
      /
      /api/v1/auth/*
      /api/v1/public/*
      /api/v1/imei-generator/*

    ADMIN:
      /api/v1/admin/*

    API KEY REQUIRED:
      Everything else under /api/v1/*
    =================================================
    */

    fastify.addHook(
      "onRequest",
      async (request, reply) => {
        /*
        =============================================
        CORS PREFLIGHT
        =============================================
        */

        if (request.method === "OPTIONS") {
          return;
        }

        /*
        =============================================
        HEALTH CHECK
        =============================================
        */

        if (request.url === "/") {
          return;
        }

        /*
        =============================================
        AUTH ROUTES
        =============================================

        Login/register are public.

        /auth/me performs its own JWT
        authentication inside auth.js.
        */

        if (
          request.url.startsWith(
            "/api/v1/auth/"
          )
        ) {
          return;
        }

        /*
        =============================================
        PUBLIC WEBSITE ROUTES
        =============================================

        IMPORTANT:

        These routes NEVER require an API key.

        This is what allows our own website to
        perform IMEI checks without needing a
        client API key.
        */

        if (
          request.url.startsWith(
            "/api/v1/public/"
          )
        ) {
          return;
        }

        /*
        =============================================
        IMEI GENERATOR ROUTES
        =============================================

        These are currently public because they
        are part of the website itself.
        */

        if (
          request.url.startsWith(
            "/api/v1/imei-generator/"
          )
        ) {
          return;
        }

        /*
        =============================================
        ADMIN ROUTES
        =============================================

        admin.js handles its own authentication.
        */

        if (
          request.url.startsWith(
            "/api/v1/admin/"
          )
        ) {
          return;
        }

        /*
        =============================================
        NORMAL API ROUTES
        =============================================

        Everything else under /api/v1 requires
        an external client API key.
        */

        if (
          request.url.startsWith(
            "/api/v1/"
          )
        ) {
          const authenticated =
            await authenticateApiKey(
              request,
              reply
            );

          if (!authenticated) {
            return;
          }
        }
      }
    );

    /*
    =================================================
    AUTH ROUTES
    =================================================
    */

    await fastify.register(authRoutes, {
      prefix: "/api/v1",
    });

    /*
    =================================================
    PHONE ROUTES
    =================================================
    */

    await fastify.register(phoneRoutes, {
      prefix: "/api/v1",
    });

    /*
    =================================================
    IMEI GENERATOR ROUTES
    =================================================
    */

    await fastify.register(
      imeiGeneratorRoutes,
      {
        prefix: "/api/v1",
      }
    );

    /*
    =================================================
    BRAND ROUTES
    =================================================
    */

    await fastify.register(brandRoutes, {
      prefix: "/api/v1",
    });

    /*
    =================================================
    SEARCH ROUTES
    =================================================
    */

    await fastify.register(searchRoutes, {
      prefix: "/api/v1",
    });

    /*
    =================================================
    STATS ROUTES
    =================================================
    */

    await fastify.register(statsRoutes, {
      prefix: "/api/v1",
    });

    /*
    =================================================
    ADMIN ROUTES
    =================================================
    */

    await fastify.register(adminRoutes, {
      prefix: "/api/v1",
    });

    /*
    =================================================
    START LISTENING
    =================================================
    */

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

/*
=====================================================
START
=====================================================
*/

start();