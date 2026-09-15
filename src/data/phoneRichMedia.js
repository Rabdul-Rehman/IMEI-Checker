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
  }
});

export function getPhoneRichMedia(brand,model){return PHONE_RICH_MEDIA[keyFor(brand,model)]||null;}
export default getPhoneRichMedia;

// Optional generated batch. Kept separate so large media imports do not require
// hand-editing this source file. Build environments without a populated batch
// simply use the curated object above.
