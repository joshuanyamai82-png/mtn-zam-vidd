export default function handler(req, res) {
  res.json({ ok: true, ts: Date.now() });
}