#!/usr/bin/env node
import fs from "node:fs";
const src=fs.readFileSync("src/data/phoneRichMedia.js","utf8");
const models=[...src.matchAll(/^\s*"([^"]+\|[^"]+)":\s*\{/gm)].map(m=>m[1]);
const report={generatedAt:new Date().toISOString(),richMediaModels:models.length,models};
fs.mkdirSync("reports",{recursive:true});
fs.writeFileSync("reports/rich-media-coverage.json",JSON.stringify(report,null,2)+"\n");
console.log(`rich-media exact models: ${models.length}`);
