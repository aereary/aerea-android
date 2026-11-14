const KEY = 'aerea-private-shelf-pin-v1';
export type PinRecord = {
    salt: number[];
    hash: number[];
    failures: number;
    retryAt: number;
};
export function readPin(): PinRecord | null {
    const raw = localStorage.getItem(KEY);
    if (!raw)
        return null;
    const value = JSON.parse(raw) as PinRecord;
    if (!Array.isArray(value.salt) || value.salt.length !== 16 || !Array.isArray(value.hash) || value.hash.length !== 32 || !Number.isFinite(value.failures) || !Number.isFinite(value.retryAt))
        throw new Error('PIN settings cannot be read. Your files have not been changed.');
    return value;
}
async function digest(pin: string, salt: number[]) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    return Array.from(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt), iterations: 600000 }, key, 256)));
}
export async function checkPin(pin: string) {
    const record = readPin();
    if (!record)
        return true;
    if (record.retryAt > Date.now())
        throw new Error('Too many attempts. Please wait one minute.');
    const hash = await digest(pin, record.salt);
    const ok = hash.reduce((diff, v, i) => diff | (v ^ record.hash[i]), 0) === 0;
    const failures = ok ? 0 : record.failures + 1;
    localStorage.setItem(KEY, JSON.stringify({ ...record, failures, retryAt: failures >= 5 ? Date.now() + 60000 : 0 }));
    return ok;
}
export async function changePin(current: string, next: string) {
    if (!await checkPin(current))
        throw new Error('Current PIN is incorrect.');
    if (!next) {
        localStorage.removeItem(KEY);
        return;
    }
    if (!/^\d{8,}$/.test(next))
        throw new Error('Use at least 8 digits.');
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await digest(next, salt);
    localStorage.setItem(KEY, JSON.stringify({ salt, hash, failures: 0, retryAt: 0 }));
}

export function privateCatalogLocked() {
  try { return !!readPin(); } catch { return true; }
}
