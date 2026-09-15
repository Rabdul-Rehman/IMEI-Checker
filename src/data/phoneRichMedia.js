// Rich-media schema for exact physical phone models.
// This is the single source of truth for hero, color and view galleries.
// Media URLs can point to /public assets or durable object-storage URLs.

function normalize(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();}
function keyFor(brand,model){const b=normalize(brand);let m=normalize(model);if(b&&m.startsWith(b+" "))m=m.slice(b.length+1).trim();return b+"|"+m;}

const PHONE_RICH_MEDIA = Object.freeze({
  // Add verified records here. Never label one image as multiple colors/views.
  // "apple|iphone 12 pro": {
  //   hero: "/phones/apple/iphone-12-pro/hero.webp",
  //   colors: [{name:"Graphite",src:"/phones/apple/iphone-12-pro/colors/graphite.webp"}],
  //   views: [{name:"Front View",src:"/phones/apple/iphone-12-pro/views/front.webp"}]
  // }
});

export function getPhoneRichMedia(brand,model){return PHONE_RICH_MEDIA[keyFor(brand,model)]||null;}
export default getPhoneRichMedia;

// Optional generated batch. Kept separate so large media imports do not require
// hand-editing this source file. Build environments without a populated batch
// simply use the curated object above.
