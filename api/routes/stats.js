const { supabase } = require("../lib/supabase");

async function statsRoutes(fastify) {

  // =====================================================
  // GET /api/v1/stats
  // =====================================================

  fastify.get("/stats", async (request, reply) => {

    const {
      count: phoneCount,
      error: phoneError,
    } = await supabase
      .from("phones")
      .select("*", {
        count: "exact",
        head: true,
      });

    const {
      count: brandCount,
      error: brandError,
    } = await supabase
      .from("brands")
      .select("*", {
        count: "exact",
        head: true,
      });

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