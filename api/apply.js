import { validateWholeApplication } from './_validate.js';

function makeRef(){
  const year = new Date().getFullYear();
  return `TL-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default async function handler(req, res){
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
    const body = req.body || {};
    const result = validateWholeApplication(body);
    if (!result.ok){
      return res.status(400).json({ ok: false, errors: result.errors });
    }
    // In a real system you'd persist this. For the demo we just return a reference.
    const ref = makeRef();
    console.log(`[apply] received application ${ref}`);
    return res.json({ ok: true, ref });
  } catch (err){
    console.error('[apply] crashed:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}