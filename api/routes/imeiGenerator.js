const crypto = require("crypto");
const { supabase } = require("../lib/supabase");

// =====================================================
// HELPERS
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

    if (!a || !b) return 0;

    if (a === b) return 1;

    if (a.includes(b) || b.includes(a)) {
        return 0.92;
    }

    const aTokens = new Set(a.split(" "));
    const bTokens = new Set(b.split(" "));

    const common = [...aTokens].filter(
        token => bTokens.has(token)
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

        // Double every second digit from the left
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
// GENERATE ONE IMEI FROM A REAL TAC
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

    const first14 = `${clean}${serialNumber}`;

    const checkDigit =
        calculateLuhnCheckDigit(first14);

    return `${first14}${checkDigit}`;
}

// =====================================================
// FIND TAC FOR PHONE
//
// Priority:
// 1. Exact phone_id mapping
// 2. Exact brand + strong model match
// 3. Exact brand + model number match
// 4. v_tac_lookup fallback
//
// IMPORTANT:
// No fake/test/hardcoded TAC is generated.
// Database remains read-only.
// =====================================================

async function getTacForPhone(phoneId, phone) {

    // -------------------------------------------------
    // 1. EXACT phone_id MATCH
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
            brand_id,
            reported_brand,
            reported_model_name,
            reported_model_number,
            match_status,
            match_confidence
        `)
        .eq("phone_id", phoneId)
        .not("tac", "is", null)
        .limit(20);

    if (directError) {
        throw directError;
    }

    const directTac =
        (directRows || [])
            .map(row => cleanTac(row.tac))
            .find(Boolean);

    if (directTac) {
        return directTac;
    }

    // -------------------------------------------------
    // Prepare selected phone information
    // -------------------------------------------------

    const selectedBrand =
        normalize(phone?.brands?.name);

    const selectedModel =
        normalize(phone?.model_name);

    if (!selectedModel) {
        return null;
    }

    // -------------------------------------------------
    // 2. FIND TACs BY BRAND
    //
    // This catches TAC records where phone_id is NULL
    // but the original imported device information exists.
    // -------------------------------------------------

    let candidateRows = [];

    if (selectedBrand) {

        const {
            data: brandRows,
            error: brandError,
        } = await supabase
            .from("tac_allocations")
            .select(`
                tac_id,
                tac,
                phone_id,
                brand_id,
                reported_brand,
                reported_model_name,
                reported_model_number,
                match_status,
                match_confidence
            `)
            .ilike(
                "reported_brand",
                selectedBrand
            )
            .not("tac", "is", null)
            .limit(5000);

        if (brandError) {
            throw brandError;
        }

        candidateRows = brandRows || [];
    }

    // -------------------------------------------------
    // 3. SCORE MODEL MATCHES
    // -------------------------------------------------

    let best = null;

    for (const row of candidateRows) {

        const tac = cleanTac(row.tac);

        if (!tac) {
            continue;
        }

        const reportedBrand =
            normalize(row.reported_brand);

        const reportedModel =
            normalize(row.reported_model_name);

        const reportedNumber =
            normalize(row.reported_model_number);

        // Brand must match when we have brand data
        if (
            selectedBrand &&
            reportedBrand &&
            reportedBrand !== selectedBrand
        ) {
            continue;
        }

        const modelScore =
            similarity(
                selectedModel,
                reportedModel
            );

        const modelNumberScore =
            similarity(
                selectedModel,
                reportedNumber
            );

        const score = Math.max(
            modelScore,
            modelNumberScore
        );

        if (!best || score > best.score) {
            best = {
                tac,
                score,
                row,
            };
        }
    }

    // -------------------------------------------------
    // Require a strong model match.
    //
    // This prevents a TAC belonging to a completely
    // different phone from being used.
    // -------------------------------------------------

    if (
        best &&
        best.score >= 0.80
    ) {
        return best.tac;
    }

    // -------------------------------------------------
    // 4. FALLBACK: v_tac_lookup
    //
    // Some TAC information may already be exposed
    // through the lookup view.
    // -------------------------------------------------

    const {
        data: lookupRows,
        error: lookupError,
    } = await supabase
        .from("v_tac_lookup")
        .select(`
            tac,
            phone_id,
            reported_brand,
            reported_model_name,
            reported_model_number
        `)
        .not("tac", "is", null)
        .limit(5000);

    if (lookupError) {
        throw lookupError;
    }

    let bestLookup = null;

    for (const row of lookupRows || []) {

        const tac = cleanTac(row.tac);

        if (!tac) {
            continue;
        }

        // Exact phone mapping wins immediately
        if (
            row.phone_id &&
            Number(row.phone_id) === Number(phoneId)
        ) {
            return tac;
        }

        const reportedBrand =
            normalize(row.reported_brand);

        const reportedModel =
            normalize(row.reported_model_name);

        const reportedNumber =
            normalize(row.reported_model_number);

        if (
            selectedBrand &&
            reportedBrand &&
            reportedBrand !== selectedBrand
        ) {
            continue;
        }

        const modelScore =
            similarity(
                selectedModel,
                reportedModel
            );

        const modelNumberScore =
            similarity(
                selectedModel,
                reportedNumber
            );

        const score = Math.max(
            modelScore,
            modelNumberScore
        );

        if (
            !bestLookup ||
            score > bestLookup.score
        ) {
            bestLookup = {
                tac,
                score,
            };
        }
    }

    if (
        bestLookup &&
        bestLookup.score >= 0.80
    ) {
        return bestLookup.tac;
    }

    return null;
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
                        error: "Failed to load brands",
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
                    error: "Failed to load brands",
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
                    Number(request.params.brandId);

                if (!Number.isInteger(brandId)) {

                    return reply.code(400).send({
                        success: false,
                        error: "Invalid brand ID",
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
                    .order("model_name");

                if (error) {

                    request.log.error(
                        error,
                        "Failed to load generator models"
                    );

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

                request.log.error(
                    error,
                    "IMEI generator models error"
                );

                return reply.code(500).send({
                    success: false,
                    error: "Failed to load models",
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
                    Number(request.params.phoneId);

                if (!Number.isInteger(phoneId)) {

                    return reply.code(400).send({
                        success: false,
                        error: "Invalid phone ID",
                    });
                }

                // -------------------------------------
                // Load phone
                // -------------------------------------

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
                        error: "Phone not found",
                    });
                }

                // -------------------------------------
                // Find real TAC
                // -------------------------------------

                let tac = null;

                try {

                    tac = await getTacForPhone(
                        phoneId,
                        phone
                    );

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

                request.log.error(
                    error,
                    "IMEI generator phone lookup error"
                );

                return reply.code(500).send({
                    success: false,
                    error: "Failed to load device",
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

                // -------------------------------------
                // Validate phone ID
                // -------------------------------------

                if (
                    !Number.isInteger(phoneId)
                ) {

                    return reply.code(400).send({
                        success: false,
                        error: "phone_id is required",
                    });
                }

                // -------------------------------------
                // Load phone
                // -------------------------------------

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
                        error: "Phone not found",
                    });
                }

                // -------------------------------------
                // Get real TAC
                // -------------------------------------

                const tac =
                    await getTacForPhone(
                        phoneId,
                        phone
                    );

                // -------------------------------------
                // No real TAC found
                // -------------------------------------

                if (!tac) {

                    return reply.code(404).send({
                        success: false,
                        error:
                            "IMEI generation is not available for this model because no matching TAC was found in the database.",
                    });
                }

                // -------------------------------------
                // Generate unique IMEIs
                // -------------------------------------

                const imeis =
                    new Set();

                while (
                    imeis.size <
                    requestedCount
                ) {

                    imeis.add(
                        generateImeiFromTac(
                            tac
                        )
                    );
                }

                // -------------------------------------
                // Response
                // -------------------------------------

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

                        tac,

                        count:
                            imeis.size,

                        imeis:
                            Array.from(imeis),
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

module.exports = imeiGeneratorRoutes;