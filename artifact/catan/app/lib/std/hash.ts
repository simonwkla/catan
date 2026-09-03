const FNV_OFFSET_64 = 0xcbf29ce484222325n;
const FNV_PRIME_64 = 0x100000001b3n;
const UINT64_MASK = 0xffffffffffffffffn;

/**
 * Returns a stable 64-bit FNV-1a hash of the source's UTF-8 bytes as lowercase
 * hexadecimal.
 *
 * This is a fast, deterministic source identifier for browser and server use.
 * It is non-cryptographic and must not be used for passwords, signatures,
 * authentication, or anywhere collision resistance is a security requirement.
 */
function string(source: string): string {
  let value = FNV_OFFSET_64;
  for (const byte of new TextEncoder().encode(source)) {
    value ^= BigInt(byte);
    value = (value * FNV_PRIME_64) & UINT64_MASK;
  }
  return value.toString(16).padStart(16, "0");
}

export const hash = {
  string,
} as const;
