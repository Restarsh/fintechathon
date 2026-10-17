export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { q, ctx } = req.body || {};
  if (typeof q !== "string" || !q.trim() || q.length > 2000) {
    return res.status(400).json({ error: "Invalid question" });
  }
  if (typeof ctx !== "string") {
    return res.status(400).json({ error: "Invalid context" });
  }
  const systemPrompt = `You are StudentPay AI, a friendly educational assistant for international students.
Use the student's data below to give concise guidance on transfers, fees, budgeting and saving.
Keep answers under 150 words. Never claim to execute payments. Not financial advice.
If data is missing, say so and suggest which tab to use.

STUDENT DATA:
${ctx.slice(0, 4000)}`;
  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://studentpay-ai.vercel.app",
        "X-Title": "StudentPay AI"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: q.trim() }
        ],
        max_tokens: 320,
        temperature: 0.4
      })
    });
    if (!upstream.ok) {
      console.error("OpenRouter error", upstream.status, await upstream.text());
      return res.status(502).json({ error: "AI service unavailable" });
    }
    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return res.status(502).json({ error: "Empty AI response" });
    res.status(200).json({ text });
  } catch (err) {
    console.error("AI proxy error", err);
    res.status(500).json({ error: "Internal error" });
  }
}
