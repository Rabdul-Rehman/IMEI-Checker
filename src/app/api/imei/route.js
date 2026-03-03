import { NextResponse } from "next/server";
import { Pool } from "pg";

// 🔑 Postgres connection
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5433,
});

// 🔧 Helper: make slug from brand + name
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")        // spaces → -
    .replace(/[^\w\-]+/g, "")    // remove non-word chars
    .replace(/\-\-+/g, "-")      // collapse --
    .replace(/^-+/, "")          // trim start -
    .replace(/-+$/, "");         // trim end -
}

// 🎯 Levenshtein distance for string similarity
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// 🔍 Calculate similarity score (0-1, higher is better)
function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
}

// 🎯 Find closest matches using multiple strategies
async function findClosestMatch(targetSlug, brand, name) {
  const strategies = [
    // Strategy 1: Partial slug match with ILIKE
    {
      name: "partial_slug",
      query: `
        SELECT p.model_name, p.slug, p.specs_json, b.name as brand,
               'partial_slug' as match_type
        FROM phones p
        JOIN brands b ON p.brand_id = b.brand_id
        WHERE p.slug ILIKE $1 OR $1 ILIKE '%' || p.slug || '%'
        LIMIT 10
      `,
      params: [`%${targetSlug}%`]
    },
    
    // Strategy 2: Brand + model name fuzzy match
    {
      name: "brand_model",
      query: `
        SELECT p.model_name, p.slug, p.specs_json, b.name as brand,
               'brand_model' as match_type
        FROM phones p
        JOIN brands b ON p.brand_id = b.brand_id
        WHERE LOWER(b.name) ILIKE $1 
        AND (LOWER(p.model_name) ILIKE $2 OR LOWER(p.slug) ILIKE $2)
        LIMIT 10
      `,
      params: [`%${brand.toLowerCase()}%`, `%${name.toLowerCase()}%`]
    },
    
    // Strategy 3: Individual words match
    {
      name: "word_match",
      query: `
        SELECT p.model_name, p.slug, p.specs_json, b.name as brand,
               'word_match' as match_type
        FROM phones p
        JOIN brands b ON p.brand_id = b.brand_id
        WHERE p.slug ~ $1
        LIMIT 15
      `,
      params: [targetSlug.split('-').filter(word => word.length > 2).join('|')]
    }
  ];

  const allMatches = [];
  
  for (const strategy of strategies) {
    try {
      const result = await pool.query(strategy.query, strategy.params);
      allMatches.push(...result.rows.map(row => ({
        ...row,
        strategy: strategy.name
      })));
    } catch (err) {
      console.error(`Strategy ${strategy.name} failed:`, err.message);
    }
  }

  // Remove duplicates and calculate similarity scores
  const uniqueMatches = new Map();
  
  allMatches.forEach(match => {
    if (!uniqueMatches.has(match.slug)) {
      const similarity = calculateSimilarity(targetSlug, match.slug);
      
      // Boost score for exact brand match
      const brandSimilarity = calculateSimilarity(
        brand.toLowerCase(), 
        match.brand.toLowerCase()
      );
      
      // Boost score for model name similarity
      const nameSimilarity = calculateSimilarity(
        name.toLowerCase().replace(/\s+/g, '-'),
        match.model_name.toLowerCase().replace(/\s+/g, '-')
      );
      
      const finalScore = (similarity * 0.4) + (brandSimilarity * 0.3) + (nameSimilarity * 0.3);
      
      uniqueMatches.set(match.slug, {
        ...match,
        similarity_score: finalScore,
        slug_similarity: similarity,
        brand_similarity: brandSimilarity,
        name_similarity: nameSimilarity
      });
    }
  });

  // Sort by similarity score and return top matches
  return Array.from(uniqueMatches.values())
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 5);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imei = searchParams.get("imei") || "";

  console.log("Incoming IMEI request:", imei);

  // basic IMEI validation
  if (imei.length !== 15 || !/^\d{15}$/.test(imei)) {
    return NextResponse.json(
      { success: false, error: "Invalid IMEI provided." },
      { status: 400 }
    );
  }

  const apiKey = "5CA3-B1F9-07ED-D8E3-35A4-16RW";
  const apiUrl = `https://alpha.imeicheck.com/api/free_with_key/modelBrandName?key=${apiKey}&imei=${imei}&format=json`;

  try {
    // Step 1: Fetch external API
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`External API error: ${res.status} ${res.statusText}`);
    }

    const apiData = await res.json();
    console.log("📡 External API Response:", apiData);

    if (!apiData || apiData.error || !apiData.result) {
      return NextResponse.json(
        { success: false, error: "No IMEI result found." },
        { status: 404 }
      );
    }

    // Step 2: Parse brand + name from API "result" string
    let brand = "";
    let name = "";
    apiData.result.split("<br>").forEach((line) => {
      const [key, value] = line.split(":").map((s) => s.trim());
      if (key && value) {
        if (key.toLowerCase().includes("brand")) brand = value;
        if (key.toLowerCase().includes("model name")) name = value;
      }
    });

    const slug = slugify(`${brand}-${name}`);
    console.log("📝 Parsed brand:", brand, "name:", name, "slug:", slug);

    // Step 3: Check DB for exact matching slug
    const exactQuery = `
      SELECT p.model_name, p.slug, p.specs_json, b.name as brand
      FROM phones p
      JOIN brands b ON p.brand_id = b.brand_id
      WHERE p.slug = $1
    `;
    const exactResult = await pool.query(exactQuery, [slug]);

    let localData = exactResult.rows.length > 0 ? exactResult.rows[0] : null;
    let matchType = 'exact';
    let closestMatches = [];

    // Step 4: If no exact match, find closest matches
    if (!localData && brand && name) {
      console.log("🔍 No exact match found, searching for similar matches...");
      
      closestMatches = await findClosestMatch(slug, brand, name);
      
      if (closestMatches.length > 0) {
        localData = closestMatches[0]; // Best match
        matchType = 'fuzzy';
        console.log(`✨ Found ${closestMatches.length} similar matches. Best: ${localData.slug} (score: ${localData.similarity_score?.toFixed(3)})`);
      }
    }

    // Always prepare external data
    const externalData = {
      brand,
      name,
      slug,
      model: apiData.object?.model || null,
    };
    
    const response = {
      success: true,
      imei,
      match_type: matchType,
      local: localData,
      external: externalData,
    };

    // Include closest matches if fuzzy matching was used
    if (matchType === 'fuzzy' && closestMatches.length > 1) {
      response.alternative_matches = closestMatches.slice(1).map(match => ({
        model_name: match.model_name,
        slug: match.slug,
        brand: match.brand,
        similarity_score: match.similarity_score?.toFixed(3),
        strategy: match.strategy
      }));
    }
    
    return NextResponse.json(response);
    
  } catch (err) {
    console.error("🔥 Error in route:", err.message);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data." },
      { status: 500 }
    );
  }
}