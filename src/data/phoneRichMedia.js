import { getMappedPhoneImageByIdentity, getModelVariantOptionsByIdentity } from "./modelPhoneImageIndex";
import generatedMedia from "./phoneRichMedia.generated.json";

function normalize(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();}
function keyFor(brand,model){const b=normalize(brand);let m=normalize(model);if(b&&m.startsWith(b+" "))m=m.slice(b.length+1).trim();return b+"|"+m;}
function validUrl(value){return typeof value==="string"&&/^(https?:\/\/|\/)/.test(value.trim());}
function cleanMedia(media){if(!media||typeof media!=="object")return null;return {...media,hero:validUrl(media.hero)?media.hero:null,colors:(media.colors||[]).filter(x=>x?.name&&validUrl(x?.src)),views:(media.views||[]).filter(x=>x?.name&&validUrl(x?.src)),finishes:Array.isArray(media.finishes)?media.finishes:[]};}

// Curated entries take precedence over generated batches. Labels are semantic:
// never label a generic photo as a color or device angle.
const PHONE_RICH_MEDIA=Object.freeze({
  "apple|iphone 12 pro":{
    hero:"https://static-01.daraz.pk/p/f229cd3c48bf44292569c59eb3a75fb0.png",
    colors:[
      {name:"Graphite",src:"https://static-01.daraz.pk/p/f229cd3c48bf44292569c59eb3a75fb0.png"},
      {name:"Silver",src:"https://need-a-phone.ca/cdn/shop/files/iPhone_12_Pro_Silver.png?v=1759923815&width=1946"},
      {name:"Gold",src:"https://plintech.com/images/detailed/9/Apple_IPhone_12_Pro_gold.jpg"},
      {name:"Pacific Blue",src:"https://store.gorecell.ca/cdn/shop/files/a26eb554b9714af08a4512011c15da25.jpg?v=1726258941"}
    ],
    views:[
      {name:"Front + Back",src:"https://static-01.daraz.pk/p/f229cd3c48bf44292569c59eb3a75fb0.png"},
      {name:"Left / Right / Top / Bottom",src:"https://cs-phone.de/cdn/shop/files/iPhone12Pro-09Rahmenalle.jpg?v=1709566230&width=1946"},
      {name:"Camera Close-up",src:"https://www.apple.com/newsroom/images/product/iphone/standard/Apple_iphone12pro-back-camera_10132020_big.jpg.large.jpg"}
    ],
    mediaStatus:{hero:"exact-model",colors:"mapped-exact-model",views:"semantic-labels-only"},
    finishes:["Graphite","Silver","Gold","Pacific Blue"],
    source:"Exact-model product media"
  },
  "apple|iphone 13 pro":{hero:null,colors:[],views:[],finishes:["Sierra Blue","Graphite","Gold","Silver","Alpine Green"]},
  "apple|iphone 13 pro max":{hero:null,colors:[],views:[],finishes:["Sierra Blue","Graphite","Gold","Silver","Alpine Green"]},
  "apple|iphone 14":{hero:null,colors:[],views:[],finishes:["Midnight","Blue","Starlight","Purple","(PRODUCT)RED"]},
  "apple|iphone 14 plus":{hero:null,colors:[],views:[],finishes:["Midnight","Blue","Starlight","Purple","(PRODUCT)RED"]},
  "apple|iphone 14 pro":{hero:null,colors:[],views:[],finishes:["Space Black","Silver","Gold","Deep Purple"]},
  "apple|iphone 14 pro max":{hero:null,colors:[],views:[],finishes:["Space Black","Silver","Gold","Deep Purple"]},
  "apple|iphone 15 pro":{hero:null,colors:[],views:[],finishes:["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"]},
  "apple|iphone 15 pro max":{hero:null,colors:[],views:[],finishes:["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"]}
});

export function getPhoneRichMedia(brand,model){
  const key=keyFor(brand,model);
  const curated=cleanMedia(PHONE_RICH_MEDIA[key]);
  if(curated&&(curated.hero||curated.colors.length||curated.views.length))return curated;
  const generated=cleanMedia(generatedMedia?.[key]);
  if(generated&&(generated.hero||generated.colors.length||generated.views.length))return generated;
  const hero=getMappedPhoneImageByIdentity(brand,model);
  if(!hero)return curated||generated||null;
  const variants=getModelVariantOptionsByIdentity(brand,model)||{};
  return {hero,colors:[],views:[],finishes:Array.isArray(variants.color_options)?variants.color_options:[],mediaStatus:{hero:"catalog-exact-model",colors:"awaiting-distinct-assets",views:"awaiting-distinct-assets"},source:"local exact-model catalog"};
}

export function getPhoneMediaCoverage(brand,model){
  const media=getPhoneRichMedia(brand,model);
  if(!media)return {hero:false,colors:0,views:0,complete:false};
  const colors=(media.colors||[]).filter(x=>x?.name&&x?.src);
  const views=(media.views||[]).filter(x=>x?.name&&x?.src);
  return {hero:Boolean(media.hero),colors:colors.length,views:views.length,complete:Boolean(media.hero)&&colors.length>0&&views.length>0};
}
export default getPhoneRichMedia;
