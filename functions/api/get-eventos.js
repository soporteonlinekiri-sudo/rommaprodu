// functions/api/get-eventos.js
// Lee la lista de eventos desde Cloudflare KV

export async function onRequestGet({ env }) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  try {
    if (!env.CONFIG_KV) {
      return new Response(JSON.stringify([]), { status: 200, headers });
    }

    const data = await env.CONFIG_KV.get("qp_eventos");
    if (!data) {
      return new Response(JSON.stringify([]), { status: 200, headers });
    }

    return new Response(data, { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
