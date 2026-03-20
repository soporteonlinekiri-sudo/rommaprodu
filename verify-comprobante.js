export default async (request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 200, headers });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  try {
    const { imagen, montoEsperado } = await request.json();

    if (!imagen) return new Response(JSON.stringify({ error: "Falta imagen" }), { status: 400, headers });

    const ANTHROPIC_KEY = Netlify.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_KEY) return new Response(JSON.stringify({ error: "API key no configurada" }), { status: 500, headers });

    const prompt = `Sos un sistema de verificación de comprobantes de transferencia bancaria argentina.
Analizá esta imagen y respondé SOLO con un JSON con este formato exacto, sin texto adicional:
{
  "esComprobante": true o false,
  "monto": número o null,
  "destinatario": "texto o null",
  "confianza": número del 0 al 100,
  "motivo": "explicación breve en español"
}

Datos esperados:
- Monto: $${montoEsperado} ARS
- Destinatario posible: ROMMAPRODU, CVU 0000076500000000420178, o Agustín Fernández

Criterios:
- Si no es un comprobante de transferencia → esComprobante: false, confianza: 0
- Si el monto coincide exactamente y el destinatario coincide → confianza alta (90-100)
- Si el monto coincide pero no se ve el destinatario → confianza media (60-80)
- Si hay alguna diferencia → confianza baja (0-50)`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5-20251101",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imagen } },
            { type: "text", text: prompt }
          ]
        }]
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Error al analizar", detail: data }), { status: res.status, headers });
    }

    const text = data.content?.[0]?.text || "{}";
    let result;
    try { result = JSON.parse(text.replace(/```json|```/g, "").trim()); }
    catch { result = { esComprobante: false, confianza: 0, motivo: "No se pudo interpretar la respuesta" }; }

    return new Response(JSON.stringify(result), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Error interno: " + err.message }), { status: 500, headers });
  }
};

export const config = { path: "/api/verify-comprobante" };
