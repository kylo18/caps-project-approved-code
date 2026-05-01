import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL;
if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is required. Set it in .env');

const AI_SERVICE_URL = Constants.expoConfig?.extra?.AI_SERVICE_URL;
if (!AI_SERVICE_URL) throw new Error('EXPO_PUBLIC_AI_SERVICE_URL is required. Set it in .env');

export async function getApiUrl(): Promise<string> {
  const savedUrl = await SecureStore.getItemAsync('apiBaseUrl');
  return savedUrl || API_URL;
}

export async function getAiServiceUrl(): Promise<string> {
  const savedUrl = await SecureStore.getItemAsync('aiServiceUrl');
  return savedUrl || AI_SERVICE_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync('apiBaseUrl', url);
}

export async function setAiServiceBaseUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync('aiServiceUrl', url);
}

export async function clearApiConfig(): Promise<void> {
  await SecureStore.deleteItemAsync('apiBaseUrl');
  await SecureStore.deleteItemAsync('aiServiceUrl');
}

export function getDebugInfo() {
  return {
    apiUrl: API_URL,
    aiUrl: AI_SERVICE_URL,
    platform: 'react-native',
  };
}

export default getApiUrl;
