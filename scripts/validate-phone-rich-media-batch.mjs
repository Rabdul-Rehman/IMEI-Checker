#!/usr/bin/env node
/**
 * Validate rich-media batches before ingestion.
 * Usage: node scripts/validate-phone-rich-media-batch.mjs batch.json
 * Rejects duplicate/mislabeled media inside a model and requires exact identity.
 */
import fs from "node:fs";
const p=process.argv[2]; if(!p) throw new Error("Provide batch JSON");
const rows=JSON.parse(fs.readFileSync(p,"utf8"));
const norm=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
let errors=[];
for(const [i,row] of rows.entries()){
  if(!norm(row.brand)||!norm(row.model)) errors.push(`row ${i}: missing brand/model`);
  const slots=[...(row.colors||[]).map(x=>["color",x]),...(row.views||[]).map(x=>["view",x])];
  const seenSrc=new Map(), seenLabel=new Set();
  for(const [kind,x] of slots){
    if(!x?.name||!x?.src){errors.push(`row ${i}: incomplete ${kind}`);continue;}
    const label=kind+":"+norm(x.name);
    if(seenLabel.has(label)) errors.push(`row ${i}: duplicate label ${label}`);
    seenLabel.add(label);
    if(seenSrc.has(x.src)) errors.push(`row ${i}: same image reused for ${seenSrc.get(x.src)} and ${label}`);
    else seenSrc.set(x.src,label);
  }
}
if(errors.length){console.error(errors.join("\n"));process.exit(1)}
console.log(`OK: ${rows.length} exact-model rich-media records validated`);
