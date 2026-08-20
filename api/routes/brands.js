  const { supabase } = require("../lib/supabase");

  async function brandRoutes(fastify) {

    // GET /api/brands
    // Returns all brands with pagination
    fastify.get("/brands", async (request, reply) => {
      try {
        const {
          search,
          limit = 50,
          offset = 0,
        } = request.query;

        const parsedLimit = Math.min(
          Math.max(Number(limit) || 50, 1),
          100
        );

        const parsedOffset = Math.max(
          Number(offset) || 0,
          0
        );

        let query = supabase
          .from("brands")
          .select(`
            brand_id,
            name
          `, {
            count: "exact",
          });

        // Search brand name
        if (search) {
          query = query.ilike(
            "name",
            `%${search}%`
          );
        }

        query = query
          .order("name")
          .range(
            parsedOffset,
            parsedOffset + parsedLimit - 1
          );

        const { data, error, count } = await query;

        if (error) {
          return reply.code(500).send({
            success: false,
            error: error.message,
          });
        }

        return {
          success: true,
          count: count || 0,
          limit: parsedLimit,
          offset: parsedOffset,
          data: data || [],
        };

      } catch (error) {

        request.log.error(
          error,
          "Brands list error"
        );

        return reply.code(500).send({
          success: false,
          error: "Failed to load brands",
        });
      }
    });


    // GET /api/brands/:brandId
    // Returns one brand and its phones
    fastify.get(
      "/brands/:brandId",
      async (request, reply) => {

        try {

          const { brandId } = request.params;

          const { data: brand, error: brandError } =
            await supabase
              .from("brands")
              .select(`
                brand_id,
                name
              `)
              .eq("brand_id", brandId)
              .single();

          if (brandError || !brand) {
            return reply.code(404).send({
              success: false,
              error: "Brand not found",
            });
          }

          const { data: phones, error: phonesError } =
            await supabase
              .from("phones")
              .select(`
                phone_id,
                model_name,
                slug,
                brand_id
              `)
              .eq("brand_id", brandId)
              .order("model_name");

          if (phonesError) {
            return reply.code(500).send({
              success: false,
              error: phonesError.message,
            });
          }

          return {
            success: true,
            data: {
              ...brand,
              phones: phones || [],
            },
          };

        } catch (error) {

          request.log.error(
            error,
            "Brand lookup error"
          );

          return reply.code(500).send({
            success: false,
            error: "Failed to load brand",
          });
        }
      }
    );


    // GET /api/brands/:brandId/phones
    // Returns only phones belonging to a brand
    fastify.get(
      "/brands/:brandId/phones",
      async (request, reply) => {

        try {

          const {
            brandId,
            search,
            limit = 20,
            offset = 0,
          } = {
            ...request.params,
            ...request.query,
          };

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
            .select(`
              phone_id,
              model_name,
              slug,
              brand_id
            `, {
              count: "exact",
            })
            .eq("brand_id", brandId);

          if (search) {
            query = query.ilike(
              "model_name",
              `%${search}%`
            );
          }

          query = query
            .order("model_name")
            .range(
              parsedOffset,
              parsedOffset + parsedLimit - 1
            );

          const { data, error, count } = await query;

          if (error) {
            return reply.code(500).send({
              success: false,
              error: error.message,
            });
          }

          return {
            success: true,
            brand_id: brandId,
            count: count || 0,
            limit: parsedLimit,
            offset: parsedOffset,
            data: data || [],
          };

        } catch (error) {

          request.log.error(
            error,
            "Brand phones list error"
          );

          return reply.code(500).send({
            success: false,
            error: "Failed to load brand phones",
          });
        }
      }
    );
  }

  module.exports = brandRoutes;