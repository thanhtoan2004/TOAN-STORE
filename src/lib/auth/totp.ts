import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret() {
  const secret = generateSecret();
  console.log('[TOTP] Generated secret');
  return secret;
}

/**
 * Generate a TOTP URI for QR Code
 * @param email User email
 * @param secret TOTP secret
 * @param issuer App name
 */
export function generateTOTPURI(
  email: string,
  secret: string,
  issuer: string = 'TOAN Store Admin'
) {
  try {
    const uri = generateURI({
      label: email,
      issuer,
      secret,
    });
    console.log('[TOTP] Generated URI successfully');
    return uri;
  } catch (err) {
    console.error('[TOTP] Error generating URI:', err);
    throw err;
  }
}

/**
 * Generate a Data URL for a QR Code
 * @param uri TOTP URI
 */
export async function generateQRCodeDataURL(uri: string) {
  try {
    console.log('[TOTP] Generating QR Code for URI:', uri);
    const dataUrl = await QRCode.toDataURL(uri);
    console.log('[TOTP] Generated QR Code Data URL successfully');
    return dataUrl;
  } catch (err) {
    console.error('[TOTP] Error generating QR code:', err);
    throw err;
  }
}

/**
 * Verify a TOTP token
 * @param token 6-digit code from app
 * @param secret User's stored secret
 */
export function verifyTOTPToken(token: string, secret: string) {
  try {
    const isValid = verifySync({
      token,
      secret,
    });
    console.log('[TOTP] Verification result:', isValid);
    return isValid;
  } catch (err) {
    console.error('[TOTP] Error verifying token:', err);
    return false;
  }
}
