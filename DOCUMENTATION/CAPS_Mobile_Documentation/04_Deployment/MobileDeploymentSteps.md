1. Make sure the containers are up and stable

    - Frontend
    - Backend
    - Database
    - Phpmyadmin
    - redis

    Note: Container names may vary, but at least make sure those containers are up and stable

2. Navigate to the FrontendMobile Directory

    - 'cd FrontendMobile'

3. Confirm if .env existed
    
    - 'ls .env'

    It should have this response

    - '.env' 

    Note: If there are no response, proceed to step 3. Otherwise, if .env existedd make sure to follow this steps below.

    - 'cat .env (Note: Make sure the .env contain this setup)'
    - 'EXPO_PUBLIC_API_URL=<subdomain_url>'
    - 'EXPO_PUBLIC_AI_SERVICE_URL=<subdomain_url>'


4. Create .env for FrontendMobile
    
    - 'nano .env'
    - 'copy and paste these values'
        - 'EXPO_PUBLIC_API_URL=<subdomain_url>'
        - 'EXPO_PUBLIC_AI_SERVICE_URL=<subdomain_url>'

5. Install dependencies 

    - 'npm install --legacy-peer-deps'

6. Build the APK
    
    Note: If rebuilding the mobile app, follow from this step to rebuild the apk. 

    - 'node scripts/prepare-android-build.js'
    - 'npx expo prebuild --clean'

7. Wait for the commands to run in step 6. After running it navigate to the android directory and run the this command

    - 'cd android'
    - 'nohup ./gradlew assembleRelease > build.log 2>&1 &'  

8. Copy the Apk to backend

    - 'cd ..'
    - 'cp android/app/build/outputs/apk/release/app-release.apk "../Backend - Deployment/public/apk/CAPS.apk"'

9. Verify the apk is downloadable
    
    - 'curl -I <subdomain_url/download/caps.apk> 

    Note: It should return 200 Ok.

10. Install on android

    - Open <subdomain_url>
    - Tap Hamburger menu -> Download
    - Install the apk
    - The app should now work