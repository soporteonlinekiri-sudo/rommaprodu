export default async function handler(req, res) {
  // CORS — responder siempre con estos headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nombre, email, telefono, cantidad, total } = req.body;

  if (!nombre || !email || !cantidad || !total) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: "Access token no configurado" });
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

  try {
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
      console.error("MP Error:", data);
      return res.status(mpRes.status).json({ error: "Error al crear preferencia", detail: data });
    }

    return res.status(200).json({
      id: data.id,
      init_point: data.init_point,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
