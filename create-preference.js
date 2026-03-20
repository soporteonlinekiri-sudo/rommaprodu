export default async (request, context) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const { nombre, email, telefono, cantidad, total } = await request.json();

    if (!nombre || !email || !cantidad || !total) {
      return new Response(JSON.stringify({ error: "Faltan datos requeridos" }), { status: 400, headers });
    }

    const ACCESS_TOKEN = Netlify.env.get("MP_ACCESS_TOKEN");
    if (!ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Access token no configurado" }), { status: 500, headers });
    }

    const BASE_URL = "https://compratuentrada.netlify.app";

    const preference = {
      items: [{
        title: "¡Qué Peña! — La Guitarreada",
        description: `Derecho de espectáculo · ${cantidad} entrada${cantidad > 1 ? "s" : ""} · Sábado 18/04`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: Number(total),
      }],
      payer: {
        name: nombre,
        email: email,
        phone: { number: String(telefono) },
      },
      back_urls: {
        success: `${BASE_URL}?pago=aprobado`,
        failure: `${BASE_URL}?pago=rechazado`,
        pending: `${BASE_URL}?pago=pendiente`,
      },
      auto_return: "approved",
      statement_descriptor: "QUE PENA GUITARREADA",
      external_reference: `QP-${Date.now()}`,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      return new Response(JSON.stringify({ error: "Error al crear preferencia", detail: data }), { status: mpRes.status, headers });
    }

    return new Response(JSON.stringify({ id: data.id, init_point: data.init_point }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers });
  }
};

export const config = { path: "/api/create-preference" };
