const { supabase } = require("../lib/supabase");

async function statsRoutes(fastify) {

  // =====================================================
  // GET /api/v1/stats
  // =====================================================

  fastify.get("/stats", async (request, reply) => {

    // Both counts are independent - run them concurrently
    // instead of waiting on one before starting the other.
    const [
      {
        count: phoneCount,
        error: phoneError,
      },
      {
        count: brandCount,
        error: brandError,
      },
    ] = await Promise.all([
      supabase
        .from("phones")
        .select("*", {
          count: "exact",
          head: true,
        }),
      supabase
        .from("brands")
        .select("*", {
          count: "exact",
          head: true,
        }),
    ]);

    if (phoneError || brandError) {
      return reply.code(500).send({
        success: false,
        error:
          phoneError?.message ||
          brandError?.message ||
          "Unable to load statistics",
      });
    }

    return {
      success: true,
      data: {
        total_phones: phoneCount || 0,
        total_brands: brandCount || 0,
      },
    };
  });
}

module.exports = statsRoutes;