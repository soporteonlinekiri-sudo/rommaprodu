// functions/api/get-reservas.js
// Lee las reservas de UN evento desde Cloudflare KV
// Query param: evId (ID del evento)
// Las reservas de cada evento se guardan en una clave separada: qp_r_EVT-xxx
// Esto garantiza que las reservas de cada evento NUNCA se borren ni mezclen

export async function onRequestGet({ request, env }) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  try {
    const url = new URL(request.url);
    const evId = url.searchParams.get("evId");

    if (!evId) {
      return new Response(JSON.stringify({ error: "Falta el parámetro evId" }), { status: 400, headers });
    }

    if (!env.CONFIG_KV) {
      return new Response(JSON.stringify([]), { status: 200, headers });
    }

    const key = "qp_r_" + evId;
    const data = await env.CONFIG_KV.get(key);
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
