/* Shared server-side validation for both /api/validate-step and /api/apply */

const MONTHS_DAYS = (y, m) => new Date(y, m, 0).getDate();

function today(){
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
}

export function validateLoan(data){
  const errors = {};
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount < 500 || amount > 50000){
    errors.amount = 'Enter an amount between K500 and K50,000.';
  }
  const term = Number(data.term);
  if (![1,3,6,12,24].includes(term)){
    errors.term = 'Choose a valid repayment period.';
  }
  if (!data.purpose || typeof data.purpose !== 'string' || !data.purpose.trim()){
    errors.purpose = 'Select a purpose.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validatePersonal(data){
  const errors = {};
  if (!data.fullname || data.fullname.trim().length < 2){
    errors.fullname = 'Enter your full name.';
  }
  const day = Number(data.dobDay), month = Number(data.dobMonth), year = Number(data.dobYear);
  if (!day || !month || !year){
    errors.dobDay = 'Enter your date of birth.';
  } else {
    const valid = day >= 1 && day <= MONTHS_DAYS(year, month);
    if (!valid){ errors.dobDay = 'Enter a valid date of birth.'; }
    else {
      const dob = new Date(year, month - 1, day);
      const t = today();
      let age = t.y - dob.getFullYear();
      const m = (t.m - 1) - dob.getMonth();
      if (m < 0 || (m === 0 && t.d < dob.getDate())) age--;
      if (age < 18){ errors.dobYear = 'You must be 18 or older to apply.'; }
    }
  }
  if (!data.city || data.city.trim().length < 2){
    errors.city = 'Enter your city or town.';
  }
  const p = String(data.phone || '');
  const okPhone = /^0[5-9]\d{8}$/.test(p);
  if (!okPhone){
    errors.phone = 'Enter a valid Zambian mobile number: 10 digits starting with 0 (for example 097 123 4567).';
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){
    errors.email = 'Enter a valid email address.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateIncome(data){
  const errors = {};
  const allowed = ['Employed full-time','Employed part-time','Self-employed','Business owner','Student','Other'];
  if (!allowed.includes(data.employment)){
    errors.employment = 'Select your employment status.';
  }
  const inc = Number(data.income);
  if (!Number.isFinite(inc) || inc < 500){
    errors.income = 'Enter your monthly income (at least K500).';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateAgreement(data){
  const errors = {};
  if (data.agree !== true){
    errors.agree = 'You must accept the terms to continue.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateWholeApplication(body){
  const loan     = validateLoan(body.loan || {});
  const personal = validatePersonal(body.personal || {});
  const income   = validateIncome(body.income || {});
  const errors   = { ...loan.errors, ...personal.errors, ...income.errors };
  return { ok: Object.keys(errors).length === 0, errors };
}