export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // CHANGE THIS to your deployed URL in production
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) return res.status(500).json({ error: 'Server TTS key is missing!' });

  try {
    const { text, voiceId } = req.body;
    if (!text || !voiceId) return res.status(400).json({ error: 'text and voiceId are required' });

    const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // handles English / Hindi / Urdu
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({ error: errText });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(arrayBuffer));

  } catch (error) {
    res.status(500).json({ error: 'TTS proxy failed' });
  }
}