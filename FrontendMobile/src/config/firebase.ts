// Firebase Configuration
// CAPS Mobile App - Firebase Project

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBxYHrsufgvcUhNI__wHYFjYjdnAUxgQeY',
  authDomain: 'caps-718f2.firebaseapp.com',
  projectId: 'caps-718f2',
  storageBucket: 'caps-718f2.firebasestorage.app',
  messagingSenderId: '83048309500',
  appId: '1:83048309500:web:69d1c6e9a5babd8046ed79',
  measurementId: 'G-8ZXPXBEH73',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;
