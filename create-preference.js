export default async function handler(req, res) {
  // Forzar CORS en cada respuesta
  res.setHeader("Access-Control-Allow-Origin", "https://rommaprodu-npko-git-main-agustins-projects-0bded454.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nombre, email, telefono, cantidad, total } = req.body || {};

  if (!nombre || !email || !cantidad || !total) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: "Token no configurado" });
  }

  const BASE_URL = "https://rommaprodu-npko-git-main-agustins-projects-0bded454.vercel.app";

  try {
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
    if (!mpRes.ok) return res.status(mpRes.status).json({ error: "Error MP", detail: data });
    return res.status(200).json({ id: data.id, init_point: data.init_point });

  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
}
