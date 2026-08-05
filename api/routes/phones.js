const { supabase } = require("../lib/supabase");

async function phoneRoutes(fastify) {

  // =====================================================
  // GET /api/v1/phones
  // =====================================================

  fastify.get("/phones", async (request, reply) => {

    const {
      search,
      brand,
      limit = 20,
      offset = 0,
    } = request.query;

    const parsedLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const parsedOffset = Math.max(
      Number(offset) || 0,
      0
    );

    let query = supabase
      .from("phones")
      .select(
        `
        phone_id,
        model_name,
        slug,
        specs_json,
        brand_id,
        brands (
          brand_id,
          name
        )
        `,
        {
          count: "exact",
        }
      );

    // Search model
    if (search) {
      query = query.ilike(
        "model_name",
        `%${search}%`
      );
    }

    // Filter brand
    if (brand) {
      query = query.eq(
        "brands.name",
        brand
      );
    }

    query = query
      .order("model_name")
      .range(
        parsedOffset,
        parsedOffset + parsedLimit - 1
      );

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }

    return {
      success: true,
      pagination: {
        total: count || 0,
        limit: parsedLimit,
        offset: parsedOffset,
      },
      data: data || [],
    };
  });


  // =====================================================
  // GET /api/v1/phones/:slug
  // =====================================================

  fastify.get(
    "/phones/:slug",
    async (request, reply) => {

      const { slug } = request.params;

      const {
        data,
        error,
      } = await supabase
        .from("phones")
        .select(
          `
          phone_id,
          model_name,
          slug,
          specs_json,
          brand_id,
          brands (
            brand_id,
            name
          )
          `
        )
        .eq("slug", slug)
        .single();

      if (error || !data) {
        return reply.code(404).send({
          success: false,
          error: "Phone not found",
        });
      }

      return {
        success: true,
        data,
      };
    }
  );


  // =====================================================
  // GET /api/v1/phones/:slug/specs
  // =====================================================

  fastify.get(
    "/phones/:slug/specs",
    async (request, reply) => {

      const { slug } = request.params;

      const {
        data,
        error,
      } = await supabase
        .from("phones")
        .select(
          `
          phone_id,
          model_name,
          slug,
          specs_json,
          brands (
            brand_id,
            name
          )
          `
        )
        .eq("slug", slug)
        .single();

      if (error || !data) {
        return reply.code(404).send({
          success: false,
          error: "Phone not found",
        });
      }

      return {
        success: true,
        data: {
          phone_id: data.phone_id,
          model_name: data.model_name,
          slug: data.slug,
          brand: data.brands,
          specs: data.specs_json || {},
        },
      };
    }
  );
}

module.exports = phoneRoutes;