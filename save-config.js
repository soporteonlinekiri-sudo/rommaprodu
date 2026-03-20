// functions/api/save-config.js
// Guarda la configuración del evento en Cloudflare KV
// KV Binding: CONFIG_KV (configurar en Cloudflare Dashboard > Settings > Bindings)

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

    // Guardar en KV (sin TTL = persiste indefinidamente)
    await env.CONFIG_KV.put("qp_config", JSON.stringify(body));

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
