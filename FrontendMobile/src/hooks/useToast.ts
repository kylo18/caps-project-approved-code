import Toast from 'react-native-toast-message';

export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info'
) {
  Toast.show({
    type: type,
    text1: message,
    position: 'top',
    visibilityTime: 2500,
    autoHide: true,
    topOffset: 60,
  });
}

export function hideToast() {
  Toast.hide();
}
