# Mobile Setup, Architecture, and Features

Archived version: v1.0  
Original location: `../02_Technical_Documentation/Mobile Setup, Architecture, and Features.md`

## Purpose
This document records the first setup and architecture notes for the CAPS mobile frontend.

## Project location

```text
FrontendMobile/
```

The mobile frontend is built with Expo and React Native.

## Required tools

- Node.js LTS
- npm
- Expo development tools
- Android device or emulator

## Install dependencies

Run this command from the `FrontendMobile` folder:

```bash
npm install
```

## Run the app

Common development commands:

```bash
npm start
npm run android
npm run ios
npm run web
```

## Initial architecture notes

- Expo Router handles mobile navigation.
- The app uses role-based screens.
- API requests connect to the backend through environment variables.
- Authentication state controls access to protected screens.

## Initial feature list

- Login and registration
- Student dashboard
- Faculty dashboard
- Admin-style dashboards for higher roles
- Class and subject views
- Analytics and reports
- Help Center support flow

## Earlier limitations

- Runtime config details were not yet fully documented.
- Offline queue behavior was not yet described.
- Push notification behavior was not yet described.
- Release build helper notes were not yet included.

## Version control note

This archived version provides a baseline that can be compared with the current expanded technical setup document.

