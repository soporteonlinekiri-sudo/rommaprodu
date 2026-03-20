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

    const unitPrice = parseFloat(Number(total).toFixed(2));
    if (isNaN(unitPrice) || unitPrice <= 0) {
      return new Response(
        JSON.stringify({ error: "Precio invalido: " + total }),
        { status: 400, headers }
      );
    }

    const BASE_URL = "https://gestordereservas.pages.dev";

    const mpBody = {
      items: [{
        title: "Que Pena - La Guitarreada",          // Sin caracteres especiales
        description: `${cantidad} entrada${cantidad > 1 ? "s" : ""}`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: unitPrice,
      }],
      back_urls: {
        success: `${BASE_URL}/?pago=aprobado`,        // Con / antes de ?
        failure: `${BASE_URL}/?pago=rechazado`,
        pending: `${BASE_URL}/?pago=pendiente`,
      },
      auto_return: "approved",
      statement_descriptor: "QUE PENA",              // Corto y sin especiales
      external_reference: `QP-${Date.now()}`,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(mpBody),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      return new Response(
        JSON.stringify({ error: "Error MP", detail: data }),
        { status: mpRes.status, headers }
      );
    }

    return new Response(
      JSON.stringify({ id: data.id, init_point: data.init_point }),
      { status: 200, headers }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error interno: " + err.message }),
      { status: 500, headers }
    );
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
