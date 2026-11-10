import { kv } from '../_kv.js';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  const entry = await kv.get(`gate:${id}`);
  if (!entry) {
    return res.status(404).json({ error: 'Not found or expired' });
  }

  res.json({
    status: entry.status,
    gate: entry.gate,
    ref: entry.ref,
    decidedAt: entry.decidedAt,
  });
}