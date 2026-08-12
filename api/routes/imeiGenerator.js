const crypto = require("crypto");
const { supabase } = require("../lib/supabase");

// =====================================================
// IMEI LUHN CHECK DIGIT
// =====================================================

function calculateLuhnCheckDigit(number14) {
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    let digit = Number(number14[i]);

    // IMEI Luhn calculation:
    // double every second digit from the left
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
// GENERATE ONE IMEI FROM A REAL TAC
// =====================================================

function generateImeiFromTac(tac) {
  const serialNumber = crypto
    .randomInt(0, 1000000)
    .toString()
    .padStart(6, "0");

  const first14 = `${tac}${serialNumber}`;

  const checkDigit = calculateLuhnCheckDigit(first14);

  return `${first14}${checkDigit}`;
}

// =====================================================
// GET REAL TAC FOR PHONE
//
// TAC comes from tac_allocations.
// This is the production database mapping.
//
// We DO NOT use:
// - test TAC
// - fallback TAC
// - hardcoded phone IDs
// - IMEI_TEST_TAC
// =====================================================

async function getTacForPhone(phoneId) {
  const { data, error } = await supabase
    .from("tac_allocations")
    .select("tac")
    .eq("phone_id", phoneId)
    .not("tac", "is", null)
    .limit(1);

  if (error) {
    throw error;
  }

  const tac = data?.[0]?.tac
    ? String(data[0].tac).replace(/\D/g, "")
    : "";

  if (!tac) {
    return null;
  }

  if (tac.length !== 8) {
    throw new Error("Invalid TAC configuration for this device.");
  }

  return tac;
}

// =====================================================
// ROUTES
// =====================================================

async function imeiGeneratorRoutes(fastify) {
  // ===================================================
  // GET /api/v1/imei-generator/brands
  // ===================================================

  fastify.get(
    "/imei-generator/brands",
    async (request, reply) => {
      try {
        const { data, error } = await supabase
          .from("brands")
          .select(`
            brand_id,
            name
          `)
          .order("name");

        if (error) {
          request.log.error(error, "Failed to load IMEI generator brands");

          return reply.code(500).send({
            success: false,
            error: "Failed to load brands",
          });
        }

        return {
          success: true,
          data: data || [],
        };
      } catch (error) {
        request.log.error(error, "IMEI generator brands error");

        return reply.code(500).send({
          success: false,
          error: "Failed to load brands",
        });
      }
    }
  );

  // ===================================================
  // GET /api/v1/imei-generator/brands/:brandId/models
  // ===================================================

  fastify.get(
    "/imei-generator/brands/:brandId/models",
    async (request, reply) => {
      try {
        const brandId = Number(request.params.brandId);

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
          request.log.error(error, "Failed to load generator models");

          return reply.code(500).send({
            success: false,
            error: "Failed to load models",
          });
        }

        return {
          success: true,
          data: data || [],
        };
      } catch (error) {
        request.log.error(error, "IMEI generator models error");

        return reply.code(500).send({
          success: false,
          error: "Failed to load models",
        });
      }
    }
  );

  // ===================================================
  // GET /api/v1/imei-generator/phones/:phoneId
  // ===================================================

  fastify.get(
    "/imei-generator/phones/:phoneId",
    async (request, reply) => {
      try {
        const phoneId = Number(request.params.phoneId);

        if (!Number.isInteger(phoneId)) {
          return reply.code(400).send({
            success: false,
            error: "Invalid phone ID",
          });
        }

        // -----------------------------------------------
        // Load phone
        // -----------------------------------------------

        const {
          data: phone,
          error: phoneError,
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
          .eq("phone_id", phoneId)
          .single();

        if (phoneError || !phone) {
          return reply.code(404).send({
            success: false,
            error: "Phone not found",
          });
        }

        // -----------------------------------------------
        // Load REAL TAC from tac_allocations
        // -----------------------------------------------

        let tac = null;

        try {
          tac = await getTacForPhone(phoneId);
        } catch (error) {
          request.log.error(
            error,
            `Failed to load TAC for phone ${phoneId}`
          );

          return reply.code(500).send({
            success: false,
            error: "Failed to load TAC information",
          });
        }

        return {
          success: true,
          data: {
            phone_id: phone.phone_id,
            model_name: phone.model_name,
            slug: phone.slug,
            brand: phone.brands,
            tac,
            can_generate: Boolean(tac),
          },
        };
      } catch (error) {
        request.log.error(error, "IMEI generator phone lookup error");

        return reply.code(500).send({
          success: false,
          error: "Failed to load device",
        });
      }
    }
  );

  // ===================================================
  // POST /api/v1/imei-generator/generate
  // ===================================================

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

        // -----------------------------------------------
        // Validate phone ID
        // -----------------------------------------------

        if (!Number.isInteger(phoneId)) {
          return reply.code(400).send({
            success: false,
            error: "phone_id is required",
          });
        }

        // -----------------------------------------------
        // Load phone
        // -----------------------------------------------

        const {
          data: phone,
          error: phoneError,
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
          .eq("phone_id", phoneId)
          .single();

        if (phoneError || !phone) {
          return reply.code(404).send({
            success: false,
            error: "Phone not found",
          });
        }

        // -----------------------------------------------
        // Get REAL TAC
        // -----------------------------------------------

        const tac = await getTacForPhone(phoneId);

        // -----------------------------------------------
        // No TAC = cannot generate a device-specific IMEI
        //
        // IMPORTANT:
        // We intentionally do NOT generate a fake/test TAC.
        // -----------------------------------------------

        if (!tac) {
          return reply.code(404).send({
            success: false,
            error:
              "IMEI generation is not available for this model because no TAC is mapped to it.",
          });
        }

        // -----------------------------------------------
        // Generate unique IMEIs
        // -----------------------------------------------

        const imeis = new Set();

        while (imeis.size < requestedCount) {
          imeis.add(generateImeiFromTac(tac));
        }

        return {
          success: true,
          data: {
            phone_id: phone.phone_id,
            brand: phone.brands?.name || null,
            model_name: phone.model_name,
            tac,
            count: imeis.size,
            imeis: Array.from(imeis),
          },
        };
      } catch (error) {
        request.log.error(error, "IMEI GENERATOR ERROR");

        return reply.code(500).send({
          success: false,
          error:
            error.message || "Failed to generate IMEIs",
        });
      }
    }
  );
}

module.exports = imeiGeneratorRoutes;