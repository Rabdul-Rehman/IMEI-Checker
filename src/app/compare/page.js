"use client";

import React,{ useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import DevicePhoto from "../components/DevicePhoto";
import styles from "./compare.module.css";

/* =========================================================
   HELPERS
========================================================= */

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";

    return value
      .map((item) => formatValue(item))
      .join(" • ");
  }

  // Objects
  if (typeof value === "object") {
    const entries = Object.entries(value);

    if (!entries.length) return "—";

    return (
      <div className={styles.nestedValue}>
        {entries.map(([key, val]) => (
          <div key={key} className={styles.nestedItem}>
            <span className={styles.nestedKey}>
              {formatLabel(key)}:
            </span>

            <span className={styles.nestedText}>
              {formatValue(val)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return String(value);
}


/*
  Converts database field names into readable labels.

  Examples:
  battery_capacity_mah
  ->
  Battery Capacity (mAh)

  display_size_inches
  ->
  Display Size (inches)
*/
function formatLabel(key) {
  if (!key) return "";

  const specialLabels = {
    mah: "mAh",
    mp: "MP",
    gb: "GB",
    tb: "TB",
    hz: "Hz",
    ppi: "PPI",
    hdr: "HDR",
    os: "OS",
    ip: "IP",
    cpu: "CPU",
    gpu: "GPU",
    ram: "RAM",
    rom: "ROM",
    nfc: "NFC",
    usb: "USB",
    wifi: "Wi-Fi",
    bluetooth: "Bluetooth",
    esim: "eSIM",
    soc: "SoC",
    imei: "IMEI",
  };

  return key
    .replace(/_/g, " ")
    .replace(/\b\w+/g, (word) => {
      const lower = word.toLowerCase();

      if (specialLabels[lower]) {
        return specialLabels[lower];
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    });
}


/*
  Converts the database section names into nice headings.
*/
function formatSectionName(section) {
  const names = {
    General: "General",
    "Body / Design": "Body & Design",
    Display: "Display",
    Platform: "Platform",
    Memory: "Memory",
    "Camera (Main)": "Camera — Main",
    "Camera (Front)": "Camera — Front",
    Sound: "Sound",
    "Connectivity / Communications": "Connectivity & Communications",
    Battery: "Battery",
    "Sensors & Features": "Sensors & Features",
    Miscellaneous: "Miscellaneous",
  };

  return names[section] || formatLabel(section);
}


/*
  Returns the image for a phone.
*/
function getImage(phone) {
  const curated = {
    "iphone-17-pro": "/images/devices/iphone-17-pro.png",
    "galaxy-s25-ultra": "/images/devices/galaxy-s25-ultra.png",
    "pixel-10-pro": "/images/devices/pixel-10-pro.png",
    "xiaomi-15-ultra": "/images/devices/xiaomi-15-ultra.png",
  };

  if (curated[phone?.slug]) {
    return curated[phone.slug];
  }

  const first = Array.isArray(phone?.images)
    ? phone.images[0]
    : null;

  if (!first) return null;

  if (String(first).startsWith("http")) {
    return first;
  }

  return `/phone-images/${encodeURIComponent(first)}`;
}


/*
  Normalize Supabase phone record.
*/
function normalizePhone(phone) {
  if (!phone) return null;

  return {
    ...phone,

    brand:
      phone.brands?.name ||
      phone.brand ||
      "Unknown",

    specs:
      phone.specs_json &&
      typeof phone.specs_json === "object"
        ? phone.specs_json
        : {},
  };
}


/* =========================================================
   SEARCH
========================================================= */

function PhoneSearch({ label, value, onChange, onSelect }) {
  const [query, setQuery] = useState(value?.model_name || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(value?.model_name || "");
  }, [value]);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed || value?.model_name === query) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        /*
         * STEP 1
         * Search phone models directly.
         */
        const { data: modelPhones, error: modelError } = await supabase
          .from("phones")
          .select(`
            phone_id,
            model_name,
            slug,
            specs_json,
            images,
            brand_id
          `)
          .ilike("model_name", `%${trimmed}%`)
          .order("model_name")
          .limit(20);

        if (modelError) {
          console.error("Model search error:", modelError);
          throw modelError;
        }

        /*
         * STEP 2
         * Search brands separately.
         *
         * This avoids relying on Supabase/PostgREST
         * nested relationship filtering.
         */
        const { data: matchingBrands, error: brandError } = await supabase
          .from("brands")
          .select(`
            brand_id,
            name
          `)
          .ilike("name", `%${trimmed}%`)
          .limit(20);

        if (brandError) {
          console.error("Brand search error:", brandError);
          throw brandError;
        }

        /*
         * Get phones belonging to matching brands.
         */
        let brandPhones = [];

        if (matchingBrands && matchingBrands.length > 0) {
          const brandIds = matchingBrands.map(
            (brand) => brand.brand_id
          );

          const { data, error } = await supabase
            .from("phones")
            .select(`
              phone_id,
              model_name,
              slug,
              specs_json,
              images,
              brand_id
            `)
            .in("brand_id", brandIds)
            .order("model_name")
            .limit(30);

          if (error) {
            console.error("Brand phones search error:", error);
            throw error;
          }

          brandPhones = data || [];
        }

        /*
         * Combine model matches + brand matches.
         */
        const combined = [
          ...(modelPhones || []),
          ...brandPhones,
        ];

        /*
         * Remove duplicates.
         */
        const uniquePhones = Array.from(
          new Map(
            combined.map((phone) => [
              phone.phone_id,
              phone,
            ])
          ).values()
        );

        /*
         * Limit results.
         */
        const limitedPhones = uniquePhones.slice(0, 15);

        /*
         * STEP 3
         * Fetch brand names for the final phones.
         */
        const brandIds = [
          ...new Set(
            limitedPhones
              .map((phone) => phone.brand_id)
              .filter(Boolean)
          ),
        ];

        let brandsMap = {};

        if (brandIds.length > 0) {
          const { data: brands, error: brandsError } =
            await supabase
              .from("brands")
              .select(`
                brand_id,
                name
              `)
              .in("brand_id", brandIds);

          if (brandsError) {
            console.error(
              "Final brands lookup error:",
              brandsError
            );
            throw brandsError;
          }

          brandsMap = Object.fromEntries(
            (brands || []).map((brand) => [
              brand.brand_id,
              brand.name,
            ])
          );
        }

        /*
         * Normalize phones.
         */
        const normalizedResults = limitedPhones.map(
          (phone) => ({
            ...phone,
            brand:
              brandsMap[phone.brand_id] ||
              "Unknown",
            specs: phone.specs_json || {},
          })
        );

        setResults(normalizedResults);
      } catch (error) {
        console.error(
          "Phone search failed:",
          error?.message || error
        );

        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, value]);

  return (
    <div className={styles.searchBox}>
      <label>{label}</label>

      <div className={styles.searchInputWrap}>
        <input
          value={query}
          onChange={(e) => {
            const newValue = e.target.value;

            setQuery(newValue);
            onChange(null);
          }}
          placeholder="Search for a phone..."
          aria-label={label}
        />

        <i className="fas fa-magnifying-glass" />
      </div>

      {query.trim() &&
        value?.model_name !== query && (
          <div className={styles.searchResults}>

            {loading && (
              <div className={styles.searchState}>
                Searching...
              </div>
            )}

            {!loading &&
              results.length === 0 && (
                <div className={styles.searchState}>
                  No phones found
                </div>
              )}

            {!loading &&
              results.map((phone) => (
                <button
                  key={phone.phone_id}
                  type="button"
                  onClick={() => {
                    onSelect(phone);
                    setQuery(phone.model_name);
                    setResults([]);
                  }}
                >
                  <span>
                    {phone.brand}
                  </span>

                  <strong>
                    {phone.model_name}
                  </strong>
                </button>
              ))}
          </div>
        )}
    </div>
  );
}

/* =========================================================
   PHONE CARD
========================================================= */

function PhoneCard({ phone }) {
  if (!phone) {
    return (
      <div className={styles.phoneCard}>
        <div className={styles.emptyPhoneCard}>
          <i className="fas fa-mobile-screen" />

          <h2>Select a phone</h2>

          <p>
            Choose a device above to compare
            specifications.
          </p>
        </div>
      </div>
    );
  }

  const specs = phone.specs || {};

  const display =
    specs.Display || {};

  const platform =
    specs.Platform || {};

  const camera =
    specs["Camera (Main)"] || {};

  const battery =
    specs.Battery || {};

  return (
    <div className={styles.phoneCard}>

      <div className={styles.phoneImage}>
        <DevicePhoto
          src={getImage(phone)}
          alt={phone.model_name}
        />
      </div>

      <div className={styles.phoneSummary}>

        <div className={styles.phoneTitleRow}>

          <h2>
            {phone.model_name}
          </h2>

          {phone.release_year && (
            <span>
              {phone.release_year}
            </span>
          )}

        </div>

        <ul>

          <li>
            <i className="fas fa-microchip" />

            {platform.chipset ||
              platform.cpu ||
              "Processor information unavailable"}
          </li>

          <li>
            <i className="fas fa-mobile-screen" />

            {display.display_size_inches
              ? `${display.display_size_inches}" ${
                  display.display_type || "display"
                }`
              : "Display information unavailable"}
          </li>

          <li>
            <i className="fas fa-camera" />

            {camera.rear_camera_specs ||
            camera.rear_camera_count
              ? formatValue(
                  camera.rear_camera_specs ||
                    camera.rear_camera_count
                )
              : "Camera information unavailable"}
          </li>

          <li>
            <i className="fas fa-battery-full" />

            {battery.battery_capacity_mah
              ? `${battery.battery_capacity_mah} mAh`
              : "Battery information unavailable"}
          </li>

        </ul>

      </div>

    </div>
  );
}


/* =========================================================
   CREATE COMPLETE COMPARISON TABLE
========================================================= */

/*
  This is the BIG change.

  Instead of manually saying:

  Display
  Resolution
  Processor
  RAM
  Storage
  ...

  we dynamically read EVERYTHING from specs_json.

  Therefore if your database contains:

  General
  Display
  Body / Design
  Memory
  Battery
  Camera
  Sound
  Connectivity
  Sensors
  Miscellaneous

  ALL of them appear automatically.
*/

function buildComparisonSections(
  firstSpecs,
  secondSpecs
) {
  const first = firstSpecs || {};
  const second = secondSpecs || {};

  /*
    Get every section from both phones.

    This means if Phone A has a section that
    Phone B doesn't have, it still appears.
  */
  const sectionNames = [
    ...new Set([
      ...Object.keys(first),
      ...Object.keys(second),
    ]),
  ];

  return sectionNames.map((sectionName) => {

    const firstSection =
      first[sectionName];

    const secondSection =
      second[sectionName];

    /*
      Make sure the section is treated as an object.
    */
    const firstObject =
      firstSection &&
      typeof firstSection === "object" &&
      !Array.isArray(firstSection)
        ? firstSection
        : {
            value: firstSection,
          };

    const secondObject =
      secondSection &&
      typeof secondSection === "object" &&
      !Array.isArray(secondSection)
        ? secondSection
        : {
            value: secondSection,
          };

    /*
      Get EVERY field from both phones.
    */
    const fieldNames = [
      ...new Set([
        ...Object.keys(firstObject),
        ...Object.keys(secondObject),
      ]),
    ];

    return {
      name: sectionName,

      rows: fieldNames.map(
        (fieldName) => ({
          field: fieldName,

          first:
            firstObject[fieldName],

          second:
            secondObject[fieldName],
        })
      ),
    };
  });
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function ComparePhonesPage() {

  const [firstPhone, setFirstPhone] =
    useState(null);

  const [secondPhone, setSecondPhone] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");


  /* =====================================================
     LOAD INITIAL PHONES
  ===================================================== */

  useEffect(() => {

    async function loadInitialPhones() {

      setLoading(true);

      const { data, error } =
        await supabase
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
          `)
          .order("model_name")
          .limit(2);

      if (error) {

        console.error(
          "Initial phone loading error:",
          error
        );

        setLoadError(
          "Unable to load phones. Check your database connection."
        );

        setLoading(false);

        return;
      }

      const phones =
        (data || []).map(
          normalizePhone
        );

      setFirstPhone(
        phones[0] || null
      );

      setSecondPhone(
        phones[1] || null
      );

      setLoading(false);
    }

    loadInitialPhones();

  }, []);


  /* =====================================================
     COMPLETE COMPARISON
  ===================================================== */

  const comparisonSections =
    useMemo(() => {

      return buildComparisonSections(
        firstPhone?.specs,
        secondPhone?.specs
      );

    }, [
      firstPhone,
      secondPhone,
    ]);


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className={styles.page}>

      <div className={styles.decorLeft} />

      <div className={styles.decorRight} />


      {/* =================================================
          BREADCRUMB
      ================================================= */}

      <div className={styles.breadcrumb}>

        <Link href="/">
          Home
        </Link>

        <span>›</span>

        <span>
          Compare Phones
        </span>

      </div>


      {/* =================================================
          HERO
      ================================================= */}

      <header className={styles.hero}>

        <span
          className={styles.eyebrow}
        >
          DEVICE COMPARISON
        </span>

        <h1>
          Compare Phones
        </h1>

        <p>
          Compare specifications of two
          mobile phones side by side
        </p>

      </header>


      {/* =================================================
          PHONE SELECTORS
      ================================================= */}

      <section
        className={styles.selectorRow}
      >

        <PhoneSearch
          label="Select First Phone"
          value={firstPhone}
          onChange={setFirstPhone}
          onSelect={setFirstPhone}
        />

        <div className={styles.vs}>
          VS
        </div>

        <PhoneSearch
          label="Select Second Phone"
          value={secondPhone}
          onChange={setSecondPhone}
          onSelect={setSecondPhone}
        />

      </section>


      {/* ERROR */}

      {loadError && (
        <div className={styles.error}>
          {loadError}
        </div>
      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className={styles.loading}>
          Loading phones...
        </div>

      ) : (

        <>

          {/* =============================================
              PHONE CARDS
          ============================================= */}

          <section
            className={styles.cardsRow}
          >

            <PhoneCard
              phone={firstPhone}
            />

            <div
              className={styles.centerVs}
            >
              VS
            </div>

            <PhoneCard
              phone={secondPhone}
            />

          </section>


          {/* =============================================
              COMPLETE SPECIFICATION COMPARISON
          ============================================= */}

          <section
            className={styles.comparisonPanel}
          >

            <div
              className={styles.panelHeading}
            >

              <div
                className={styles.panelIcon}
              >
                <i className="fas fa-table-list" />
              </div>

              <h2>
                Complete Specification Comparison
              </h2>

            </div>


            <div
              className={styles.tableWrap}
            >

              <table>

                {/* =======================================
                    TABLE HEADER
                ======================================= */}

                <thead>

                  <tr>

                    <th>
                      {firstPhone?.brand
                        ? `${firstPhone.brand} `
                        : ""}
                      {firstPhone?.model_name ||
                        "First phone"}
                    </th>

                    <th>
                      Features
                    </th>

                    <th>
                      {secondPhone?.brand
                        ? `${secondPhone.brand} `
                        : ""}
                      {secondPhone?.model_name ||
                        "Second phone"}
                    </th>

                  </tr>

                </thead>


                {/* =======================================
                    TABLE BODY
                ======================================= */}

                <tbody>

                  {comparisonSections.map(
                    (section) => (

                      <React.Fragment
                        key={section.name}
                      >

                        {/* ==============================
                            SECTION HEADER
                        ============================== */}

                        <tr
                          className={
                            styles.sectionRow
                          }
                        >

                          <td
                            colSpan="3"
                          >
                            <div
                              className={
                                styles.sectionTitle
                              }
                            >

                              <i
                                className={sectionIcon(
                                  section.name
                                )}
                              />

                              <strong>
                                {formatSectionName(
                                  section.name
                                )}
                              </strong>

                            </div>
                          </td>

                        </tr>


                        {/* ==============================
                            EVERY FIELD
                        ============================== */}

                        {section.rows.map(
                          (row) => (

                            <tr
                              key={`${section.name}-${row.field}`}
                            >

                              {/* PHONE 1 */}

                              <td>
                                <div
                                  className={
                                    styles.specValue
                                  }
                                >
                                  {formatValue(
                                    row.first
                                  )}
                                </div>
                              </td>


                              {/* FIELD NAME */}

                              <th>

                                <i
                                  className={featureIcon(
                                    row.field
                                  )}
                                />

                                <span>
                                  {formatLabel(
                                    row.field
                                  )}
                                </span>

                              </th>


                              {/* PHONE 2 */}

                              <td>

                                <div
                                  className={
                                    styles.specValue
                                  }
                                >
                                  {formatValue(
                                    row.second
                                  )}
                                </div>

                              </td>

                            </tr>

                          )
                        )}

                      </React.Fragment>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>

        </>

      )}

    </div>
  );
}


/* =========================================================
   ICONS
========================================================= */

function featureIcon(label) {

  const lower =
    String(label)
      .toLowerCase();

  if (
    lower.includes("display") ||
    lower.includes("screen")
  ) {
    return "fas fa-mobile-screen";
  }

  if (
    lower.includes("resolution") ||
    lower.includes("pixel")
  ) {
    return "fas fa-grip-vertical";
  }

  if (
    lower.includes("processor") ||
    lower.includes("chip") ||
    lower.includes("cpu") ||
    lower.includes("gpu")
  ) {
    return "fas fa-microchip";
  }

  if (
    lower.includes("ram") ||
    lower.includes("memory")
  ) {
    return "fas fa-memory";
  }

  if (
    lower.includes("storage") ||
    lower.includes("internal")
  ) {
    return "fas fa-hard-drive";
  }

  if (
    lower.includes("camera") ||
    lower.includes("megapixel") ||
    lower.includes("lens")
  ) {
    return "fas fa-camera";
  }

  if (
    lower.includes("battery") ||
    lower.includes("charging")
  ) {
    return "fas fa-battery-full";
  }

  if (
    lower.includes("os") ||
    lower.includes("android") ||
    lower.includes("ios")
  ) {
    return "fas fa-cloud";
  }

  if (
    lower.includes("network") ||
    lower.includes("5g") ||
    lower.includes("4g") ||
    lower.includes("wifi") ||
    lower.includes("bluetooth")
  ) {
    return "fas fa-wifi";
  }

  if (
    lower.includes("weight") ||
    lower.includes("dimension") ||
    lower.includes("height") ||
    lower.includes("width") ||
    lower.includes("thickness")
  ) {
    return "fas fa-weight-hanging";
  }

  if (
    lower.includes("color") ||
    lower.includes("colour")
  ) {
    return "fas fa-palette";
  }

  if (
    lower.includes("sim") ||
    lower.includes("esim")
  ) {
    return "fas fa-sim-card";
  }

  if (
    lower.includes("sound") ||
    lower.includes("audio") ||
    lower.includes("speaker")
  ) {
    return "fas fa-volume-high";
  }

  if (
    lower.includes("sensor") ||
    lower.includes("fingerprint")
  ) {
    return "fas fa-fingerprint";
  }

  if (
    lower.includes("security") ||
    lower.includes("face")
  ) {
    return "fas fa-shield-halved";
  }

  if (
    lower.includes("launch") ||
    lower.includes("release") ||
    lower.includes("date")
  ) {
    return "fas fa-calendar";
  }

  if (
    lower.includes("price") ||
    lower.includes("cost")
  ) {
    return "fas fa-tag";
  }

  if (
    lower.includes("ip") ||
    lower.includes("water") ||
    lower.includes("dust")
  ) {
    return "fas fa-droplet";
  }

  if (
    lower.includes("software") ||
    lower.includes("update")
  ) {
    return "fas fa-rotate";
  }

  return "fas fa-circle";
}


/* =========================================================
   SECTION ICON
========================================================= */

function sectionIcon(section) {

  const icons = {
    General:
      "fas fa-circle-info",

    "Body / Design":
      "fas fa-mobile-screen",

    Display:
      "fas fa-display",

    Platform:
      "fas fa-microchip",

    Memory:
      "fas fa-memory",

    "Camera (Main)":
      "fas fa-camera",

    "Camera (Front)":
      "fas fa-camera-retro",

    Sound:
      "fas fa-volume-high",

    "Connectivity / Communications":
      "fas fa-wifi",

    Battery:
      "fas fa-battery-full",

    "Sensors & Features":
      "fas fa-fingerprint",

    Miscellaneous:
      "fas fa-circle-nodes",
  };

  return (
    icons[section] ||
    "fas fa-layer-group"
  );
}