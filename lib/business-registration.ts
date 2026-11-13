export const businessTypes = [
  ['Beauty & wellness', 'יופי וטיפוח', 'الجمال والعناية'],
  ['Clinic or therapy', 'קליניקה וטיפול', 'عيادة وعلاج'],
  ['Fitness & coaching', 'כושר ואימון', 'لياقة وتدريب'],
  ['Professional services', 'ייעוץ ושירותים מקצועיים', 'استشارات وخدمات مهنية'],
  ['Automotive services', 'רכב ומוסכים', 'سيارات وصيانة'],
  ['Retail & commerce', 'מסחר וחנויות', 'تجارة ومتاجر'],
  ['Education & lessons', 'לימודים ושיעורים', 'تعليم ودروس'],
  ['Home & maintenance', 'שירותי בית ותחזוקה', 'خدمات منزلية وصيانة'],
  ['Other service business', 'עסק אחר', 'عمل آخر'],
] as const;

export function validOwnerId(value: string) {
  if (!/^\d{9}$/.test(value) || /^(\d)\1{8}$/.test(value)) return false;
  return [...value].reduce((sum, digit, index) => {
    const n = Number(digit) * (index % 2 + 1);
    return sum + (n > 9 ? n - 9 : n);
  }, 0) % 10 === 0;
}
export function registrationError(body: Record<string, unknown>) {
  const s = (key: string) => typeof body[key] === 'string' ? (body[key] as string).trim() : '';
  if (!s('fullName') || s('fullName').length > 120) return 'Enter the business owner’s full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s('email')) || s('email').length > 254) return 'Enter a valid email address.';
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 10 || password.length > 128 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Use 10–128 characters, including a letter and a number.';
  if (body.confirmPassword !== password) return 'The passwords do not match.';
  if (!validOwnerId(s('ownerId'))) return 'Enter a valid 9-digit Israeli owner ID.';
  if (!/^\d{5,15}$/.test(s('businessNumber'))) return 'Enter a business number of 5–15 digits.';
  if (!s('businessName') || s('businessName').length > 100) return 'Enter a business name (up to 100 characters).';
  if (!businessTypes.some(([type]) => type === s('businessType'))) return 'Choose a business type.';
  if (!/^\+?[\d\s()-]{7,25}$/.test(s('phone'))) return 'Enter a valid phone number.';
  if (!s('city') || s('city').length > 100 || s('address').length > 200) return 'Enter a city and a valid address.';
  if (!['ILS', 'USD', 'EUR', 'GBP', 'AED'].includes(s('currency'))) return 'Choose a supported currency.';
  try { new Intl.DateTimeFormat('en', { timeZone: s('timezone') }); } catch { return 'Choose a valid time zone.'; }
  if (body.accepted !== true) return 'Confirm that you are authorized to manage this business.';
  return null;
}
