const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const REGISTRY_PATH =
    process.env.LOCAL_DEVICE_TAC_FILE ||
    path.resolve(
        __dirname,
        "../data/local-device-tacs.json"
    );

const LOCAL_TAC_PREFIX = "99";

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function ensureRegistryDirectory() {
    fs.mkdirSync(
        path.dirname(REGISTRY_PATH),
        { recursive: true }
    );
}

function readRegistry() {
    ensureRegistryDirectory();

    try {
        if (!fs.existsSync(REGISTRY_PATH)) {
            fs.writeFileSync(
                REGISTRY_PATH,
                "{}",
                "utf8"
            );
            return {};
        }

        const raw = fs.readFileSync(
            REGISTRY_PATH,
            "utf8"
        ).trim();

        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);

        return parsed && typeof parsed === "object"
            ? parsed
            : {};
    } catch {
        return {};
    }
}

function writeRegistry(registry) {
    ensureRegistryDirectory();

    const tempPath = `${REGISTRY_PATH}.tmp`;

    fs.writeFileSync(
        tempPath,
        JSON.stringify(registry, null, 2),
        "utf8"
    );

    fs.renameSync(
        tempPath,
        REGISTRY_PATH
    );
}

function isValidLocalTac(value) {
    return /^99\d{6}$/.test(
        String(value || "")
    );
}

function hashToSixDigits(value) {
    const digest = crypto
        .createHash("sha256")
        .update(String(value))
        .digest("hex");

    const number =
        parseInt(
            digest.slice(0, 8),
            16
        ) % 1000000;

    return String(number).padStart(6, "0");
}

function getExistingByPhoneId(phoneId) {
    const registry = readRegistry();
    return registry[String(phoneId)] || null;
}

function getByTac(tac) {
    const registry = readRegistry();
    const cleanTac = String(tac || "");

    for (const entry of Object.values(registry)) {
        if (
            entry &&
            String(entry.tac) === cleanTac
        ) {
            return entry;
        }
    }

    return null;
}

async function getOrCreateLocalTac({
    phoneId,
    brandName,
    modelName,
    modelNumber,
    isTacTaken,
}) {
    const key = String(phoneId);
    const registry = readRegistry();
    const existing = registry[key];

    if (
        existing &&
        isValidLocalTac(existing.tac)
    ) {
        return existing;
    }

    const seed = [
        key,
        normalize(brandName),
        normalize(modelName),
        normalize(modelNumber),
    ].join("|");

    let localTac = null;

    // Deterministic candidate first.
    for (let attempt = 0; attempt < 100; attempt++) {
        const suffix =
            attempt === 0
                ? hashToSixDigits(seed)
                : hashToSixDigits(
                    `${seed}|${attempt}`
                );

        const candidate =
            `${LOCAL_TAC_PREFIX}${suffix}`;

        const localOwner = getByTac(candidate);

        if (
            localOwner &&
            String(localOwner.phoneId) !== key
        ) {
            continue;
        }

        let taken = false;

        if (typeof isTacTaken === "function") {
            taken = await isTacTaken(candidate);
        }

        if (taken) {
            continue;
        }

        localTac = candidate;
        break;
    }

    if (!localTac) {
        throw new Error(
            "Unable to allocate a unique local TAC"
        );
    }

    const entry = {
        phoneId: Number(phoneId),
        tac: localTac,
        brandName: brandName || null,
        modelName: modelName || null,
        modelNumber: modelNumber || null,
        local: true,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    registry[key] = entry;
    writeRegistry(registry);

    return entry;
}

module.exports = {
    getExistingByPhoneId,
    getByTac,
    getOrCreateLocalTac,
    REGISTRY_PATH,
};