export interface Env {
  MY_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS — lock this down to your actual domain in production
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Query params
    const prefix = url.searchParams.get("prefix") ?? "";   // "folder/subfolder/"
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

    try {
      const listed = await env.MY_BUCKET.list({
        prefix,
        delimiter: "/",   // treat "/" as a directory separator
        cursor,
        limit,
      });

      const body = {
        // "Files" at this level
        objects: listed.objects.map((obj) => ({
          key:          obj.key,
          size:         obj.size,
          lastModified: obj.uploaded,
          etag:         obj.etag,
        })),
        // "Directories" at this level (common prefixes)
        directories: listed.delimitedPrefixes,
        // Pagination
        nextCursor:   listed.truncated ? listed.cursor : null,
        truncated:    listed.truncated,
      };

      return new Response(JSON.stringify(body), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};