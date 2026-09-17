import { getMappedPhoneImageByIdentity, getModelVariantOptionsByIdentity } from "./modelPhoneImageIndex";

// Rich-media schema for exact physical phone models.
// Never attach an angle/color label unless the linked image actually represents it.
function normalize(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();}
function keyFor(brand,model){const b=normalize(brand);let m=normalize(model);if(b&&m.startsWith(b+" "))m=m.slice(b.length+1).trim();return b+"|"+m;}

const PHONE_RICH_MEDIA = Object.freeze({
  "apple|iphone 12 pro": {
    hero: "https://ardes.bg/uploads/original/apple-iphone-12-pro-295645.jpg",
    colors: [
      { name: "Graphite", src: "https://ardes.bg/uploads/original/apple-iphone-12-pro-295645.jpg" },
      { name: "Silver", src: "https://need-a-phone.ca/cdn/shop/files/iPhone_12_Pro_Silver.png?v=1759923815&width=1946" },
      { name: "Gold", src: "https://plintech.com/images/detailed/9/Apple_IPhone_12_Pro_gold.jpg" },
      { name: "Pacific Blue", src: "https://store.gorecell.ca/cdn/shop/files/a26eb554b9714af08a4512011c15da25.jpg?v=1726258941" }
    ],
    views: [
      { name: "Front + Back", src: "https://ardes.bg/uploads/original/apple-iphone-12-pro-295645.jpg" },
      { name: "Left / Right / Top / Bottom", src: "https://cs-phone.de/cdn/shop/files/iPhone12Pro-09Rahmenalle.jpg?v=1709566230&width=1946" },
      { name: "Camera Close-up", src: "https://www.apple.com/newsroom/images/product/iphone/standard/Apple_iphone12pro-back-camera_10132020_big.jpg.large.jpg" },
      { name: "In the Box", src: "https://mxp-media.ilnmedia.com/media/content/2021/Sep/Every-Smartphone-In-The-Future-Might-Come-Without-A-Charger-In-The-Box-By-2024-2_614c6b83b5491.jpeg?cc=1&h=465&w=780" }
    ],
    mediaStatus: { hero: "verified-exact-model", colors: "four-finish-verified", views: "verified-no-fake-angle-labels" },
    finishes: ["Graphite", "Silver", "Gold", "Pacific Blue"],
    source: "Apple Support/Newsroom + exact-model product media"
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
