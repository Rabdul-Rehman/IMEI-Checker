import { NextResponse } from "next/server";
import { queryLocalPhones } from "../../lib/localPhoneCatalog";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 100, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const { total, data } = queryLocalPhones({
    search: searchParams.get("search") || "",
    offset,
    limit,
  });

  return NextResponse.json({
    success: true,
    pagination: { total, limit, offset },
    data,
  });
}