#!/usr/bin/env node
/*
Merge a validated exact-model rich-media batch into
src/data/phoneRichMedia.generated.json.

Usage: node scripts/ingest-phone-media.mjs path/to/batch.json

Each row:
{
  brand, model, hero,
  colors:[{name,src,sourceUrl?,license?,licenseUrl?,verifiedAt?}],
  views:[{name,src,sourceUrl?,license?,licenseUrl?,verifiedAt?}],
  source?, sourceUrl?, license?, licenseUrl?, verifiedAt?
}
*/
import fs from "node:fs";

const input=process.argv[2];
if(!input) throw new Error("Provide a media batch JSON path");
const out="src/data/phoneRichMedia.generated.json";
const norm=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
const validUrl=v=>typeof v==="string" && /^(https?:\/\/|\/)/.test(v.trim());
const allowedViews=new Set(["front view","back view","left side","right side","top view","bottom view","camera close up","in the box","front back","left right top bottom"]);
const rows=JSON.parse(fs.readFileSync(input,"utf8"));
if(!Array.isArray(rows)) throw new Error("Batch root must be an array");
let db={};
if(fs.existsSync(out)) db=JSON.parse(fs.readFileSync(out,"utf8"));
const batchKeys=new Set();

for(const [index,row] of rows.entries()){
  if(!row?.brand||!row?.model) throw new Error(`Row ${index}: brand and model are required`);
  const brand=norm(row.brand); let model=norm(row.model); if(model.startsWith(brand+" ")) model=model.slice(brand.length+1).trim();
  const key=`${brand}|${model}`;
  if(batchKeys.has(key)) throw new Error(`Row ${index}: duplicate physical model ${key}`);
  batchKeys.add(key);
  if(row.hero && !validUrl(row.hero)) throw new Error(`Row ${index}: invalid hero URL`);

  const colors=Array.isArray(row.colors)?row.colors:[];
  const views=Array.isArray(row.views)?row.views:[];
  const colorNames=new Set();
  const semanticUrlOwners=new Map();

  for(const [i,item] of colors.entries()){
    if(!item?.name||!validUrl(item?.src)) throw new Error(`Row ${index} color ${i}: name and valid src required`);
    const name=norm(item.name);
    if(colorNames.has(name)) throw new Error(`Row ${index}: duplicate color ${item.name}`);
    colorNames.add(name);
  }

  for(const [i,item] of views.entries()){
    if(!item?.name||!validUrl(item?.src)) throw new Error(`Row ${index} view ${i}: name and valid src required`);
    const label=norm(item.name);
    if(!allowedViews.has(label)) throw new Error(`Row ${index}: unsupported semantic view label '${item.name}'`);
    const previous=semanticUrlOwners.get(item.src);
    if(previous && previous!==label) throw new Error(`Row ${index}: one image URL cannot represent both '${previous}' and '${label}'`);
    semanticUrlOwners.set(item.src,label);
  }

  db[key]={
    hero:row.hero||null,
    colors,
    views,
    finishes:Array.isArray(row.finishes)?row.finishes:colors.map(x=>x.name),
    source:row.source||null,
    sourceUrl:row.sourceUrl||null,
    license:row.license||null,
    licenseUrl:row.licenseUrl||null,
    verifiedAt:row.verifiedAt||null
  };
}

fs.writeFileSync(out,JSON.stringify(db,null,2)+"\n");
console.log("rich-media models:",Object.keys(db).length);
