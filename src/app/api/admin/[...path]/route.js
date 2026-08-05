import { NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ||
  "http://localhost:8000";

const ADMIN_API_KEY =
  process.env.ADMIN_API_KEY;

async function handler(request, { params }) {
  try {
    const { path } = await params;

    const targetUrl =
      `${API_URL}/api/v1/admin/${path.join("/")}`;

    const headers = {
      Authorization:
        `Bearer ${ADMIN_API_KEY}`,
    };

    /*
     * Forward Content-Type when a request has a body.
     */
    const contentType =
      request.headers.get(
        "content-type"
      );

    if (contentType) {
      headers["Content-Type"] =
        contentType;
    }

    /*
     * GET/DELETE don't normally need a body.
     *
     * POST/PATCH/PUT do.
     */
    const hasBody =
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      request.method !== "DELETE";

    const body = hasBody
      ? await request.text()
      : undefined;

    const response = await fetch(
      targetUrl,
      {
        method: request.method,

        headers,

        body,

        cache: "no-store",
      }
    );

    const data =
      await response.text();

    return new NextResponse(
      data,
      {
        status:
          response.status,

        headers: {
          "Content-Type":
            response.headers.get(
              "content-type"
            ) ||
            "application/json",
        },
      }
    );

  } catch (error) {

    console.error(
      "Admin proxy error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Admin proxy failed",
      },
      {
        status: 500,
      }
    );
  }
}


export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};