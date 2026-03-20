export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imagen, montoEsperado } = req.body;
    if (!imagen) return res.status(400).json({ error: "Falta imagen" });

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) return res.status(500).json({ error: "API key no configurada" });

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

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
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

    const data = await aiRes.json();
    if (!aiRes.ok) return res.status(aiRes.status).json({ error: "Error IA", detail: data });

    const text = data.content?.[0]?.text || "{}";
    let result;
    try { result = JSON.parse(text.replace(/```json|```/g, "").trim()); }
    catch { result = { esComprobante: false, confianza: 0, motivo: "No se pudo interpretar" }; }

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: "Error interno: " + err.message });
  }
}
