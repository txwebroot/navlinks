import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// In production, this should be a fixed secret from env. 
// For now, we use a hardcoded fallback or generate one if not present (but that would break persistence across restarts if not saved).
// We'll use the JWT_SECRET as the key source for simplicity in this project context.
const SECRET_KEY = process.env.JWT_SECRET || 'navlink_production_secret_key_2024_change_me';
// Key must be 32 bytes for aes-256-cbc
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

export function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text) {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed:', error);
        return text; // Return original if decryption fails (fallback)
    }
}
