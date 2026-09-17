import { getMappedPhoneImageByIdentity, getModelVariantOptionsByIdentity } from "./modelPhoneImageIndex";

// Rich-media schema for exact physical phone models.
// Only use an angle/color label when the linked image actually represents it.
function normalize(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();}
function keyFor(brand,model){const b=normalize(brand);let m=normalize(model);if(b&&m.startsWith(b+" "))m=m.slice(b.length+1).trim();return b+"|"+m;}

const PHONE_RICH_MEDIA = Object.freeze({
  "apple|iphone 12 pro": {
    hero: "https://www.elpalaciodehierro.com/on/demandware.static/-/Sites-palacio-master-catalog/default/dwa3c923e1/images/41966866/large/41966866_x1.jpg",
    colors: [
      { name: "Graphite", src: "https://www.elpalaciodehierro.com/on/demandware.static/-/Sites-palacio-master-catalog/default/dwa3c923e1/images/41966866/large/41966866_x1.jpg" },
      { name: "Silver", src: "https://static01.galaxus.com/productimages/3/8/9/1/6/4/6/0/iPhone_12_Pro_Silver_PDP_Image_Position-2__en-US.jpg_sea.jpeg" },
      { name: "Gold", src: "https://i5.walmartimages.com/seo/Verizon-iPhone-12-Pro-128GB-Gold_2d458bd0-9317-460b-af7d-db97bc90c45f.fff1a62d78c15c7129fdb89d82f0ac74.jpeg" },
      { name: "Pacific Blue", src: "https://i5.walmartimages.com/asr/0aa428ff-a597-43e9-ab49-7e6e687f0ff5.f7728cc6a63f818ebbcfb25ad62897e2.jpeg" }
    ],
    views: [
      { name: "Full Product View", src: "https://www.elpalaciodehierro.com/on/demandware.static/-/Sites-palacio-master-catalog/default/dwa3c923e1/images/41966866/large/41966866_x1.jpg" },
      { name: "Side Profile", src: "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_iphone12pro-pacific-blue_10132020_Full-Bleed-Image.jpg.large.jpg" },
      { name: "Camera Close-up", src: "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_iphone12pro-back-camera_10132020_big.jpg.large.jpg" },
      { name: "In the Box", src: "https://badili.ke/cdn/shop/files/iphone-12-pro-graphite-with-box.jpg?v=1778579101" }
    ],
    mediaStatus: { hero: "exact-model-full-device", colors: "four-finish-exact-model", views: "verified-available-views" },
    finishes: ["Graphite", "Silver", "Gold", "Pacific Blue"],
    source: "Apple + exact-model retail product media"
  },
  "apple|iphone 13 pro": {hero:null,colors:[],views:[],finishes:["Sierra Blue","Graphite","Gold","Silver","Alpine Green"],mediaStatus:{hero:"awaiting-distinct-asset",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"Apple Newsroom"},
  "apple|iphone 13 pro max": {hero:null,colors:[],views:[],finishes:["Sierra Blue","Graphite","Gold","Silver","Alpine Green"],mediaStatus:{hero:"awaiting-distinct-asset",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"Apple Newsroom"},
  "apple|iphone 14": {hero:null,colors:[],views:[],finishes:["Midnight","Blue","Starlight","Purple","(PRODUCT)RED"],mediaStatus:{hero:"awaiting-distinct-asset",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"Apple Newsroom"},
  "apple|iphone 14 plus": {hero:null,colors:[],views:[],finishes:["Midnight","Blue","Starlight","Purple","(PRODUCT)RED"],mediaStatus:{hero:"awaiting-distinct-asset",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"Apple Newsroom"},
  "apple|iphone 14 pro": {hero:null,colors:[],views:[],finishes:["Space Black","Silver","Gold","Deep Purple"],mediaStatus:{hero:"awaiting-distinct-asset",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"Apple Newsroom"},
  "apple|iphone 14 pro max": {hero:null,colors:[],views:[],finishes:["Space Black","Silver","Gold","Deep Purple"],mediaStatus:{hero:"awaiting-distinct-asset",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"Apple Newsroom"},
  "apple|iphone 15 pro": {hero:null,colors:[],views:[],finishes:["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"],mediaStatus:{hero:"awaiting-distinct-asset",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"Apple Newsroom"},
  "apple|iphone 15 pro max": {hero:null,colors:[],views:[],finishes:["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"],mediaStatus:{hero:"awaiting-distinct-asset",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"Apple Newsroom"}
});

export function getPhoneRichMedia(brand,model){
  const curated=PHONE_RICH_MEDIA[keyFor(brand,model)];
  if(curated) return curated;
  const hero=getMappedPhoneImageByIdentity(brand,model);
  if(!hero) return null;
  const variants=getModelVariantOptionsByIdentity(brand,model)||{};
  return {hero,colors:[],views:[],finishes:Array.isArray(variants.color_options)?variants.color_options:[],mediaStatus:{hero:"catalog-exact-model",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"local exact-model catalog"};
}

export function getPhoneMediaCoverage(brand,model){
  const media=getPhoneRichMedia(brand,model);
  if(!media) return {hero:false,colors:0,views:0,complete:false};
  const colors=(media.colors||[]).filter(x=>x?.name&&x?.src);
  const views=(media.views||[]).filter(x=>x?.name&&x?.src);
  return {hero:Boolean(media.hero),colors:colors.length,views:views.length,complete:Boolean(media.hero)&&colors.length>0&&views.length>0};
}
export default getPhoneRichMedia;
