import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

interface User {
  id?: number;
  userCode: string;
  firstName: string;
  lastName: string;
  email: string;
  roleID: number;
  roleId?: number;
  programID?: number;
  yearLevel?: number;
  campus?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      SecureStore.setItemAsync('token', action.payload.token).catch(() => { });
      SecureStore.setItemAsync('user', JSON.stringify(action.payload.user)).catch(() => { });
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      SecureStore.deleteItemAsync('token').catch(() => { });
      SecureStore.deleteItemAsync('user').catch(() => { });
      SecureStore.deleteItemAsync('rememberMe').catch(() => { });
      SecureStore.deleteItemAsync('biometricEnabled').catch(() => { });
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, logout, setLoading, updateUser } = authSlice.actions;
export default authSlice.reducer;
