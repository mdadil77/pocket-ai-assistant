export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // CHANGE THIS to your deployed URL in production
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server API key is missing!' });

  try {
    const { history, systemInstruction } = req.body;

    const payload = {
      contents: history,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }
    );
    clearTimeout(timeout);
    const data = await response.json();

    if (data.error) return res.status(500).json({ error: data.error.message });

    const replyText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply: replyText });

  } catch (error) {
    const message = error.name === 'AbortError' ? 'AI brain took too long.' : 'Failed connection.';
    res.status(500).json({ error: message });
  }
}