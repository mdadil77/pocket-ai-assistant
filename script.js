const chatBox = document.getElementById('chat-box');
const typingIndicator = document.getElementById('typing');
const stage = document.getElementById('avatar-stage');
const menu = document.getElementById('fab-menu');
const userInput = document.getElementById('user-input');
const modeLabel = document.getElementById('mode-label');

// Voice IDs — find your own on the ElevenLabs dashboard. The API key itself
// lives ONLY in api/tts.js on the server, never here.
const VOICES = {
  streetEn: 'EXAVITQu4vr4xnSDxMaL',
  streetHi: 'EXAVITQu4vr4xnSDxMaL',
  masti: 'pNInz6obpgDQGcFmaJgB'
};

const PROMPTS = {
  streetEn: "You are a blunt, street-smart AI buddy. Talk like a cheeky friend on the block. Keep it under 2 sentences. No slurs, just attitude.",
  streetHi: "Tu ek besharam, tapori AI dost hai. Hamesha casual, Hinglish mein baat kar. Reply sirf 2 lines mein. Gaali mat de, bas swag rakh.",
  masti: "You are a chill, funny friend from Hyderabad. Speak entirely in heavy Hyderabadi slang (baigan, ustad, potti, kirak). Keep it brief in Roman Urdu.",
  vision: "Explain what is happening in this image briefly, in a casual street-slang tone."
};

let currentMode = 'streetEn';
const modeLabels = { streetEn: 'Street EN', streetHi: 'Street HI/UR', masti: 'Masti Mode' };

// conversational memory
let chatHistory = [];

// ---------- AVATAR SELECTION ----------
function setAvatar(name) {
  document.querySelectorAll('.picker-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.avatar === name));
  select3DAvatar(name);
}

// ---------- TAP-TO-GESTURE (wave / wink / flying kiss) ----------
const gestureCycle = ['wave', 'wink', 'kiss'];
let gestureIndex = 0;
let menuTimeout;

function triggerGesture() {
  clearTimeout(menuTimeout);
  menu.classList.add('active');

  const gesture = gestureCycle[gestureIndex % gestureCycle.length];
  gestureIndex++;
  play3DGesture(gesture);

  startMenuCountdown();
}

function startMenuCountdown() {
  clearTimeout(menuTimeout);
  menuTimeout = setTimeout(() => menu.classList.remove('active'), 5000);
}

function executeCommand(mode) {
  clearTimeout(menuTimeout);
  menu.classList.remove('active');

  if (mode === 'vision') {
    document.getElementById('image-upload').click();
    return;
  }
  if (mode === 'street-en') currentMode = 'streetEn';
  else if (mode === 'street-hi') currentMode = 'streetHi';
  else if (mode === 'masti') currentMode = 'masti';

  modeLabel.textContent = modeLabels[currentMode];
  chatHistory = []; // fresh memory so personalities don't bleed together
}

// ---------- CHAT ----------
function addMessage(text, sender, extraClass = '') {
  const div = document.createElement('div');
  div.className = `msg ${sender}-msg ${extraClass}`.trim();
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendText() {
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = '';
  addMessage(text, 'user');

  chatHistory.push({ role: 'user', parts: [{ text }] });

  const sysPrompt = PROMPTS[currentMode];
  const reply = await askBackend(chatHistory, sysPrompt);
  chatHistory.push({ role: 'model', parts: [{ text: reply }] });

  const cssClass = currentMode === 'masti' ? 'masti' : 'street';
  addMessage(reply, 'ai', cssClass);
  speakWithElevenLabs(reply, VOICES[currentMode]);
}
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendText(); });

async function askBackend(historyArray, systemInstruction = null, base64Image = null, mimeType = null) {
  typingIndicator.style.display = 'block';
  try {
    const payload = { history: historyArray };
    if (base64Image) {
      const lastMsg = payload.history[payload.history.length - 1];
      lastMsg.parts.unshift({ inlineData: { mimeType, data: base64Image } });
    }
    if (systemInstruction) payload.systemInstruction = systemInstruction;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    typingIndicator.style.display = 'none';

    if (data.error) return 'SERVER ERROR: ' + data.error;
    return data.reply;
  } catch (err) {
    typingIndicator.style.display = 'none';
    return 'Connection error. Is your backend deployed?';
  }
}

// ---------- VOICE (via server proxy — key never touches the browser) ----------
async function speakWithElevenLabs(text, voiceId) {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId })
    });
    if (!response.ok) { console.log('TTS unavailable, skipping voice.'); return; }
    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
  } catch (error) {
    console.error('TTS error:', error);
  }
}

// ---------- VISION ----------
async function handleVisionUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  addMessage(`Analyzing image: ${file.name} 📷`, 'user');

  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64String = reader.result.split(',')[1];
    chatHistory.push({ role: 'user', parts: [{ text: PROMPTS.vision }] });
    const reply = await askBackend(chatHistory, PROMPTS.vision, base64String, file.type);
    chatHistory.push({ role: 'model', parts: [{ text: reply }] });

    addMessage(reply, 'ai', 'street');
    speakWithElevenLabs(reply, VOICES[currentMode]);
  };
  reader.readAsDataURL(file);
}