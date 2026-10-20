/** '+16173532121' → '(617) 353-2121'. Numbers that are not 10-digit US numbers (e.g. '911') are unchanged. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length !== 10) return phone;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}
