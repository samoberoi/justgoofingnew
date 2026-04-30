// Hash a 4-digit PIN. Must match the salt used in supabase/functions/setup-pin and forgot-pin.
const PIN_SALT = 'just-goofing-pin-salt-v1';

export async function hashPin(pin: string): Promise<string> {
  const buf = new TextEncoder().encode(pin + PIN_SALT);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
