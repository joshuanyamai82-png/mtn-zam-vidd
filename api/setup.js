export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: 'Missing TELEGRAM_BOT_TOKEN' });

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = `${proto}://${host}/api/telegram`;

  const r = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(url)}`
  );
  const data = await r.json();

  res.json({
    webhookUrl: url,
    telegramSays: data,
    next: 'Now send /start to your bot in Telegram to see your chat ID.',
  });
}