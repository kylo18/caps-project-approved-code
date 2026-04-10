import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const DEFAULT_API_URL = Constants.expoConfig?.extra?.API_URL || 'http://100.91.44.24:8000';
const DEFAULT_AI_URL = Constants.expoConfig?.extra?.AI_SERVICE_URL || 'http://100.91.44.24:8001';

export async function getApiUrl(): Promise<string> {
  const savedUrl = await SecureStore.getItemAsync('apiBaseUrl');
  return savedUrl || DEFAULT_API_URL;
}

export async function getAiServiceUrl(): Promise<string> {
  const savedUrl = await SecureStore.getItemAsync('aiServiceUrl');
  return savedUrl || DEFAULT_AI_URL;
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
    apiUrl: DEFAULT_API_URL,
    aiUrl: DEFAULT_AI_URL,
    platform: 'react-native',
  };
}

export default getApiUrl;
