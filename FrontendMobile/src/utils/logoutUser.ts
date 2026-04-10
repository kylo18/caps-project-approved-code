import * as SecureStore from 'expo-secure-store';
import { showToast } from '../hooks/useToast';

export async function logoutUser(redirect?: string) {
  try {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    
    // Show optional message
    if (redirect) {
      showToast('Logged out successfully', 'info');
    }
    
    // Navigation will be handled by ProtectedRoute component
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}
