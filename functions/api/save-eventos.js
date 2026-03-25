// functions/api/save-eventos.js
// Guarda la lista de eventos en Cloudflare KV

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
    // body debe ser un array de eventos
    await env.CONFIG_KV.put("qp_eventos", JSON.stringify(body));

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
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
