// functions/api/save-reservas.js
// Guarda las reservas de UN evento en Cloudflare KV
// Body: { evId: string, reservas: array }
// CRÍTICO: usa una clave separada por evento — las reservas NUNCA se borran ni se mezclan

export async function onRequestPost({ request, env }) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    if (!env.CONFIG_KV) {
      return new Response(
        JSON.stringify({ error: "KV no configurado. Agregá el binding CONFIG_KV en Cloudflare." }),
        { status: 500, headers }
      );
    }

    const body = await request.json();
    const { evId, reservas } = body;

    if (!evId || !Array.isArray(reservas)) {
      return new Response(
        JSON.stringify({ error: "Body debe tener evId (string) y reservas (array)" }),
        { status: 400, headers }
      );
    }

    // Clave única por evento — garantiza aislamiento total
    const key = "qp_r_" + evId;
    await env.CONFIG_KV.put(key, JSON.stringify(reservas));

    return new Response(JSON.stringify({ ok: true, evId, count: reservas.length }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
