#!/usr/bin/env node
/* Merge a JSON rich-media batch into src/data/phoneRichMedia.generated.json.
Input: node scripts/ingest-phone-media.mjs path/to/batch.json
Batch shape: [{brand,model,hero,colors:[{name,src}],views:[{name,src}]}]
*/
import fs from "node:fs";
const input=process.argv[2];if(!input)throw new Error("Provide a media batch JSON path");
const out="src/data/phoneRichMedia.generated.json";
const norm=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
const rows=JSON.parse(fs.readFileSync(input,"utf8"));
let db={};if(fs.existsSync(out))db=JSON.parse(fs.readFileSync(out,"utf8"));
for(const row of rows){if(!row.brand||!row.model)continue;const k=norm(row.brand)+"|"+norm(row.model).replace(new RegExp("^"+norm(row.brand)+"\\s+"),"");db[k]={hero:row.hero||null,colors:Array.isArray(row.colors)?row.colors.filter(x=>x?.name&&x?.src):[],views:Array.isArray(row.views)?row.views.filter(x=>x?.name&&x?.src):[]};}
fs.writeFileSync(out,JSON.stringify(db,null,2)+"\n");console.log("rich-media models:",Object.keys(db).length);
