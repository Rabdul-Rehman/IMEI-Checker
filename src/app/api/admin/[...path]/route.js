import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables");
  return createClient(url, key);
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

function startOfDay(daysAgo = 0) {
  const d = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,"0")).join("");
}

function randomHex(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map(b => b.toString(16).padStart(2,"0")).join("");
}

export async function GET(request, { params }) {
  try {
    const supabase = getSupabase();
    const path = (await params).path || [];
    const url = new URL(request.url);

    if (path.length === 1 && path[0] === "overview") {
      const [
        apiKeysResult,
        activeKeysResult,
        requestsResult,
        todayResult,
        monthResult,
        phonesResult,
        brandsResult,
        performanceResult,
      ] = await Promise.all([
        supabase.from("api_keys").select("*",{count:"exact",head:true}),
        supabase.from("api_keys").select("*",{count:"exact",head:true}).eq("is_active",true),
        supabase.from("api_requests").select("*",{count:"exact",head:true}),
        supabase.from("api_requests").select("*",{count:"exact",head:true}).gte("created_at",startOfDay().toISOString()),
        supabase.from("api_requests").select("*",{count:"exact",head:true}).gte("created_at",new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString()),
        supabase.from("phones").select("*",{count:"exact",head:true}),
        supabase.from("brands").select("*",{count:"exact",head:true}),
        supabase.from("api_requests").select("response_time_ms,status_code").not("response_time_ms","is",null).limit(10000),
      ]);

      const failed = [apiKeysResult,activeKeysResult,requestsResult,todayResult,monthResult,phonesResult,brandsResult,performanceResult].find(x=>x.error);
      if (failed) throw failed.error;

      const rows = performanceResult.data || [];
      const times = rows.map(r=>Number(r.response_time_ms)).filter(Number.isFinite);
      const avg = times.length ? Math.round(times.reduce((a,b)=>a+b,0)/times.length) : 0;
      const errors = rows.filter(r=>Number(r.status_code)>=400).length;

      return json({success:true,data:{
        requests:{total:requestsResult.count||0,today:todayResult.count||0,this_month:monthResult.count||0,errors},
        api_keys:{total:apiKeysResult.count||0,active:activeKeysResult.count||0},
        database:{phones:phonesResult.count||0,brands:brandsResult.count||0},
        performance:{average_response_time_ms:avg}
      }});
    }

    if (path.length === 1 && path[0] === "recent-requests") {
      const {data: requests, error} = await supabase
        .from("api_requests")
        .select("id,api_key_id,method,endpoint,status_code,response_time_ms,ip_address,user_agent,created_at")
        .order("created_at",{ascending:false})
        .limit(20);
      if (error) throw error;

      const ids = [...new Set((requests||[]).map(r=>r.api_key_id).filter(Boolean))];
      let keys = [];
      if (ids.length) {
        const res = await supabase.from("api_keys").select("id,name,key_prefix").in("id",ids);
        if (!res.error) keys = res.data || [];
      }
      const map = new Map(keys.map(k=>[String(k.id),k]));
      return json({success:true,data:(requests||[]).map(r=>({...r,api_key:map.get(String(r.api_key_id))||null}))});
    }

    if (path.length === 1 && path[0] === "api-keys") {
      const {data,error} = await supabase.from("api_keys")
        .select("id,name,key_prefix,is_active,requests_count,daily_limit,created_at,last_used_at")
        .order("created_at",{ascending:false});
      if (error) throw error;
      return json({success:true,data:data||[]});
    }

    if (path.length === 1 && path[0] === "analytics") {
      const days = Math.min(Math.max(Number(url.searchParams.get("days"))||7,1),30);
      const since = startOfDay(days-1).toISOString();
      const {data,error} = await supabase.from("api_requests")
        .select("endpoint,status_code,created_at")
        .gte("created_at",since)
        .order("created_at",{ascending:true})
        .limit(10000);
      if (error) throw error;

      const dayMap = new Map();
      for (let i=days-1;i>=0;i--) {
        const d = startOfDay(i);
        const key = d.toISOString().slice(0,10);
        dayMap.set(key,{date:key,label:d.toLocaleDateString("en-US",{weekday:"short"}),requests:0});
      }
      const endpointMap = new Map();
      const statusMap = new Map();
      for (const row of data||[]) {
        const dk = new Date(row.created_at).toISOString().slice(0,10);
        if (dayMap.has(dk)) dayMap.get(dk).requests++;
        const ep = row.endpoint || "unknown";
        endpointMap.set(ep,(endpointMap.get(ep)||0)+1);
        const st = String(row.status_code||0);
        statusMap.set(st,(statusMap.get(st)||0)+1);
      }
      return json({success:true,data:{
        days:[...dayMap.values()],
        endpoints:[...endpointMap.entries()].map(([endpoint,requests])=>({endpoint,requests})).sort((a,b)=>b.requests-a.requests).slice(0,10),
        statuses:[...statusMap.entries()].map(([status,requests])=>({status,requests})).sort((a,b)=>Number(a.status)-Number(b.status))
      }});
    }

    if (path.length === 2 && path[0] === "devices" && path[1] === "brands") {
      const {data,error} = await supabase.from("brands").select("brand_id,name").order("name");
      if (error) throw error;
      return json({success:true,data:data||[]});
    }

    if (path.length === 1 && path[0] === "devices") {
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit"))||15,1),100);
      const offset = Math.max(Number(url.searchParams.get("offset"))||0,0);
      const search = (url.searchParams.get("search")||"").trim();

      let q = supabase.from("phones").select(
        "phone_id,model_name,slug,brand_id,created_at,images,specs_json,brands(brand_id,name)",
        {count:"exact"}
      );
      if (search) q = q.ilike("model_name",`%${search}%`);
      const {data,error,count} = await q.order("created_at",{ascending:false}).range(offset,offset+limit-1);
      if (error) throw error;
      return json({success:true,pagination:{total:count||0,limit,offset},data:data||[]});
    }

    return json({success:false,error:"Not found"},404);
  } catch (error) {
    console.error("Admin GET error",error);
    return json({success:false,error:error?.message||"Admin request failed"},500);
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = getSupabase();
    const path = (await params).path || [];
    const body = await request.json();

    if (path.length === 1 && path[0] === "api-keys") {
      const name = String(body?.name||"").trim();
      if (!name) return json({success:false,error:"API key name is required"},400);
      const limit = body?.daily_limit==null || body.daily_limit==="" ? null : Number(body.daily_limit);
      if (limit!==null && (!Number.isInteger(limit)||limit<1||limit>1000000)) {
        return json({success:false,error:"Daily limit must be between 1 and 1,000,000, or null for unlimited"},400);
      }

      const apiKey = "imei_live_" + randomHex(32);
      const keyHash = await sha256(apiKey);
      const keyPrefix = apiKey.substring(0,18);

      const {data,error} = await supabase.from("api_keys").insert({
        name,key_hash:keyHash,key_prefix:keyPrefix,is_active:true,requests_count:0,daily_limit:limit
      }).select("id,name,key_prefix,is_active,requests_count,daily_limit,created_at,last_used_at").single();
      if (error) throw error;

      return json({success:true,message:"API key created. Save this key now because it will not be shown again.",data:{api_key:apiKey,key:data}},201);
    }

    if (path.length === 1 && path[0] === "devices") {
      const brand_id = body?.brand_id;
      const model_name = String(body?.model_name||"").trim();
      const slug = String(body?.slug||"").trim();
      if (!brand_id) return json({success:false,error:"Brand is required"},400);
      if (!model_name) return json({success:false,error:"Model name is required"},400);
      if (!slug) return json({success:false,error:"Slug is required"},400);

      let specs_json = {};
      if (body?.specs_json && String(body.specs_json).trim()) {
        try { specs_json = JSON.parse(body.specs_json); }
        catch { return json({success:false,error:"Specs JSON is not valid JSON"},400); }
      }

      const images = Array.isArray(body?.images) ? body.images.map(x=>x?.name).filter(Boolean) : [];
      const {data,error} = await supabase.from("phones").insert({brand_id,model_name,slug,specs_json,images})
        .select("phone_id,model_name,slug,brand_id,created_at,brands(brand_id,name)").single();
      if (error) {
        if (error.code==="23505") return json({success:false,error:"A device with this slug already exists"},400);
        throw error;
      }
      return json({success:true,message:"Device created",data},201);
    }

    return json({success:false,error:"Not found"},404);
  } catch (error) {
    console.error("Admin POST error",error);
    return json({success:false,error:error?.message||"Admin request failed"},500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const supabase = getSupabase();
    const path = (await params).path || [];
    const body = await request.json();

    if (path.length === 2 && path[0] === "api-keys") {
      const id = path[1];
      const updates = {};
      if (body?.name !== undefined) {
        const name = String(body.name).trim();
        if (!name) return json({success:false,error:"Name cannot be empty"},400);
        updates.name = name;
      }
      if (body?.daily_limit !== undefined) {
        const limit = body.daily_limit===null || body.daily_limit==="" ? null : Number(body.daily_limit);
        if (limit!==null && (!Number.isInteger(limit)||limit<1||limit>1000000)) {
          return json({success:false,error:"Daily limit must be between 1 and 1,000,000, or null"},400);
        }
        updates.daily_limit = limit;
      }
      if (body?.is_active !== undefined) updates.is_active = Boolean(body.is_active);

      const {data,error} = await supabase.from("api_keys").update(updates).eq("id",id)
        .select("id,name,key_prefix,is_active,requests_count,daily_limit,created_at,last_used_at").single();
      if (error) throw error;
      return json({success:true,message:"API key updated",data});
    }

    if (path.length === 2 && path[0] === "devices") {
      const id = path[1];
      const updates = {};
      if (body?.brand_id !== undefined) updates.brand_id = body.brand_id;
      if (body?.model_name !== undefined) {
        const v = String(body.model_name).trim();
        if (!v) return json({success:false,error:"Model name cannot be empty"},400);
        updates.model_name = v;
      }
      if (body?.slug !== undefined) {
        const v = String(body.slug).trim();
        if (!v) return json({success:false,error:"Slug cannot be empty"},400);
        updates.slug = v;
      }
      if (body?.specs_json !== undefined) {
        try { updates.specs_json = body.specs_json && String(body.specs_json).trim() ? JSON.parse(body.specs_json) : {}; }
        catch { return json({success:false,error:"Specs JSON is not valid JSON"},400); }
      }
      if (Array.isArray(body?.images) && body.images.length) {
        updates.images = body.images.map(x=>x?.name).filter(Boolean);
      }

      const {data,error} = await supabase.from("phones").update(updates).eq("phone_id",id)
        .select("phone_id,model_name,slug,brand_id,created_at,brands(brand_id,name)").single();
      if (error) {
        if (error.code==="23505") return json({success:false,error:"A device with this slug already exists"},400);
        throw error;
      }
      return json({success:true,message:"Device updated",data});
    }

    return json({success:false,error:"Not found"},404);
  } catch (error) {
    console.error("Admin PATCH error",error);
    return json({success:false,error:error?.message||"Admin request failed"},500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = getSupabase();
    const path = (await params).path || [];

    if (path.length === 2 && path[0] === "api-keys") {
      const {data,error} = await supabase.from("api_keys").update({is_active:false}).eq("id",path[1])
        .select("id,name,key_prefix,is_active,requests_count,daily_limit,created_at,last_used_at").single();
      if (error) throw error;
      return json({success:true,message:"API key revoked",data});
    }

    if (path.length === 2 && path[0] === "devices") {
      const {error} = await supabase.from("phones").delete().eq("phone_id",path[1]);
      if (error) {
        if (error.code==="23503") return json({success:false,error:"This device has related data and cannot be deleted yet."},409);
        throw error;
      }
      return json({success:true,message:"Device deleted"});
    }

    return json({success:false,error:"Not found"},404);
  } catch (error) {
    console.error("Admin DELETE error",error);
    return json({success:false,error:error?.message||"Admin request failed"},500);
  }
}
