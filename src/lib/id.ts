// Crockford base32: no I, L, O or U, so IDs are easy to read aloud over the phone.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/** Short, locally generated identifier such as `BD-7K3F-9QX2`. Not derived from any device data. */
export function generateDiagnosticId(): string {
  const chars = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `BD-${chars.slice(0, 4)}-${chars.slice(4)}`;
}
