export async function onRequestPost({ request, env }) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const { imagen, montoEsperado, mediaType } = await request.json();
    if (!imagen) return new Response(JSON.stringify({ error: "Falta imagen" }), { status: 400, headers });

    const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) return new Response(JSON.stringify({ error: "API key no configurada" }), { status: 500, headers });

    // Detectar tipo de imagen — usar el que manda el cliente o inferir del base64
    const imgMediaType = mediaType || "image/jpeg";

    const prompt = `Sos un sistema de verificacion de comprobantes de transferencia bancaria argentina.
Analiza esta imagen y responde SOLO con un JSON con este formato exacto, sin texto adicional:
{
  "esComprobante": true o false,
  "monto": numero o null,
  "destinatario": "texto o null",
  "confianza": numero del 0 al 100,
  "motivo": "explicacion breve en espanol"
}

Datos esperados:
- Monto: $${montoEsperado} ARS
- Destinatario posible: ROMMAPRODU, CVU 0000076500000000420178, o Agustin Fernandez

Criterios:
- Si no es un comprobante valido → esComprobante: false, confianza: 0
- Monto y destinatario coinciden → confianza 90-100
- Solo monto coincide → confianza 60-80
- Diferencias significativas → confianza 0-50`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: imgMediaType, data: imagen } },
            { type: "text", text: prompt }
          ]
        }]
      })
    });

    const data = await aiRes.json();
    if (!aiRes.ok) return new Response(JSON.stringify({ error: "Error IA", detail: data }), { status: aiRes.status, headers });

    const text = (data.content && data.content[0] && data.content[0].text) || "{}";
    var result;
    try { result = JSON.parse(text.replace(/```json|```/g, "").trim()); }
    catch(e) { result = { esComprobante: false, confianza: 0, motivo: "No se pudo interpretar la respuesta" }; }

    return new Response(JSON.stringify(result), { status: 200, headers });

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
