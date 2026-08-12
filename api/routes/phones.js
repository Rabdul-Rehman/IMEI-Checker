const { supabase } = require("../lib/supabase");

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

    return common / Math.max(aTokens.size, bTokens.size);
}

function brandSimilarity(a, b) {
    a = normalize(a);
    b = normalize(b);

    if (!a || !b) return 0;

    if (a === b) return 1;

    // Common brand variations
    const aliases = {
        samsung: ["samsung"],
        oppo: ["oppo", "apopo", "apoo"],
        xiaomi: ["xiaomi", "mi"],
        redmi: ["redmi", "xiaomi"],
        oneplus: ["oneplus", "one plus"],
        vivo: ["vivo"],
        iqoo: ["iqoo", "i qoo"],
        realme: ["realme", "real me"],
        tecno: ["tecno"],
        infinix: ["infinix"],
        itel: ["itel"],
        huawei: ["huawei"],
        honor: ["honor"],
        nokia: ["nokia"],
        lg: ["lg"],
        alcatel: ["alcatel"],
        tcl: ["tcl"],
        motorola: ["motorola", "moto"],
        google: ["google"],
        apple: ["apple", "iphone"],
    };

    for (const values of Object.values(aliases)) {
        const aMatch = values.some(v => normalize(v) === a);
        const bMatch = values.some(v => normalize(v) === b);

        if (aMatch && bMatch) {
            return 1;
        }
    }

    return similarity(a, b);
}

function modelScore(phone, tacData) {
    const reportedModel = normalize(
        tacData.reported_model_name
    );

    const reportedNumber = normalize(
        tacData.reported_model_number
    );

    const phoneModel = normalize(
        phone.model_name
    );

    if (!phoneModel) {
        return 0;
    }

    const modelNameScore = similarity(
        phoneModel,
        reportedModel
    );

    const modelNumberScore = similarity(
        phoneModel,
        reportedNumber
    );

    return Math.max(
        modelNameScore,
        modelNumberScore
    );
}

async function resolveImei(cleanImei, request) {

    const tac = cleanImei.substring(0, 8);

    /*
     * -----------------------------------------------------
     * STEP 1
     * Find TAC information.
     *
     * We intentionally do NOT use maybeSingle() here because
     * the underlying TAC data can contain multiple records.
     * -----------------------------------------------------
     */

    const {
        data: tacRows,
        error: tacError,
    } = await supabase
        .from("v_tac_lookup")
        .select("*")
        .eq("tac", tac)
        .order("match_confidence", {
            ascending: false,
            nullsFirst: false,
        })
        .limit(20);

    if (tacError) {
        request.log.error(
            tacError,
            "TAC lookup failed"
        );

        throw tacError;
    }

    if (!tacRows || tacRows.length === 0) {
        return null;
    }

    /*
     * -----------------------------------------------------
     * STEP 2
     * Prefer an already matched TAC.
     * -----------------------------------------------------
     */

    const alreadyMatched = tacRows.find(row =>
        row.phone_id &&
        [
            "auto_matched",
            "manual_matched",
            "code_matched",
        ].includes(row.match_status)
    );

    if (alreadyMatched) {
        return {
            ...alreadyMatched,
            imei: cleanImei,
            tac,
        };
    }

    /*
     * -----------------------------------------------------
     * STEP 3
     * Pick the best TAC record containing actual
     * reported device information.
     * -----------------------------------------------------
     */

    const tacData =
        tacRows.find(row =>
            row.reported_brand ||
            row.reported_model_name ||
            row.reported_model_number
        ) || tacRows[0];

    const reportedBrand = normalize(
        tacData.reported_brand
    );

    const reportedModel = normalize(
        tacData.reported_model_name
    );

    const reportedNumber = normalize(
        tacData.reported_model_number
    );

    /*
     * If absolutely no device information exists,
     * return the TAC information without inventing
     * a phone match.
     */

    if (
        !reportedBrand &&
        !reportedModel &&
        !reportedNumber
    ) {
        return {
            ...tacData,
            imei: cleanImei,
            tac,
        };
    }

    /*
     * -----------------------------------------------------
     * STEP 4
     * Load phones + brands.
     *
     * This does NOT modify the database.
     * -----------------------------------------------------
     */

    const {
        data: phones,
        error: phonesError,
    } = await supabase
        .from("phones")
        .select(`
            phone_id,
            model_name,
            slug,
            specs_json,
            images,
            brand_id,
            brands (
                brand_id,
                name
            )
        `);

    if (phonesError) {
        request.log.error(
            phonesError,
            "Phone matching failed"
        );

        throw phonesError;
    }

    /*
     * -----------------------------------------------------
     * STEP 5
     * Score every phone.
     * -----------------------------------------------------
     */

    let best = null;

    for (const phone of phones || []) {

        const phoneBrand = normalize(
            phone.brands?.name
        );

        const brandScore = brandSimilarity(
            phoneBrand,
            reportedBrand
        );

        const modelSimilarity = modelScore(
            phone,
            tacData
        );

        /*
         * Brand is important.
         * Model is even more important.
         */

        let score =
            (modelSimilarity * 0.75) +
            (brandScore * 0.25);

        /*
         * If the reported brand is known and does not
         * match the phone brand, strongly penalize it.
         */

        if (
            reportedBrand &&
            brandScore < 0.5
        ) {
            score *= 0.25;
        }

        if (
            !best ||
            score > best.score
        ) {
            best = {
                phone,
                score,
                brandScore,
                modelSimilarity,
            };
        }
    }

    /*
     * -----------------------------------------------------
     * STEP 6
     * Do not make weak guesses.
     * -----------------------------------------------------
     */

    if (
        !best ||
        best.score < 0.55 ||
        best.modelSimilarity < 0.55
    ) {
        return {
            ...tacData,
            phone_id: null,
            imei: cleanImei,
            tac,
            match_status: "ambiguous",
            match_confidence: Number(
                (best?.score || 0).toFixed(3)
            ),
        };
    }

    /*
     * -----------------------------------------------------
     * STEP 7
     * Return the resolved phone.
     *
     * IMPORTANT:
     * This only changes the API response.
     * It does NOT update the database.
     * -----------------------------------------------------
     */

    return {
        ...tacData,

        phone_id: best.phone.phone_id,
        model_name: best.phone.model_name,
        slug: best.phone.slug,
        specs_json: best.phone.specs_json,
        images: best.phone.images,
        brand_id: best.phone.brand_id,
        brand_name:
            best.phone.brands?.name ||
            tacData.reported_brand,

        match_status: "code_matched",

        match_confidence: Number(
            best.score.toFixed(3)
        ),

        imei: cleanImei,
        tac,
    };
}

