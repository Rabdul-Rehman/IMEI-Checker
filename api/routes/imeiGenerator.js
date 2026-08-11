const crypto = require("crypto");
const { supabase } = require("../lib/supabase");

// =====================================================
// IMEI LUHN CHECK DIGIT
// =====================================================

function calculateLuhnCheckDigit(number14) {
    let sum = 0;

    for (let i = 0; i < 14; i++) {
        let digit = Number(number14[i]);

        // Double digits in positions 2,4,6... from the right
        if (i % 2 === 1) {
            digit *= 2;

            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
    }

    return String((10 - (sum % 10)) % 10);
}

// =====================================================
// GENERATE ONE IMEI
// =====================================================

function generateImeiFromTac(tac) {
    const randomSix = crypto
        .randomInt(0, 1000000)
        .toString()
        .padStart(6, "0");

    const first14 = tac + randomSix;

    const checkDigit =
        calculateLuhnCheckDigit(first14);

    return first14 + checkDigit;
}

// =====================================================
// ROUTES
// =====================================================

async function imeiGeneratorRoutes(fastify) {

    // =================================================
    // GET /api/v1/imei-generator/brands
    // =================================================

    fastify.get(
        "/imei-generator/brands",
        async (request, reply) => {

            const { data, error } = await supabase
                .from("brands")
                .select(`
                    brand_id,
                    name
                `)
                .order("name");

            if (error) {
                return reply.code(500).send({
                    success: false,
                    error: error.message,
                });
            }

            return {
                success: true,
                data: data || [],
            };
        }
    );

    // =================================================
    // GET /api/v1/imei-generator/brands/:brandId/models
    // =================================================

    fastify.get(
        "/imei-generator/brands/:brandId/models",
        async (request, reply) => {

            const brandId =
                Number(request.params.brandId);

            if (!Number.isInteger(brandId)) {
                return reply.code(400).send({
                    success: false,
                    error: "Invalid brand ID",
                });
            }

            const { data, error } = await supabase
                .from("phones")
                .select(`
                    phone_id,
                    model_name,
                    slug,
                    brand_id
                `)
                .eq("brand_id", brandId)
                .order("model_name");

            if (error) {
                return reply.code(500).send({
                    success: false,
                    error: error.message,
                });
            }

            return {
                success: true,
                data: data || [],
            };
        }
    );

    // =================================================
    // GET /api/v1/imei-generator/phones/:phoneId
    // =================================================

    fastify.get(
        "/imei-generator/phones/:phoneId",
        async (request, reply) => {

            const phoneId =
                Number(request.params.phoneId);

            if (!Number.isInteger(phoneId)) {
                return reply.code(400).send({
                    success: false,
                    error: "Invalid phone ID",
                });
            }

            const { data: phone, error: phoneError } =
                await supabase
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
                    .eq("phone_id", phoneId)
                    .single();

            if (phoneError || !phone) {
                return reply.code(404).send({
                    success: false,
                    error: "Phone not found",
                });
            }

            // Find TAC mapped to this phone
            const { data: lookup, error: lookupError } =
                await supabase
                    .from("imei_lookups")
                    .select(`
                        tac
                    `)
                    .eq("phone_id", phoneId)
                    .not("tac", "is", null)
                    .limit(1)
                    .maybeSingle();

            return {
                success: true,
                data: {
                    phone_id: phone.phone_id,
                    model_name: phone.model_name,
                    slug: phone.slug,
                    brand: phone.brands,
                    tac: lookup?.tac || null,
                    can_generate: !!lookup?.tac,
                    error:
                        lookupError
                            ? lookupError.message
                            : null,
                },
            };
        }
    );

    // =================================================
    // POST /api/v1/imei-generator/generate
    // =================================================
fastify.post(
  "/imei-generator/generate",
  async (request, reply) => {
    try {
      const {
        phone_id,
        count = 1,
      } = request.body || {};

      const phoneId = Number(phone_id);

      const requestedCount = Math.min(
        Math.max(Number(count) || 1, 1),
        10
      );

      if (!Number.isInteger(phoneId)) {
        return reply.code(400).send({
          success: false,
          error: "phone_id is required",
        });
      }

      // Get phone information
      const { data: phone, error: phoneError } =
        await supabase
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
          .eq("phone_id", phoneId)
          .single();

      if (phoneError || !phone) {
        return reply.code(404).send({
          success: false,
          error: "Phone not found",
        });
      }

      // Try to get the TAC from imei_lookups
      const { data: lookup, error: lookupError } =
        await supabase
          .from("imei_lookups")
          .select("tac")
          .eq("phone_id", phoneId)
          .not("tac", "is", null)
          .limit(1)
          .maybeSingle();

      if (lookupError) {
        console.error("TAC lookup error:", lookupError);
      }

      // -------------------------------------------------
      // TEMPORARY TEST TAC
      // Camon 12 Air = phone_id 145
      // -------------------------------------------------

      let tac = lookup?.tac
        ? String(lookup.tac).replace(/\D/g, "")
        : "";

      if (phoneId === 145 && !tac) {
        tac = "35678910";
      }

      if (!tac) {
        return reply.code(404).send({
          success: false,
          error:
            "IMEI generation is not available for this model yet",
        });
      }

      if (tac.length !== 8) {
        return reply.code(500).send({
          success: false,
          error: "Invalid TAC configuration",
        });
      }

      // Generate IMEIs
      const imeis = [];

      for (let i = 0; i < requestedCount; i++) {
        imeis.push(generateImeiFromTac(tac));
      }

      return {
        success: true,
        data: {
          phone_id: phone.phone_id,
          brand: phone.brands?.name || null,
          model_name: phone.model_name,
          tac,
          count: imeis.length,
          imeis,
        },
      };
    } catch (error) {
      console.error("IMEI GENERATOR ERROR:", error);

      return reply.code(500).send({
        success: false,
        error: error.message || "Failed to generate IMEIs",
      });
    }
  }
);

}


module.exports = imeiGeneratorRoutes;