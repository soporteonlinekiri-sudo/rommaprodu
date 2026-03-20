export async function onRequestPost({ request, env }) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const { nombre, email, telefono, cantidad, total } = await request.json();

    if (!nombre || !email || !cantidad || !total) {
      return new Response(JSON.stringify({ error: "Faltan datos" }), { status: 400, headers });
    }

    const ACCESS_TOKEN = env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Token no configurado" }), { status: 500, headers });
    }

    const BASE_URL = "https://rommaprodu.pages.dev";

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          title: "¡Qué Peña! — La Guitarreada",
          description: `${cantidad} entrada${cantidad > 1 ? "s" : ""} · Sábado 18/04`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: Number(total),
        }],
        payer: { name: nombre, email, phone: { number: String(telefono) } },
        back_urls: {
          success: `${BASE_URL}?pago=aprobado`,
          failure: `${BASE_URL}?pago=rechazado`,
          pending: `${BASE_URL}?pago=pendiente`,
        },
        auto_return: "approved",
        statement_descriptor: "QUE PENA GUITARREADA",
        external_reference: `QP-${Date.now()}`,
      }),
    });

    const data = await mpRes.json();
    if (!mpRes.ok) return new Response(JSON.stringify({ error: "Error MP", detail: data }), { status: mpRes.status, headers });

    return new Response(JSON.stringify({ id: data.id, init_point: data.init_point }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Error interno: " + err.message }), { status: 500, headers });
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
