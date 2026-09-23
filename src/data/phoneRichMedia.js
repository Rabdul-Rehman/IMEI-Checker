import { getMappedPhoneImageByIdentity, getModelVariantOptionsByIdentity } from "./modelPhoneImageIndex";
import generatedMedia from "./phoneRichMedia.generated.json";

function normalize(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();}
function keyFor(brand,model){const b=normalize(brand);let m=normalize(model);if(b&&m.startsWith(b+" "))m=m.slice(b.length+1).trim();return b+"|"+m;}
function validUrl(value){return typeof value==="string"&&/^(https?:\/\/|\/)/.test(value.trim());}
function finishMedia(hero,finishes){
  // A finish is clickable only when it has a distinct verified image.
  // Never duplicate the canonical hero across different color labels.
  return [];
}
function appleStoreColorMedia(prefix,finishes,suffix=""){
  return finishes.map(({name,slug})=>({name,src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/"+prefix+slug+suffix+"?wid=470&hei=556&fmt=png-alpha"}));
}
function cleanMedia(media){if(!media||typeof media!=="object")return null;return {...media,hero:validUrl(media.hero)?media.hero:null,colors:(media.colors||[]).filter(x=>x?.name&&validUrl(x?.src)),views:(media.views||[]).filter(x=>x?.name&&validUrl(x?.src)),finishes:Array.isArray(media.finishes)?media.finishes:[],storage:Array.isArray(media.storage)?media.storage:[]};}

// Curated entries take precedence over generated batches. Labels are semantic:
// never label a generic photo as a color or device angle.
const PHONE_RICH_MEDIA=Object.freeze({
  "apple|iphone 12":{
    colors:[
      {name:"Black",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-black-select-2020?wid=470&hei=556&fmt=png-alpha"},
      {name:"White",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-white-select-2020?wid=470&hei=556&fmt=png-alpha"},
      {name:"(PRODUCT)RED",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-red-select-2020?wid=470&hei=556&fmt=png-alpha"},
      {name:"Green",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-green-select-2020?wid=470&hei=556&fmt=png-alpha"},
      {name:"Blue",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-blue-select-2020?wid=470&hei=556&fmt=png-alpha"},
      {name:"Purple",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-purple-select-2021?wid=470&hei=556&fmt=png-alpha"}
    ],
    finishes:["Black","White","(PRODUCT)RED","Green","Blue","Purple"]
  },
  "apple|iphone 14 plus":{
    colors:[
      {name:"Midnight",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-plus-midnight-select-202209?wid=470&hei=556&fmt=png-alpha"},
      {name:"Blue",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-plus-blue-select-202209?wid=470&hei=556&fmt=png-alpha"},
      {name:"Starlight",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-plus-starlight-select-202209?wid=470&hei=556&fmt=png-alpha"},
      {name:"Purple",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-plus-purple-select-202209?wid=470&hei=556&fmt=png-alpha"},
      {name:"(PRODUCT)RED",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-plus-product-red-select-202209?wid=470&hei=556&fmt=png-alpha"},
      {name:"Yellow",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-plus-yellow-select-202303?wid=470&hei=556&fmt=png-alpha"}
    ],
    finishes:["Midnight","Blue","Starlight","Purple","(PRODUCT)RED","Yellow"]
  },
  "apple|iphone 11":{
    colors:[
      {name:"Black",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone11-black-select-2019?wid=940&hei=1112&fmt=png-alpha"},
      {name:"Green",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone11-green-select-2019?wid=940&hei=1112&fmt=png-alpha"},
      {name:"Yellow",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone11-yellow-select-2019?wid=940&hei=1112&fmt=png-alpha"},
      {name:"Purple",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone11-purple-select-2019?wid=940&hei=1112&fmt=png-alpha"},
      {name:"White",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone11-white-select-2019?wid=940&hei=1112&fmt=png-alpha"},
      {name:"(PRODUCT)RED",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone11-red-select-2019?wid=940&hei=1112&fmt=png-alpha"}
    ],
    finishes:["Black","Green","Yellow","Purple","White","(PRODUCT)RED"]
  },
  "apple|iphone 13":{
    colors:[
      {name:"Pink",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pink-select-2021?wid=470&hei=556&fmt=png-alpha"},
      {name:"Blue",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-blue-select-2021?wid=470&hei=556&fmt=png-alpha"},
      {name:"Midnight",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-midnight-select-2021?wid=470&hei=556&fmt=png-alpha"},
      {name:"Starlight",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-starlight-select-2021?wid=470&hei=556&fmt=png-alpha"},
      {name:"(PRODUCT)RED",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-product-red-select-2021?wid=470&hei=556&fmt=png-alpha"},
      {name:"Green",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-green-select?wid=470&hei=556&fmt=png-alpha"}
    ],
    finishes:["Pink","Blue","Midnight","Starlight","(PRODUCT)RED","Green"]
  },
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
  "apple|iphone 12 mini":{hero:null,colors:appleStoreColorMedia("iphone-12-mini-",[{name:"Black",slug:"black"},{name:"White",slug:"white"},{name:"(PRODUCT)RED",slug:"red"},{name:"Green",slug:"green"},{name:"Blue",slug:"blue"},{name:"Purple",slug:"purple"}],"-select-2020"),views:[],finishes:["Black","White","(PRODUCT)RED","Green","Blue","Purple"]},
  "apple|iphone 12 pro max":{hero:null,colors:appleStoreColorMedia("iphone-12-pro-max-",[{name:"Graphite",slug:"graphite"},{name:"Silver",slug:"silver"},{name:"Gold",slug:"gold"},{name:"Pacific Blue",slug:"blue"}],"-select-2020"),views:[],finishes:["Graphite","Silver","Gold","Pacific Blue"]},
  "apple|iphone 13 mini":{hero:null,colors:appleStoreColorMedia("iphone-13-mini-",[{name:"Pink",slug:"pink"},{name:"Blue",slug:"blue"},{name:"Midnight",slug:"midnight"},{name:"Starlight",slug:"starlight"},{name:"(PRODUCT)RED",slug:"product-red"},{name:"Green",slug:"green"}],"-select-2021"),views:[],finishes:["Pink","Blue","Midnight","Starlight","(PRODUCT)RED","Green"]},
  "apple|iphone 13 pro":{hero:null,colors:appleStoreColorMedia("iphone-13-pro-",[{name:"Sierra Blue",slug:"sierra-blue"},{name:"Graphite",slug:"graphite"},{name:"Gold",slug:"gold"},{name:"Silver",slug:"silver"},{name:"Alpine Green",slug:"alpine-green"}],"-select"),views:[],finishes:["Sierra Blue","Graphite","Gold","Silver","Alpine Green"]},
  "apple|iphone 13 pro max":{hero:null,colors:appleStoreColorMedia("iphone-13-pro-max-",[{name:"Sierra Blue",slug:"sierra-blue"},{name:"Graphite",slug:"graphite"},{name:"Gold",slug:"gold"},{name:"Silver",slug:"silver"},{name:"Alpine Green",slug:"alpine-green"}],"-select"),views:[],finishes:["Sierra Blue","Graphite","Gold","Silver","Alpine Green"]},
  "apple|iphone 14":{hero:null,colors:appleStoreColorMedia("iphone-14-",[{name:"Midnight",slug:"midnight"},{name:"Blue",slug:"blue"},{name:"Starlight",slug:"starlight"},{name:"Purple",slug:"purple"},{name:"(PRODUCT)RED",slug:"product-red"},{name:"Yellow",slug:"yellow"}],"-select-202209"),views:[],finishes:["Midnight","Blue","Starlight","Purple","(PRODUCT)RED","Yellow"]},
  "apple|iphone 14 pro":{hero:null,colors:appleStoreColorMedia("iphone-14-pro-",[{name:"Space Black",slug:"spaceblack"},{name:"Silver",slug:"silver"},{name:"Gold",slug:"gold"},{name:"Deep Purple",slug:"deeppurple"}],"-select-202209"),views:[],finishes:["Space Black","Silver","Gold","Deep Purple"]},
  "apple|iphone 14 pro max":{hero:null,colors:appleStoreColorMedia("iphone-14-pro-max-",[{name:"Space Black",slug:"spaceblack"},{name:"Silver",slug:"silver"},{name:"Gold",slug:"gold"},{name:"Deep Purple",slug:"deeppurple"}],"-select-202209"),views:[],finishes:["Space Black","Silver","Gold","Deep Purple"]},
  "apple|iphone 15 pro":{hero:null,colors:[
    {name:"Black Titanium",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-blacktitanium?wid=512&hei=512&fmt=png-alpha"},
    {name:"White Titanium",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-whitetitanium?wid=512&hei=512&fmt=png-alpha"},
    {name:"Blue Titanium",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium?wid=512&hei=512&fmt=png-alpha"},
    {name:"Natural Titanium",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=512&hei=512&fmt=png-alpha"}
  ],views:[],finishes:["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"]},
  "apple|iphone 15 pro max":{hero:null,colors:[
    {name:"Black Titanium",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-blacktitanium?wid=512&hei=512&fmt=png-alpha"},
    {name:"White Titanium",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-whitetitanium?wid=512&hei=512&fmt=png-alpha"},
    {name:"Blue Titanium",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium?wid=512&hei=512&fmt=png-alpha"},
    {name:"Natural Titanium",src:"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=512&hei=512&fmt=png-alpha"}
  ],views:[],finishes:["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"]}
  ,"apple|iphone 15":{hero:null,colors:appleStoreColorMedia("iphone-15-finish-select-202309-6-1inch-",[{name:"Black",slug:"black"},{name:"Blue",slug:"blue"},{name:"Green",slug:"green"},{name:"Yellow",slug:"yellow"},{name:"Pink",slug:"pink"}]),views:[],finishes:["Black","Blue","Green","Yellow","Pink"]}
  ,"apple|iphone 15 plus":{hero:null,colors:appleStoreColorMedia("iphone-15-finish-select-202309-6-7inch-",[{name:"Black",slug:"black"},{name:"Blue",slug:"blue"},{name:"Green",slug:"green"},{name:"Yellow",slug:"yellow"},{name:"Pink",slug:"pink"}]),views:[],finishes:["Black","Blue","Green","Yellow","Pink"]}
  ,"apple|iphone 16":{hero:null,colors:appleStoreColorMedia("iphone-16-finish-select-202409-6-1inch-",[{name:"Black",slug:"black"},{name:"White",slug:"white"},{name:"Pink",slug:"pink"},{name:"Teal",slug:"teal"},{name:"Ultramarine",slug:"ultramarine"}]),views:[],finishes:["Black","White","Pink","Teal","Ultramarine"]}
  ,"apple|iphone 16 plus":{hero:null,colors:appleStoreColorMedia("iphone-16-finish-select-202409-6-7inch-",[{name:"Black",slug:"black"},{name:"White",slug:"white"},{name:"Pink",slug:"pink"},{name:"Teal",slug:"teal"},{name:"Ultramarine",slug:"ultramarine"}]),views:[],finishes:["Black","White","Pink","Teal","Ultramarine"]}
  ,"apple|iphone 16 pro":{hero:null,colors:appleStoreColorMedia("iphone-16-pro-finish-select-202409-6-3inch-",[{name:"Black Titanium",slug:"blacktitanium"},{name:"White Titanium",slug:"whitetitanium"},{name:"Natural Titanium",slug:"naturaltitanium"},{name:"Desert Titanium",slug:"deserttitanium"}]),views:[],finishes:["Black Titanium","White Titanium","Natural Titanium","Desert Titanium"]}
  ,"apple|iphone 16 pro max":{hero:null,colors:appleStoreColorMedia("iphone-16-pro-finish-select-202409-6-9inch-",[{name:"Black Titanium",slug:"blacktitanium"},{name:"White Titanium",slug:"whitetitanium"},{name:"Natural Titanium",slug:"naturaltitanium"},{name:"Desert Titanium",slug:"deserttitanium"}]),views:[],finishes:["Black Titanium","White Titanium","Natural Titanium","Desert Titanium"]}

});


// Canonical Apple-family media resolver. TAC/catalog names often include model
// numbers, region/network suffixes and storage (for example:
// "iPhone 12 Pro 5G A2407 Global Dual SIM TD-LTE 512GB").  Those are the
// same physical phone and must use the canonical iPhone model artwork rather
// than a variant-specific catalog thumbnail.
const APPLE_IPHONE_FAMILY_MEDIA=Object.freeze({
  "iphone 8":{hero:"/phone-images/group-1274.webp",finishes:["Silver","Space Gray","Gold","(PRODUCT)RED"],storage:["64GB","128GB","256GB"]},
  "iphone 8 plus":{hero:"/phone-images/group-1275.webp",finishes:["Silver","Space Gray","Gold","(PRODUCT)RED"],storage:["64GB","128GB","256GB"]},
  "iphone xr":{hero:"/phone-images/group-1281.webp",finishes:["Black","White","Blue","Yellow","Coral","(PRODUCT)RED"],storage:["64GB","128GB","256GB"]},
  "iphone xs":{hero:"/phone-images/group-1283.webp",finishes:["Space Gray","Silver","Gold"],storage:["64GB","256GB","512GB"]},
  "iphone xs max":{hero:"/phone-images/group-1285.webp",finishes:["Space Gray","Silver","Gold"],storage:["64GB","256GB","512GB"]},
  "iphone 11":{hero:"/phone-images/group-1259.webp",finishes:["Black","Green","Yellow","Purple","White","(PRODUCT)RED"],storage:["64GB","128GB","256GB"]},
  "iphone 11 pro":{hero:"/phone-images/group-1261.webp",finishes:["Midnight Green","Space Gray","Silver","Gold"],storage:["64GB","256GB","512GB"]},
  "iphone 11 pro max":{hero:"/phone-images/group-1263.webp",finishes:["Midnight Green","Space Gray","Silver","Gold"],storage:["64GB","256GB","512GB"]},
  "iphone se 2020":{hero:"/phone-images/group-1276.webp",finishes:["Black","White","(PRODUCT)RED"],storage:["64GB","128GB","256GB"]},
  "iphone 12":{hero:"/phone-images/group-1265.webp",finishes:["Black","White","(PRODUCT)RED","Green","Blue","Purple"],storage:["64GB","128GB","256GB"]},
  "iphone 12 mini":{hero:"/phone-images/group-1266.webp",finishes:["Black","White","(PRODUCT)RED","Green","Blue","Purple"],storage:["64GB","128GB","256GB"]},
  "iphone 12 pro":{hero:"https://static-01.daraz.pk/p/f229cd3c48bf44292569c59eb3a75fb0.png",finishes:["Graphite","Silver","Gold","Pacific Blue"],storage:["128GB","256GB","512GB"]},
  "iphone 12 pro max":{hero:"https://www.apple.com/newsroom/images/product/availability/Apple_iphone12mini-iphone12max-homepodmini-availability_iphone12promax-us_110520_inline.jpg.large.jpg",finishes:["Graphite","Silver","Gold","Pacific Blue"],storage:["128GB","256GB","512GB"]},
  "iphone 13":{hero:"/phone-images/group-1230.webp",finishes:["Pink","Blue","Midnight","Starlight","(PRODUCT)RED","Green"],storage:["128GB","256GB","512GB"]},
  "iphone 13 mini":{hero:"/phone-images/group-1268.webp",finishes:["Pink","Blue","Midnight","Starlight","(PRODUCT)RED","Green"],storage:["128GB","256GB","512GB"]},
  "iphone 13 pro":{hero:"/phone-images/group-1269.webp",finishes:["Sierra Blue","Graphite","Gold","Silver","Alpine Green"],storage:["128GB","256GB","512GB","1TB"]},
  "iphone 13 pro max":{hero:"/phone-images/group-1270.webp",finishes:["Sierra Blue","Graphite","Gold","Silver","Alpine Green"],storage:["128GB","256GB","512GB","1TB"]},
  "iphone se 5g 2022":{hero:"/phone-images/group-1280.webp",finishes:["Midnight","Starlight","(PRODUCT)RED"],storage:["64GB","128GB","256GB"]},
  "iphone 14":{hero:"/phone-images/group-1231.webp",finishes:["Midnight","Blue","Starlight","Purple","(PRODUCT)RED","Yellow"],storage:["128GB","256GB","512GB"]},
  "iphone 14 plus":{hero:"/phone-images/group-1271.webp",finishes:["Midnight","Blue","Starlight","Purple","(PRODUCT)RED","Yellow"],storage:["128GB","256GB","512GB"]},
  "iphone 14 pro":{hero:"/phone-images/group-1272.webp",finishes:["Space Black","Silver","Gold","Deep Purple"],storage:["128GB","256GB","512GB","1TB"]},
  "iphone 14 pro max":{hero:"/phone-images/group-1273.webp",finishes:["Space Black","Silver","Gold","Deep Purple"],storage:["128GB","256GB","512GB","1TB"]},
  "iphone 15":{hero:"/phone-images/group-1232.webp",finishes:["Black","Blue","Green","Yellow","Pink"],storage:["128GB","256GB","512GB"]},
  "iphone 15 plus":{hero:"/phone-images/group-1233.webp",finishes:["Black","Blue","Green","Yellow","Pink"],storage:["128GB","256GB","512GB"]},
  "iphone 15 pro":{hero:"/phone-images/group-1234.webp",finishes:["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"],storage:["128GB","256GB","512GB","1TB"]},
  "iphone 15 pro max":{hero:"/phone-images/group-1235.webp",finishes:["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"],storage:["256GB","512GB","1TB"]},
  "iphone 16":{hero:"/phone-images/group-1236.webp",finishes:["Black","White","Pink","Teal","Ultramarine"],storage:["128GB","256GB","512GB"]},
  "iphone 16 plus":{hero:"/phone-images/group-1237.webp",finishes:["Black","White","Pink","Teal","Ultramarine"],storage:["128GB","256GB","512GB"]},
  "iphone 16 pro":{hero:"/phone-images/group-1238.webp",finishes:["Black Titanium","White Titanium","Natural Titanium","Desert Titanium"],storage:["128GB","256GB","512GB","1TB"]},
  "iphone 16 pro max":{hero:"/phone-images/group-1239.webp",finishes:["Black Titanium","White Titanium","Natural Titanium","Desert Titanium"],storage:["256GB","512GB","1TB"]},
  "iphone 16e":{hero:"/phone-images/group-1240.webp",finishes:["Black","White"],storage:["128GB","256GB","512GB"]},
  "iphone 17":{hero:"/phone-images/group-1241.webp",finishes:["Black","White","Mist Blue","Sage","Lavender"],storage:["256GB","512GB"]},
  "iphone 17 plus":{hero:"/phone-images/group-1242.webp"},
  "iphone 17 pro":{hero:"/phone-images/group-1243.webp",finishes:["Cosmic Orange","Deep Blue","Silver"],storage:["256GB","512GB","1TB"]},
  "iphone 17 pro max":{hero:"/phone-images/group-1244.webp",finishes:["Cosmic Orange","Deep Blue","Silver"],storage:["256GB","512GB","1TB","2TB"]},
  "iphone 17e":{hero:"/phone-images/group-1245.webp",storage:["256GB","512GB"]},
  "iphone air":{hero:"/phone-images/group-1249.webp",finishes:["Space Black","Cloud White","Light Gold","Sky Blue"],storage:["256GB","512GB","1TB"]},
  "iphone 18 pro max":{hero:"/phone-images/group-1246.webp"},
  "iphone 18e":{hero:"/phone-images/group-1247.webp"}
});
const APPLE_IPHONE_FAMILIES=Object.keys(APPLE_IPHONE_FAMILY_MEDIA).sort((a,b)=>b.length-a.length);
function appleIphoneFamily(model){
  const m=normalize(model).replace(/^apple\s+/,"");
  return APPLE_IPHONE_FAMILIES.find(f=>m===f||m.startsWith(f+" "))||null;
}
function appleFamilyMedia(brand,model){
  if(normalize(brand)!=="apple")return null;
  const family=appleIphoneFamily(model);if(!family)return null;
  const base=APPLE_IPHONE_FAMILY_MEDIA[family];
  const exact=PHONE_RICH_MEDIA["apple|"+family];
  const hero=exact?.hero||base.hero;
  const finishes=exact?.finishes||base.finishes||[];
  const colors=(exact?.colors&&exact.colors.length)?exact.colors:finishMedia(hero,finishes);
  return cleanMedia({...base,...(exact||{}),hero,colors,finishes,source:"Canonical Apple iPhone family media"});

}

export function getPhoneRichMedia(brand,model){
  const apple=appleFamilyMedia(brand,model);if(apple&&(apple.hero||apple.colors.length||apple.views.length))return apple;
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