async function phoneRoutes(fastify) {

    // =====================================================
    // GET /api/v1/phones
    // =====================================================

    fastify.get("/phones", async (request, reply) => {

      try {

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
                { count: "exact" }
            );

        if (search) {
            query = query.ilike(
                "model_name",
                `%${search}%`
            );
        }

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

      } catch (error) {

        request.log.error(
            error,
            "Phones list error"
        );

        return reply.code(500).send({
            success: false,
            error: "Failed to load phones",
        });
      }
    });


    // =====================================================
    // GET /api/v1/phones/:slug
    // =====================================================

    fastify.get("/phones/:slug", async (request, reply) => {

      try {

        const { slug } = request.params;

        const {
            data,
            error,
        } = await supabase
            .from("phones")
            .select(`
                phone_id,
                model_name,
                slug,
                specs_json,
                brand_id,
                brands (
                    brand_id,
                    name
                )
            `)
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

      } catch (error) {

        request.log.error(
            error,
            "Phone lookup error"
        );

        return reply.code(500).send({
            success: false,
            error: "Failed to load phone",
        });
      }
    });


    // =====================================================
    // GET /api/v1/phones/:slug/specs
    // =====================================================

    fastify.get(
        "/phones/:slug/specs",
        async (request, reply) => {

          try {

            const { slug } = request.params;

            const {
                data,
                error,
            } = await supabase
                .from("phones")
                .select(`
                    phone_id,
                    model_name,
                    slug,
                    specs_json,
                    brands (
                        brand_id,
                        name
                    )
                `)
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

          } catch (error) {

            request.log.error(
                error,
                "Phone specs lookup error"
            );

            return reply.code(500).send({
                success: false,
                error: "Failed to load phone specs",
            });
          }
        }
    );


    // =====================================================
    // PUBLIC IMEI LOOKUP
    //
    // GET /api/v1/public/imei/:imei
    // =====================================================

    fastify.get(
        "/public/imei/:imei",
        async (request, reply) => {

            const { imei } = request.params;

            if (!imei) {
                return reply.code(400).send({
                    success: false,
                    error: "IMEI is required",
                });
            }

            const cleanImei = String(imei)
                .replace(/\D/g, "");

            if (cleanImei.length !== 15) {
                return reply.code(400).send({
                    success: false,
                    error:
                        "Invalid IMEI. IMEI must contain exactly 15 digits.",
                });
            }

            try {

                const data = await resolveImei(
                    cleanImei,
                    request
                );

                if (!data) {
                    return reply.code(404).send({
                        success: false,
                        error: "Device not found",
                    });
                }

                return {
                    success: true,
                    data,
                };

            } catch (error) {

                request.log.error(
                    error,
                    "Public IMEI lookup failed"
                );

                return reply.code(500).send({
                    success: false,
                    error: "IMEI lookup failed",
                });
            }
        }
    );


    // =====================================================
    // ORIGINAL IMEI LOOKUP
    //
    // GET /api/v1/phones/imei/:imei
    // =====================================================

    fastify.get(
        "/phones/imei/:imei",
        async (request, reply) => {

            const { imei } = request.params;

            if (!imei || imei.length < 8) {
                return reply.code(400).send({
                    success: false,
                    error: "Invalid IMEI",
                });
            }

            const cleanImei = String(imei)
                .replace(/\D/g, "");

            if (cleanImei.length !== 15) {
                return reply.code(400).send({
                    success: false,
                    error: "Invalid IMEI",
                });
            }

            try {

                const data = await resolveImei(
                    cleanImei,
                    request
                );

                if (!data) {
                    return reply.code(404).send({
                        success: false,
                        error: "Device not found",
                    });
                }

                return {
                    success: true,
                    data,
                };

            } catch (error) {

                request.log.error(
                    error,
                    "IMEI lookup failed"
                );

                return reply.code(500).send({
                    success: false,
                    error: "IMEI lookup failed",
                });
            }
        }
    );
}

module.exports = phoneRoutes;