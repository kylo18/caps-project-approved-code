import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import apiClient from '../src/services/apiClient';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../src/store/slices/authSlice';
import { useTheme } from '../src/contexts/ThemeContext';
import { showToast } from '../src/hooks/useToast';


// ─────────────────────────────────────────────────────────────────────────────
// App entry point — Login Screen
// Displays branded login form with university/college logos, user code +
// password fields, OAuth (Google/Facebook), and role-based routing after auth.
// ─────────────────────────────────────────────────────────────────────────────
import loginBg from '../assets/login-bg.png';
import univLogo from '../assets/univLogo.png';
import collegeLogo from '../assets/college-logo.png';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  // ── Form state ─────────────────────────────────────────────────────────
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUserCodeFocused, setIsUserCodeFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loaderIdx, setLoaderIdx] = useState(0);

  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoaderIdx((prev) => (prev + 1) % 3);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // ── Login: authenticates with user code + password, stores token, routes by role ──
  const handleLogin = async () => {
    setError('');
    if (!userCode.trim() || !password.trim()) {
      showToast('Please enter both ID Code and Password.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/login', { userCode, password });
      const { token, user } = response.data;
      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      dispatch(setCredentials({ user, token }));
      routeBasedOnRole(user.roleID ?? user.roleId);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Something went wrong.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OAuth: Google (Firebase) / Facebook (Backend) ──
  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    if (provider === 'google') {
      // Temporarily disabled - requires expo-dev-client for full native support
      Alert.alert(
        'Coming Soon',
        'Google Sign-In requires a custom development build. Please use Email/Password or Student ID login for now.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Use backend OAuth for Facebook
    try {
      const API_URL = 'http://100.91.44.24:8000';
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/api/auth/${provider}/redirect`,
        'caps-mobile://auth/callback'
      );
      if (result.type === 'success') {
        const token = extractTokenFromUrl(result.url);
        if (!token) {
          showToast('OAuth login failed', 'error');
          return;
        }
        const response = await apiClient.get('/api/user/profile');
        const user = response.data;
        await SecureStore.setItemAsync('token', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        dispatch(setCredentials({ user, token }));
        routeBasedOnRole(user.roleID ?? user.roleId);
      }
    } catch (error) {
      showToast('OAuth login failed', 'error');
    }
  };

  const extractTokenFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.hash.substring(1));
      return params.get('token') || urlObj.searchParams.get('token');
    } catch { return null; }
  };

  const routeBasedOnRole = (roleID: number) => {
    switch (roleID) {
      case 1: router.replace('/(auth)/(student)/dashboard'); break;
      case 2: router.replace('/(auth)/(faculty)/subjects'); break;
      case 3: router.replace('/(auth)/(program-chair)/subjects'); break;
      case 4: router.replace('/(auth)/(dean)/dashboard'); break;
      case 5: router.replace('/(auth)/(associate-dean)/subjects'); break;
      default: router.replace('/(auth)/dashboard');
    }
  };

  const colors = {
    bg: isDark ? '#000' : '#ffffff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#d1d5db',
    inputBg: isDark ? '#000' : '#fff',
  };

  const hasUser = (val: string, focused: boolean) => val.length > 0 || focused;

  return (
    <View style={{ flex: 1, backgroundColor: '#242424' }}>
      {/* Login Background Image */}
      <Image source={loginBg} style={StyleSheet.absoluteFill} resizeMode="cover" />
      
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }} keyboardShouldPersistTaps="handled" bounces={false}>
          
          {/* ===== HEADER - h-60 (240px) with gradient ===== */}
          <View style={[styles.header, { backgroundColor: isDark ? '#000' : '#242424' }]}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <View style={styles.leftGroup}>
                {/* Actual logos from original project */}
                <Image source={univLogo} style={styles.logoImg} />
                <Image source={collegeLogo} style={styles.logoImg} />
                <TouchableOpacity onPress={toggleTheme} style={styles.themeCircle} activeOpacity={0.7}>
                  <Ionicons name={isDark ? 'sunny' : 'moon'} size={14} color={isDark ? '#FBBF24' : '#fff'} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.rightGroup}>
                <Text style={styles.signUpLabel}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/register' as any)} style={styles.signUpBtn} activeOpacity={0.7}>
                  <Text style={styles.signUpBtnText}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CAPS Title - exactly 2 lines, fits mobile */}
            <View style={styles.titleArea}>
              <Text style={styles.capsLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                <Text style={styles.capOrange}>C</Text>OMPREHENSIVE <Text style={styles.capOrange}>A</Text>SSESSMENT
              </Text>
              <Text style={styles.capsLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                AND <Text style={styles.capOrange}>P</Text>REPARATION <Text style={styles.capOrange}>S</Text>YSTEM
              </Text>
            </View>
          </View>

          {/* ===== CURVE + LOGIN CARD ===== */}
          <View style={[styles.card, { backgroundColor: colors.bg }]}>
            <View style={[styles.curveTop, { backgroundColor: isDark ? '#1a1a1a' : '#242424' }]} />
            <View style={[styles.cardContent, { backgroundColor: colors.bg }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>LOG IN ACCOUNT</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Welcome! Please enter your code and password to access your account.
            </Text>

            <View style={styles.form}>
              {/* User Code */}
              <View style={styles.field}>
                <View style={[styles.fieldBox, { backgroundColor: colors.inputBg, borderColor: isUserCodeFocused ? '#FE6902' : colors.border }]}>
                  <TextInput style={[styles.fieldInput, { color: colors.text }]} value={userCode} onChangeText={setUserCode} onFocus={() => setIsUserCodeFocused(true)} onBlur={() => setIsUserCodeFocused(false)} placeholder="" autoCapitalize="none" autoCorrect={false} />
                  <Text style={[styles.fieldLabel, { backgroundColor: colors.inputBg, top: hasUser(userCode, isUserCodeFocused) ? 6 : '50%', marginTop: hasUser(userCode, isUserCodeFocused) ? 0 : -9, fontSize: hasUser(userCode, isUserCodeFocused) ? 11 : 16, left: hasUser(userCode, isUserCodeFocused) ? 4 : 16, color: isUserCodeFocused ? '#FE6902' : colors.textSecondary }]}>
                    Instructor Code/Student ID Number
                  </Text>
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <View style={[styles.fieldBox, { backgroundColor: colors.inputBg, borderColor: isPasswordFocused ? '#FE6902' : colors.border }]}>
                  <TextInput style={[styles.fieldInput, styles.pwdInput, { color: colors.text }]} value={password} onChangeText={setPassword} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} placeholder="" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="current-password" />
                  <Text style={[styles.fieldLabel, { backgroundColor: colors.inputBg, top: hasUser(password, isPasswordFocused) ? 6 : '50%', marginTop: hasUser(password, isPasswordFocused) ? 0 : -9, fontSize: hasUser(password, isPasswordFocused) ? 11 : 16, left: hasUser(password, isPasswordFocused) ? 4 : 16, color: isPasswordFocused ? '#FE6902' : colors.textSecondary }]}>
                    Password
                  </Text>
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} activeOpacity={0.7}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye-outline'} size={25} color={showPassword ? '#FE6902' : colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? <Text style={styles.errMsg}>{error}</Text> : null}

              {/* Login Button */}
              <TouchableOpacity style={[styles.loginBtn, isLoading && styles.loginBtnOff]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.9}>
                {isLoading ? (
                  <View style={styles.loaderRow}>
                    <View style={[styles.loaderDot, { opacity: loaderIdx === 0 ? 1 : 0.3 }]} />
                    <View style={[styles.loaderDot, { opacity: loaderIdx === 1 ? 1 : 0.3 }]} />
                    <View style={[styles.loaderDot, { opacity: loaderIdx === 2 ? 1 : 0.3 }]} />
                  </View>
                ) : <Text style={styles.loginBtnText}>LOG IN</Text>}
              </TouchableOpacity>

              {/* Forgot */}
              <TouchableOpacity onPress={() => router.push('/forgot-password' as any)} activeOpacity={0.7}>
                <Text style={styles.forgotTxt}>Forgot your password?</Text>
              </TouchableOpacity>

              {/* Or divider */}
              <View style={styles.orRow}><Text style={styles.orTxt}>or continue with</Text></View>

              {/* OAuth */}
              <View style={styles.oauthRow}>
                <TouchableOpacity 
                  style={[styles.oauthBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]} 
                  onPress={() => handleOAuthLogin('google')} 
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-google" size={18} color={colors.text} />
                  <Text style={[styles.oauthLabel, { color: colors.text }]}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.oauthBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]} 
                  onPress={() => handleOAuthLogin('facebook')} 
                  activeOpacity={0.7}
                >
                  <FontAwesome name="facebook" size={18} color="#1877F2" />
                  <Text style={[styles.oauthLabel, { color: colors.text }]}>Facebook</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.creditTxt}>Developed by <Text style={styles.creditLink}>Team Caps</Text></Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 240, paddingTop: 44, paddingBottom: 48 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  leftGroup: { flexDirection: 'row', alignItems: 'center' },
  logoImg: { width: 32, height: 32, marginRight: 8, resizeMode: 'contain' },
  themeCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  rightGroup: { flexDirection: 'row', alignItems: 'center' },
  signUpLabel: { color: '#fff', fontSize: 11, marginRight: 8 },
  signUpBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8 },
  signUpBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  titleArea: { alignItems: 'center', marginTop: 16, gap: 4, width: '100%' },
  capsLine: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#fff', 
    textAlign: 'center', 
    letterSpacing: 0.5, 
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  capOrange: { 
    color: '#FE6902', 
    fontSize: 36, 
    fontWeight: '900', 
    letterSpacing: 0.8, 
    lineHeight: 38,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  curveContainer: { width: '100%' },
  curveBar: {
    width: width * 0.85,
    height: 16,
    alignSelf: 'center',
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  
  card: { 
    flex: 1, 
    marginTop: -20,
  },
  curveTop: {
    width: '100%',
    height: 24,
    backgroundColor: '#242424',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -12,
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -12,
  },
  cardTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    textAlign: 'center', 
    marginBottom: 6, 
    letterSpacing: 0.8, 
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 10 },
  
  form: { marginTop: 8 },
  field: { marginBottom: 8, marginTop: 8 },
  fieldBox: { position: 'relative', borderWidth: 1, borderRadius: 12, minHeight: 52, justifyContent: 'center', paddingVertical: 8 },
  fieldInput: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, includeFontPadding: false, textAlignVertical: 'center' },
  pwdInput: { paddingRight: 50 },
  fieldLabel: { position: 'absolute', zIndex: 10, paddingHorizontal: 4, includeFontPadding: false, textAlignVertical: 'center' },
  eyeBtn: { position: 'absolute', right: 12, top: 14, padding: 4 },
  
  errMsg: { color: '#EF4444', fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 4 },
  loginBtn: { backgroundColor: '#FE6902', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 8, elevation: 4 },
  loginBtnOff: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  loaderRow: { flexDirection: 'row', gap: 8 },
  loaderDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  
  forgotTxt: { color: '#FE6902', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 12 },
  orRow: { alignItems: 'center', marginBottom: 16 },
  orTxt: { color: '#6b7280', fontSize: 12 },
  oauthRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  oauthBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  oauthBtnDisabled: { opacity: 0.5 },
  oauthLabel: { fontSize: 14, fontWeight: '500' },
  
  creditTxt: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 8 },
  creditLink: { color: '#FE6902' },
});
