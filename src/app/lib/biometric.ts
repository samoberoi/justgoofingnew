import { Capacitor } from '@capacitor/core';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';

const ENABLED_KEY = 'jg_biometric_enabled';
const PHONE_KEY = 'jg_biometric_phone';
const PIN_KEY = 'jg_biometric_pin';

export const isNative = () => Capacitor.isNativePlatform();

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const info = await BiometricAuth.checkBiometry();
    return info.isAvailable && info.biometryType !== BiometryType.none;
  } catch {
    return false;
  }
}

export async function getBiometryLabel(): Promise<string> {
  if (!isNative()) return 'Biometrics';
  try {
    const info = await BiometricAuth.checkBiometry();
    switch (info.biometryType) {
      case BiometryType.faceId: return 'Face ID';
      case BiometryType.touchId: return 'Touch ID';
      case BiometryType.fingerprintAuthentication: return 'Fingerprint';
      case BiometryType.faceAuthentication: return 'Face Unlock';
      case BiometryType.irisAuthentication: return 'Iris';
      default: return 'Biometrics';
    }
  } catch {
    return 'Biometrics';
  }
}

export function isBiometricEnabled(phone: string): boolean {
  return localStorage.getItem(ENABLED_KEY) === '1' && localStorage.getItem(PHONE_KEY) === phone;
}

export function getStoredBiometricPhone(): string | null {
  if (localStorage.getItem(ENABLED_KEY) !== '1') return null;
  return localStorage.getItem(PHONE_KEY);
}

export function getStoredPin(): string | null {
  return localStorage.getItem(PIN_KEY);
}

export async function enableBiometric(phone: string, pin: string): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false;
  try {
    await BiometricAuth.authenticate({
      reason: 'Enable quick unlock for Just Goofing',
      cancelTitle: 'Cancel',
      iosFallbackTitle: 'Use PIN',
      androidTitle: 'Just Goofing',
      androidSubtitle: 'Enable quick unlock',
    });
    localStorage.setItem(ENABLED_KEY, '1');
    localStorage.setItem(PHONE_KEY, phone);
    localStorage.setItem(PIN_KEY, pin);
    return true;
  } catch {
    return false;
  }
}

export async function authenticateBiometric(): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false;
  try {
    await BiometricAuth.authenticate({
      reason: 'Unlock Just Goofing',
      cancelTitle: 'Use PIN',
      iosFallbackTitle: 'Use PIN',
      androidTitle: 'Just Goofing',
      androidSubtitle: 'Unlock with biometrics',
    });
    return true;
  } catch {
    return false;
  }
}

export function disableBiometric() {
  localStorage.removeItem(ENABLED_KEY);
  localStorage.removeItem(PHONE_KEY);
  localStorage.removeItem(PIN_KEY);
}
