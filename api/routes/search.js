const { supabase } = require("../lib/supabase");

async function searchRoutes(fastify) {

  // =====================================================
  // GET /api/v1/search?q=
  // =====================================================

  fastify.get("/search", async (request, reply) => {

    try {

      const {
        q,
        limit = 20,
      } = request.query;

      if (!q || !q.trim()) {
        return reply.code(400).send({
          success: false,
          error: "Search query 'q' is required",
        });
      }

      const parsedLimit = Math.min(
        Math.max(Number(limit) || 20, 1),
        100
      );

      const {
        data,
        error,
      } = await supabase
        .from("phones")
        .select(`
          phone_id,
          model_name,
          slug,
          brand_id,
          brands (
            brand_id,
            name
          )
        `)
        .ilike(
          "model_name",
          `%${q.trim()}%`
        )
        .order("model_name")
        .limit(parsedLimit);

      if (error) {
        return reply.code(500).send({
          success: false,
          error: error.message,
        });
      }

      return {
        success: true,
        query: q,
        count: data?.length || 0,
        data: data || [],
      };

    } catch (error) {

      request.log.error(
        error,
        "Search error"
      );

      return reply.code(500).send({
        success: false,
        error: "Search failed",
      });
    }
  });
}

module.exports = searchRoutes;
