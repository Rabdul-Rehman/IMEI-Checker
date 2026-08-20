const crypto = require("crypto");
const { supabase } = require("../lib/supabase");
const { getOrCreateLocalTac } = require("../lib/localDeviceTacRegistry");

// =====================================================
// TEXT HELPERS
// =====================================================

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function similarity(a, b) {
    a = normalize(a);
    b = normalize(b);

    if (!a || !b) {
        return 0;
    }

    if (a === b) {
        return 1;
    }

    if (a.includes(b) || b.includes(a)) {
        return 0.92;
    }

    const aTokens = new Set(a.split(" "));
    const bTokens = new Set(b.split(" "));

    const common = [...aTokens].filter(
        (token) => bTokens.has(token)
    ).length;

    return common / Math.max(
        aTokens.size,
        bTokens.size
    );
}

function cleanTac(value) {
    const tac = String(value || "")
        .replace(/\D/g, "");

    if (tac.length !== 8) {
        return null;
    }

    return tac;
}

// =====================================================
// IMEI LUHN CHECK DIGIT
// =====================================================

function calculateLuhnCheckDigit(number14) {
    let sum = 0;

    for (let i = 0; i < 14; i++) {
        let digit = Number(number14[i]);

        if (i % 2 === 1) {
            digit *= 2;

            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
    }

    return String(
        (10 - (sum % 10)) % 10
    );
}

// =====================================================
// GENERATE ONE IMEI
// =====================================================

function generateImeiFromTac(tac) {
    const clean = cleanTac(tac);

    if (!clean) {
        throw new Error("Invalid TAC");
    }

    const serialNumber = crypto
        .randomInt(0, 1000000)
        .toString()
        .padStart(6, "0");

    const first14 =
        `${clean}${serialNumber}`;

    const checkDigit =
        calculateLuhnCheckDigit(first14);

    return `${first14}${checkDigit}`;
}

// =====================================================
// EXACT TAC FROM tac_allocations
// =====================================================

async function getTacFromTacAllocations(phoneId) {
    const {
        data,
        error,
    } = await supabase
        .from("tac_allocations")
        .select(`
            tac_id,
            tac,
            phone_id,
            match_status,
            match_confidence
        `)
        .eq(
            "phone_id",
            phoneId
        )
        .not(
            "tac",
            "is",
            null
        )
        .order(
            "match_confidence",
            {
                ascending: false,
                nullsFirst: false,
            }
        )
        .limit(100);

    if (error) {
        throw error;
    }

    const preferred = [];
    const fallback = [];

    for (const row of data || []) {
        const tac = cleanTac(row.tac);

        if (!tac) {
            continue;
        }

        const status =
            String(
                row.match_status || ""
            ).toLowerCase();

        if (
            status === "auto_matched" ||
            status === "manual_matched"
        ) {
            preferred.push(tac);
        } else {
            fallback.push(tac);
        }
    }

    return (
        preferred[0] ||
        fallback[0] ||
        null
    );
}

// =====================================================
// EXACT TAC FROM v_tac_lookup
// =====================================================

// =====================================================
// EXACT TAC FROM LEGACY imei_lookups
// =====================================================

async function getTacFromLegacyLookups(phoneId) {
    const {
        data,
        error,
    } = await supabase
        .from("imei_lookups")
        .select("tac")
        .eq(
            "phone_id",
            phoneId
        )
        .not(
            "tac",
            "is",
            null
        )
        .limit(100);

    if (error) {
        /*
         * This table is legacy support.
         * If the table/query is unavailable, do not
         * break the entire generator.
         */
        return null;
    }

    for (const row of data || []) {
        const tac = cleanTac(row.tac);

        if (tac) {
            return tac;
        }
    }

    return null;
}

// =====================================================
// GET TAC FOR PHONE
//
// Priority:
// 1. Exact real TAC mapping for this phone_id.
// 2. Legacy exact TAC mapping for this phone_id.
// 3. Persistent local TAC for devices without an exact
//    real TAC mapping.
//
// IMPORTANT:
// We never borrow a TAC from another phone based on
// brand/model similarity.
// =====================================================
async function getTacForPhone(phoneId, phone) {

    // -------------------------------------------------
    // 1. EXACT tac_allocations.phone_id mapping
    // -------------------------------------------------

    const {
        data: directRows,
        error: directError,
    } = await supabase
        .from("tac_allocations")
        .select(`
            tac_id,
            tac,
            phone_id,
            match_status,
            match_confidence
        `)
        .eq("phone_id", phoneId)
        .not("tac", "is", null)
        .order("match_confidence", {
            ascending: false,
            nullsFirst: false,
        })
        .limit(100);

    if (directError) {
        throw directError;
    }

    const exactCandidates =
        (directRows || [])
            .map((row) => ({
                row,
                tac: cleanTac(row.tac),
            }))
            .filter((item) => item.tac);

    if (exactCandidates.length > 0) {
        const preferred = exactCandidates.find((item) =>
            [
                "auto_matched",
                "manual_matched",
            ].includes(
                String(item.row.match_status || "").toLowerCase()
            )
        );

        return {
            tac: preferred?.tac || exactCandidates[0].tac,
            local: false,
        };
    }

    // -------------------------------------------------
    // 2. LEGACY exact phone_id mapping
    // -------------------------------------------------

    try {
        const {
            data: legacyRows,
            error: legacyError,
        } = await supabase
            .from("imei_lookups")
            .select("tac")
            .eq("phone_id", phoneId)
            .not("tac", "is", null)
            .limit(100);

        if (!legacyError) {
            for (const row of legacyRows || []) {
                const tac = cleanTac(row.tac);

                if (tac) {
                    return {
                        tac,
                        local: false,
                    };
                }
            }
        }
    } catch {
        // Legacy lookup is optional.
    }

    // -------------------------------------------------
    // 3. LOCAL TAC FOR THIS EXACT PHONE
    // -------------------------------------------------

    const localEntry =
        await getOrCreateLocalTac({
            phoneId,
            brandName: phone?.brands?.name || null,
            modelName: phone?.model_name || null,
            modelNumber:
                phone?.specs_json?.General?.model_number ||
                phone?.specs_json?.general?.model_number ||
                null,
            isTacTaken: async (candidate) => {
                const {
                    data,
                    error,
                } = await supabase
                    .from("tac_allocations")
                    .select("tac_id")
                    .eq("tac", candidate)
                    .limit(1);

                return Boolean(
                    !error &&
                    data?.length
                );
            },
        });

    return {
        tac: localEntry.tac,
        local: true,
    };
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

            try {

                const {
                    data,
                    error,
                } = await supabase
                    .from("brands")
                    .select(`
                        brand_id,
                        name
                    `)
                    .order("name");

                if (error) {

                    request.log.error(
                        error,
                        "Failed to load IMEI generator brands"
                    );

                    return reply.code(500).send({
                        success: false,
                        error:
                            error.message ||
                            "Failed to load brands",
                    });
                }

                return {
                    success: true,
                    data: data || [],
                };

            } catch (error) {

                request.log.error(
                    error,
                    "IMEI generator brands error"
                );

                return reply.code(500).send({
                    success: false,
                    error:
                        error.message ||
                        "Failed to load brands",
                });
            }
        }
    );

    // =================================================
    // GET /api/v1/imei-generator/brands/:brandId/models
    // =================================================

    fastify.get(
        "/imei-generator/brands/:brandId/models",
        async (request, reply) => {

            try {

                const brandId =
                    Number(
                        request.params.brandId
                    );

                if (
                    !Number.isInteger(
                        brandId
                    )
                ) {

                    return reply.code(400).send({
                        success: false,
                        error:
                            "Invalid brand ID",
                    });
                }

                const {
                    data,
                    error,
                } = await supabase
                    .from("phones")
                    .select(`
                        phone_id,
                        model_name,
                        slug,
                        brand_id
                    `)
                    .eq(
                        "brand_id",
                        brandId
                    )
                    .order(
                        "model_name"
                    );

                if (error) {

                    request.log.error(
                        error,
                        "Failed to load generator models"
                    );

                    return reply.code(500).send({
                        success: false,
                        error:
                            "Failed to load models",
                    });
                }

                return {
                    success: true,
                    data: data || [],
                };

            } catch (error) {

                request.log.error(
                    error,
                    "IMEI generator models error"
                );

                return reply.code(500).send({
                    success: false,
                    error:
                        "Failed to load models",
                });
            }
        }
    );

    // =================================================
    // GET /api/v1/imei-generator/phones/:phoneId
    // =================================================

    fastify.get(
        "/imei-generator/phones/:phoneId",
        async (request, reply) => {

            try {

                const phoneId =
                    Number(
                        request.params.phoneId
                    );

                if (
                    !Number.isInteger(
                        phoneId
                    )
                ) {

                    return reply.code(400).send({
                        success: false,
                        error:
                            "Invalid phone ID",
                    });
                }

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
                    .eq(
                        "phone_id",
                        phoneId
                    )
                    .single();

                if (
                    phoneError ||
                    !phone
                ) {

                    return reply.code(404).send({
                        success: false,
                        error:
                            "Phone not found",
                    });
                }

                const tacResult =
                    await getTacForPhone(
                        phoneId,
                        phone
                    );

                return {
                    success: true,
                    data: {
                        phone_id:
                            phone.phone_id,

                        model_name:
                            phone.model_name,

                        slug:
                            phone.slug,

                        brand:
                            phone.brands,

                        tac: tacResult.tac,

                        local_tac:
                            tacResult.local,

                        can_generate:
                            Boolean(tacResult.tac),
                    },
                };

            } catch (error) {

                request.log.error(
                    error,
                    "IMEI generator phone lookup error"
                );

                return reply.code(500).send({
                    success: false,
                    error:
                        error.message ||
                        "Failed to load device",
                });
            }
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

                const phoneId =
                    Number(phone_id);

                const requestedCount =
                    Math.min(
                        Math.max(
                            Number(count) || 1,
                            1
                        ),
                        10
                    );

                if (
                    !Number.isInteger(
                        phoneId
                    )
                ) {

                    return reply.code(400).send({
                        success: false,
                        error:
                            "phone_id is required",
                    });
                }

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
                    .eq(
                        "phone_id",
                        phoneId
                    )
                    .single();

                if (
                    phoneError ||
                    !phone
                ) {

                    return reply.code(404).send({
                        success: false,
                        error:
                            "Phone not found",
                    });
                }

                const tacResult =
                    await getTacForPhone(
                        phoneId,
                        phone
                    );

                if (!tacResult.tac) {

                    return reply.code(404).send({
                        success: false,
                        error:
                            "IMEI generation is not available for this model because no suitable TAC was found in the database.",
                    });
                }

                const imeis =
                    new Set();

                while (
                    imeis.size <
                    requestedCount
                ) {

                    imeis.add(
                        generateImeiFromTac(
                            tacResult.tac
                        )
                    );
                }

                return {
                    success: true,

                    data: {
                        phone_id:
                            phone.phone_id,

                        brand:
                            phone.brands?.name ||
                            null,

                        model_name:
                            phone.model_name,

                        tac: tacResult.tac,

                        local_tac:
                            tacResult.local,

                        count:
                            imeis.size,

                        imeis:
                            Array.from(
                                imeis
                            ),
                    },
                };

            } catch (error) {

                request.log.error(
                    error,
                    "IMEI GENERATOR ERROR"
                );

                return reply.code(500).send({
                    success: false,
                    error:
                        error.message ||
                        "Failed to generate IMEIs",
                });
            }
        }
    );
}

module.exports =
    imeiGeneratorRoutes;