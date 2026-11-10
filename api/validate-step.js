import {
  validateLoan, validatePersonal, validateIncome, validateAgreement
} from './_validate.js';

export default async function handler(req, res){
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, errors: { _: 'Method not allowed' } });
    }
    const { step, data } = req.body || {};
    const n = Number(step);
    let result;
    if (n === 1) result = validateLoan(data || {});
    else if (n === 2) result = validatePersonal(data || {});
    else if (n === 3) result = validateIncome(data || {});
    else if (n === 4) result = validateAgreement(data || {});
    else return res.status(400).json({ ok: false, errors: { _: 'Invalid step' } });

    return res.json(result);
  } catch (err){
    console.error('[validate-step] crashed:', err);
    return res.status(500).json({ ok: false, errors: { _: 'Server error' } });
  }
}