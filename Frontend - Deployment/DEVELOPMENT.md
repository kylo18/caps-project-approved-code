# CAPS Mobile - Development Guide

## Quick Start for Development

### Option 1: Web Browser (Fastest - Recommended for UI Changes)

```bash
npm run dev
```

- Opens at `http://localhost:5173`
- Hot Module Replacement (HMR) - changes appear instantly
- Best for: UI development, logic testing, quick iterations

### Option 2: Build APK for Mobile Testing

When you need to test on an actual Android device:

```bash
# Build production APK
npm run build:android
```

Then install the APK from:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start web dev server |
| `npm run build` | Build for production |
| `npm run build:android` | Build APK for Android |
| `npm run open:android` | Open Android Studio |

---

## Development Workflow

### Step 1: Develop in Web Browser
```bash
npm run dev
```
- Make all your UI and logic changes
- Test in browser at `http://localhost:5173`
- Changes appear instantly

### Step 2: Build and Test on Mobile
```bash
# Build the APK
npm run build:android

# Install on phone (manual transfer or use Android Studio)
```

### Step 3: Configure Server in App
1. Open the CAPS app on your phone
2. Tap **"Server Configuration"** on login screen
3. Choose your server:
   - **Local Development**: Enter your computer's IP + port 8005
   - **Test Server**: Uses pre-configured AWS server
   - **Custom URL**: Enter any backend URL
4. Test connection and save

---

## Server Configuration

The app supports three server connection modes:

### 1. Local Development
For testing with Docker on your laptop:
- **IP**: Your computer's IP (e.g., `192.168.1.5`)
- **Port**: `8005` (Docker backend port)
- **Example**: `http://192.168.1.5:8005`

**Find your IP:**
```bash
# Windows
ipconfig
# Look for "IPv4 Address"

# Mac/Linux
ifconfig
# Look for "inet" address
```

### 2. Test Server (AWS)
- **IP**: `18.142.190.113`
- **Port**: `8000`
- Pre-configured in the app

### 3. Custom URL
Enter any backend URL for production or other environments.

---

## Troubleshooting

### Issue: "Connection refused" or timeout
**Solution:**
- Check your IP address is correct
- Ensure Docker backend is running (`docker compose up`)
- Disable Windows Defender firewall temporarily
- Ensure phone and computer are on same WiFi (for local dev)

### Issue: "Cleartext HTTP traffic not permitted"
**Solution:**
- This should not happen with current build
- If it does, the APK may be old - rebuild with `./gradlew clean assembleDebug`

### Issue: Changes not appearing in APK
**Solution:**
- You must rebuild APK after code changes: `npm run build:android`
- Uninstall old app before installing new APK

### Issue: White screen on mobile
**Solution:**
- Check console logs in Chrome DevTools (`chrome://inspect`)
- Ensure all dependencies installed: `npm install`
- Check `capacitor.config.json` is valid JSON

---

## Tips for Faster Development

✅ **Use Web Browser** (`npm run dev`) for: UI changes, logic testing  
✅ **Build APK** only when: Testing on real device, final verification  

**Time comparison:**
- Web browser: Instant (< 1 second)
- APK rebuild: 30-60 seconds

---

## Important Notes

### Android HTTP Cleartext
The app has `android:usesCleartextTraffic="true"` enabled in AndroidManifest.xml. This allows HTTP connections (not just HTTPS) which is necessary for:
- Local development servers (http://192.168.x.x:8005)
- Test servers without SSL (http://18.142.190.113:8000)
- User-configured custom URLs

**Note:** This is acceptable for development/testing. For production apps with sensitive data, consider using HTTPS.

### Key Files
- `capacitor.config.json` - Capacitor configuration
- `android/app/src/main/AndroidManifest.xml` - Android permissions
- `src/utils/config.js` - Server configuration utilities
