// Single source of truth for phone image mappings.
// Keep this app-level import path for existing callers, but always use
// the canonical generated map in src/data so the two copies can never drift.
export {
  PHONE_IMAGE_MAP,
  PHONE_IMAGE_FALLBACK,
  getMappedPhoneImage,
} from "../../data/phoneImageMap";
