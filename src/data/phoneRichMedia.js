// Rich-media schema for exact physical phone models.
// This is the single source of truth for hero, color and view galleries.
// Media URLs can point to /public assets or durable object-storage URLs.

function normalize(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();}
function keyFor(brand,model){const b=normalize(brand);let m=normalize(model);if(b&&m.startsWith(b+" "))m=m.slice(b.length+1).trim();return b+"|"+m;}

const PHONE_RICH_MEDIA = Object.freeze({
  // Verified against Apple's iPhone 12 Pro technical specifications and
  // Apple Newsroom launch media. Rich slots are deliberately conservative:
  // only distinct, exact-model assets should be added here.
  "apple|iphone 12 pro": {
    hero: "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_announce-iphone12pro_10132020_big.jpg.large.jpg",
    colors: [],
    views: [
      {
        name: "Official Product View",
        src: "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_announce-iphone12pro_10132020_big.jpg.large.jpg"
      }
    ],
    mediaStatus: {
      hero: "verified",
      colors: "awaiting-distinct-assets",
      views: "partial"
    },
    finishes: ["Graphite", "Silver", "Gold", "Pacific Blue"],
    source: "Apple"
  },
  "apple|iphone 13 pro": {
    hero: null,
    colors: [],
    views: [],
    finishes: ["Sierra Blue","Graphite","Gold","Silver","Alpine Green"],
    mediaStatus: { hero: "awaiting-distinct-asset", colors: "awaiting-distinct-assets", views: "awaiting-distinct-assets" },
    source: "Apple Newsroom"
  },
  "apple|iphone 13 pro max": {
    hero: null, colors: [], views: [],
    finishes: ["Sierra Blue","Graphite","Gold","Silver","Alpine Green"],
    mediaStatus: { hero: "awaiting-distinct-asset", colors: "awaiting-distinct-assets", views: "awaiting-distinct-assets" },
    source: "Apple Newsroom"
  },
  "apple|iphone 14": {
    hero: null, colors: [], views: [],
    finishes: ["Midnight","Blue","Starlight","Purple","(PRODUCT)RED"],
    mediaStatus: { hero: "awaiting-distinct-asset", colors: "awaiting-distinct-assets", views: "awaiting-distinct-assets" },
    source: "Apple Newsroom"
  },
  "apple|iphone 14 plus": {
    hero: null, colors: [], views: [],
    finishes: ["Midnight","Blue","Starlight","Purple","(PRODUCT)RED"],
    mediaStatus: { hero: "awaiting-distinct-asset", colors: "awaiting-distinct-assets", views: "awaiting-distinct-assets" },
    source: "Apple Newsroom"
  },
  "apple|iphone 14 pro": {
    hero: null, colors: [], views: [],
    finishes: ["Space Black","Silver","Gold","Deep Purple"],
    mediaStatus: { hero: "awaiting-distinct-asset", colors: "awaiting-distinct-assets", views: "awaiting-distinct-assets" },
    source: "Apple Newsroom"
  },
  "apple|iphone 14 pro max": {
    hero: null, colors: [], views: [],
    finishes: ["Space Black","Silver","Gold","Deep Purple"],
    mediaStatus: { hero: "awaiting-distinct-asset", colors: "awaiting-distinct-assets", views: "awaiting-distinct-assets" },
    source: "Apple Newsroom"
  },
  "apple|iphone 15 pro": {
    hero: null, colors: [], views: [],
    finishes: ["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"],
    mediaStatus: { hero: "awaiting-distinct-asset", colors: "awaiting-distinct-assets", views: "awaiting-distinct-assets" },
    source: "Apple Newsroom"
  },
  "apple|iphone 15 pro max": {
    hero: null, colors: [], views: [],
    finishes: ["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"],
    mediaStatus: { hero: "awaiting-distinct-asset", colors: "awaiting-distinct-assets", views: "awaiting-distinct-assets" },
    source: "Apple Newsroom"
  }
});

export function getPhoneRichMedia(brand,model){return PHONE_RICH_MEDIA[keyFor(brand,model)]||null;}
export default getPhoneRichMedia;

// Optional generated batch. Kept separate so large media imports do not require
// hand-editing this source file. Build environments without a populated batch
// simply use the curated object above.
