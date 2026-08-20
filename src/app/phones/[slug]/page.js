import Link from "next/link";
import { notFound } from "next/navigation";

import { supabase } from "../../lib/supabase";
import DevicePhoto from "../../components/DevicePhoto";
import PhoneSpecsTabs from "../../components/PhoneSpecsTabs";


export default async function PhoneDetailPage({ params }) {
  const { slug } = await params;

  const { data: phone, error } = await supabase
    .from("phones")
    .select(`
      phone_id,
      model_name,
      slug,
      specs_json,
      brand_id,
      images,
      brands (
        brand_id,
        name
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !phone) {
    notFound();
  }

  /* =========================================================
     BASIC DATA
  ========================================================= */

  const brand = phone.brands?.name || "Unknown";
  const specs = phone.specs_json || {};

  const general = specs.General || {};
  const display = specs.Display || {};
  const platform = specs.Platform || {};
  const memory = specs.Memory || {};
  const battery = specs.Battery || {};
  const body = specs["Body / Design"] || {};
  const mainCamera = specs["Camera (Main)"] || {};
  const frontCamera = specs["Camera (Front)"] || {};
  const connectivity =
    specs["Connectivity / Communications"] || {};
  const sound = specs.Sound || {};
  const sensors = specs["Sensors & Features"] || {};
  const miscellaneous = specs.Miscellaneous || {};

  let image = null;

  if (Array.isArray(phone.images) && phone.images.length > 0) {
  const firstImage = phone.images[0];

  if (typeof firstImage === "string" && firstImage.trim()) {
    image = firstImage.startsWith("http")
      ? firstImage
      : `/phone-images/${encodeURIComponent(firstImage)}`;
  }
 }

  return (
    <div className="detail-modern">

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="detail-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/phones">Phone Database</Link>
        <span>/</span>
        <span>{phone.model_name}</span>
      </div>


      {/* =====================================================
          MAIN PHONE DETAIL LAYOUT

          LEFT:
          - Phone
          - Model
          - Released
          - Availability
          - Buttons

          RIGHT:
          - Device profile
          - Phone name
          - Description
          - Tabs
          - Specifications
      ===================================================== */}

      <div className="phone-detail-main">


        {/* ===================================================
            LEFT COLUMN
        =================================================== */}

        <div className="phone-detail-left">


          {/* PHONE IMAGE */}

          <div className="detail-image">

            <DevicePhoto
              src={image}
              alt={phone.model_name}
            />

            <span className="detail-image-badge">
              {brand}
            </span>

          </div>


          {/* MODEL / RELEASE / AVAILABILITY */}

          <div className="detail-meta detail-meta-left">

            {general.model_number && (
              <span className="detail-tag">
                Model: {general.model_number}
              </span>
            )}

            {general.release_date && (
              <span className="detail-tag">
                Released: {general.release_date}
              </span>
            )}

            {general.market_status && (
              <span className="detail-tag">
                {general.market_status}
              </span>
            )}

          </div>


          {/* BUTTONS */}

          <div className="detail-actions detail-actions-left">

            <Link
              href="/"
              className="primary-action"
            >
              Check an IMEI
              <i className="fas fa-arrow-right" />
            </Link>

            <Link
              href="/phones"
              className="outline-action"
            >
              Back to database
            </Link>

          </div>


          {/* SMALL SUMMARY */}

          <div className="detail-summary detail-summary-left">

            <div>
              <span>Brand</span>
              <strong>{brand}</strong>
            </div>

            <div>
              <span>Model</span>
              <strong>{phone.model_name}</strong>
            </div>

            <div>
              <span>Release</span>
              <strong>
                {general.release_date || "—"}
              </strong>
            </div>

          </div>

        </div>


        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <div className="phone-detail-right">


          {/* DEVICE PROFILE */}

          <div className="detail-copy">

            <span className="section-eyebrow">
              {brand.toUpperCase()} · DEVICE PROFILE
            </span>

            <h1>{phone.model_name}</h1>

            {/* <p className="text-secondary mb-4">
              Complete specifications, hardware information,
              connectivity details and device identifiers.
            </p> */}

          </div>


          {/* =================================================
              TABS + COMPLETE SPECIFICATIONS
          ================================================= */}

          <PhoneSpecsTabs
            sections={{

              /* ===============================================
                 BASIC INFO
              =============================================== */

              basic: [

                {
                  title: "General",

                  items: [
                    [
                      "Brand",
                      general.brand || brand,
                    ],

                    [
                      "Model",
                      general.model_name ||
                        phone.model_name,
                    ],

                    [
                      "Model number",
                      general.model_number,
                    ],

                    [
                      "Release date",
                      general.release_date,
                    ],

                    [
                      "Launch price",
                      formatPrice(
                        general.launch_price
                      ),
                    ],

                    [
                      "Current price",
                      formatPrice(
                        general.current_price
                      ),
                    ],

                    [
                      "Market status",
                      general.market_status,
                    ],

                    [
                      "Availability",
                      general.availability_status,
                    ],
                  ],
                },


                {
                  title: "Display",

                  items: [

                    [
                      "Display size",
                      formatInches(
                        display.display_size_inches
                      ),
                    ],

                    [
                      "Type",
                      display.display_type,
                    ],

                    [
                      "Resolution",
                      display.resolution,
                    ],

                    [
                      "Refresh rate",
                      formatHz(
                        display.refresh_rate_hz
                      ),
                    ],

                    [
                      "Pixel density",
                      formatPpi(
                        display.pixel_density_ppi
                      ),
                    ],

                    [
                      "Aspect ratio",
                      display.aspect_ratio,
                    ],

                    [
                      "Display area",
                      formatCm2(
                        display.display_area_cm2
                      ),
                    ],

                    [
                      "HDR",
                      display.hdr_support === true
                        ? "Yes"
                        : display.hdr_support === false
                        ? "No"
                        : display.hdr_support,
                    ],

                    [
                      "Always-on display",
                      display.always_on_display === true
                        ? "Yes"
                        : display.always_on_display === false
                        ? "No"
                        : null,
                    ],

                    [
                      "Display protection",
                      display.display_protection,
                    ],

                    [
                      "Peak brightness",
                      formatNits(
                        display.brightness_peak_nits
                      ),
                    ],

                    [
                      "Typical brightness",
                      formatNits(
                        display.brightness_typical_nits
                      ),
                    ],
                  ],
                },


                {
                  title: "Body & Design",

                  items: [

                    [
                      "Dimensions",
                      body.dimensions,
                    ],

                    [
                      "Weight",
                      body.weight,
                    ],

                    [
                      "SIM",
                      body.sim_type,
                    ],

                    [
                      "Build",
                      body.build_material,
                    ],

                    [
                      "IP rating",
                      body.ip_rating,
                    ],

                    [
                      "Colors",
                      arrayValue(
                        body.colors_available
                      ),
                    ],
                  ],
                },


                {
                  title: "Memory",

                  items: [

                    [
                      "RAM options",
                      arrayValue(
                        memory.ram_options
                      ),
                    ],

                    [
                      "Storage",
                      arrayValue(
                        memory.storage_options
                      ),
                    ],

                    [
                      "Storage type",
                      memory.storage_type,
                    ],

                    [
                      "Expandable memory",
                      memory.expandable_memory_support
                        ? memory.expandable_memory_max ||
                          "Yes"
                        : "No",
                    ],
                  ],
                },


                {
                  title: "Battery",

                  items: [

                    [
                      "Capacity",
                      battery.battery_capacity_mah
                        ? `${battery.battery_capacity_mah} mAh`
                        : null,
                    ],

                    [
                      "Battery type",
                      battery.battery_type,
                    ],

                    [
                      "Wired charging",
                      battery.charging_wired_w
                        ? `${battery.charging_wired_w} W`
                        : null,
                    ],

                    [
                      "Wireless charging",
                      battery.charging_wireless_w
                        ? `${battery.charging_wireless_w} W`
                        : null,
                    ],

                    [
                      "Reverse charging",
                      battery.charging_reverse_w
                        ? `${battery.charging_reverse_w} W`
                        : null,
                    ],

                    [
                      "Charging time",
                      battery.charging_time,
                    ],

                    [
                      "Endurance",
                      battery.endurance_rating,
                    ],
                  ],
                },

              ],


              /* ===============================================
                 PARAMETERS
              =============================================== */

              parameters: [

                {
                  title: "Performance",

                  items: [

                    [
                      "Operating system",
                      platform.os,
                    ],

                    [
                      "Chipset",
                      platform.chipset,
                    ],

                    [
                      "CPU",
                      platform.cpu,
                    ],

                    [
                      "GPU",
                      platform.gpu,
                    ],

                    [
                      "UI",
                      platform.ui_skin,
                    ],
                  ],
                },


                {
                  title: "Camera",

                  items: [

                    [
                      "Rear cameras",
                      mainCamera.rear_camera_count,
                    ],

                    [
                      "Rear flash",
                      mainCamera.rear_flash_type,
                    ],

                    [
                      "Rear video",
                      mainCamera.rear_video_recording,
                    ],

                    [
                      "Rear features",
                      arrayValue(
                        mainCamera.rear_camera_features
                      ),
                    ],

                    [
                      "Front camera",
                      frontCamera
                        .front_camera_specs
                        ?.megapixels
                        ? `${frontCamera.front_camera_specs.megapixels} MP`
                        : null,
                    ],

                    [
                      "Front video",
                      frontCamera.front_video_recording,
                    ],
                  ],
                },


                {
                  title: "Connectivity",

                  items: [

                    [
                      "5G bands",
                      arrayValue(
                        connectivity.network_5g_bands
                      ),
                    ],

                    [
                      "4G bands",
                      connectivity.network_4g_bands,
                    ],

                    [
                      "3G bands",
                      connectivity.network_3g_bands,
                    ],

                    [
                      "2G bands",
                      connectivity.network_2g_bands,
                    ],

                    [
                      "Wi-Fi",
                      connectivity.wifi_standards,
                    ],

                    [
                      "Bluetooth",
                      connectivity.bluetooth_version,
                    ],

                    [
                      "USB",
                      connectivity.usb_type,
                    ],

                    [
                      "USB features",
                      arrayValue(
                        connectivity.usb_features
                      ),
                    ],

                    [
                      "GPS",
                      connectivity.gps_support,
                    ],

                    [
                      "NFC",
                      yesNo(connectivity.nfc),
                    ],

                    [
                      "Radio",
                      yesNo(connectivity.radio),
                    ],

                    [
                      "Infrared",
                      yesNo(connectivity.infrared),
                    ],

                    [
                      "Network speed",
                      connectivity.network_speed,
                    ],
                  ],
                },


                {
                  title: "Sound",

                  items: [

                    [
                      "Headphone jack",
                      yesNo(
                        sound.headphone_jack
                      ),
                    ],

                    [
                      "Audio",
                      arrayValue(
                        sound.audio_features
                      ),
                    ],

                    [
                      "Loudspeaker",
                      sound.loudspeaker_type,
                    ],
                  ],
                },

              ],


              /* ===============================================
                 OTHERS
              =============================================== */

              others: [

                {
                  title: "Sensors & Features",

                  items: [

                    [
                      "Sensors",
                      arrayValue(
                        sensors.sensors
                      ),
                    ],

                    [
                      "Fingerprint",
                      sensors.fingerprint_type,
                    ],

                    [
                      "Face unlock",
                      yesNo(
                        sensors.face_unlock
                      ),
                    ],

                    [
                      "Stylus support",
                      yesNo(
                        sensors.stylus_support
                      ),
                    ],

                    [
                      "Special features",
                      arrayValue(
                        sensors.special_features
                      ),
                    ],
                  ],
                },


                {
                  title: "Additional Information",

                  items: [

                    [
                      "Certifications",
                      arrayValue(
                        miscellaneous.certifications
                      ),
                    ],

                    [
                      "Additional notes",
                      arrayValue(
                        miscellaneous.additional_notes
                      ),
                    ],

                    [
                      "SAR value",
                      miscellaneous.sar_value,
                    ],
                  ],
                },

              ],

            }}
          />

        </div>

      </div>


      {/* =====================================================
          NEXT STEP
      ===================================================== */}

      <section className="detail-next-step">

        <div>

          <span className="section-eyebrow">
            NEXT STEP
          </span>

          <h2>Checking this device?</h2>

          <p>
            Use the IMEI checker to investigate a specific
            device.
          </p>

        </div>

        <Link
          href="/"
          className="primary-action"
        >
          Start IMEI check
          <i className="fas fa-arrow-right" />
        </Link>

      </section>

    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function arrayValue(value) {
  if (!Array.isArray(value)) {
    return value || null;
  }

  if (!value.length) {
    return null;
  }

  return value.join(", ");
}


function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";

  return null;
}


function formatInches(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value}"`;
}


function formatHz(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value} Hz`;
}


function formatPpi(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value} PPI`;
}


function formatCm2(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value} cm²`;
}


function formatNits(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value} nits`;
}


function formatPrice(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .filter(
        ([, price]) =>
          price !== null &&
          price !== undefined &&
          price !== ""
      )
      .map(
        ([country, price]) =>
          `${country}: ${price}`
      )
      .join(" · ");
  }

  return String(value);
}