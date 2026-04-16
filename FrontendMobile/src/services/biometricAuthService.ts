// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Biometric authentication helper using expo-local-authentication.
//
// Features:
// - Check hardware availability and enrolled biometrics
// - Prompt for Face ID / fingerprint / device PIN
// - Return biometric types for UI hints
// ─────────────────────────────────────────────────────────────────────────────

import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync().catch(() => false);
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
  return enrolled;
}

export async function authenticateWithBiometrics(
  promptMessage = 'Authenticate to continue'
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Use passcode',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function getBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
  return LocalAuthentication.supportedAuthenticationTypesAsync().catch(() => []);
}
