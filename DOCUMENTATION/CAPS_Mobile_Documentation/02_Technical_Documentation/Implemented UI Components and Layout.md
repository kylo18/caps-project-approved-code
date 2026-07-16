# Implemented UI Components and Layout

## Purpose
This document describes the UI components and layout patterns that are currently implemented in the CAPS mobile frontend under `FrontendMobile`. It avoids placeholder component names and references the actual route, feature, and shared component structure.

## Mobile Scope
This document is written for the CAPS mobile app only and reflects the current `FrontendMobile` implementation. It does not describe web-only or backend-only behavior.

Last updated: May 27, 2026

This document has been reviewed and updated for the current CAPS mobile system.

---

## UI Architecture

The mobile UI is built with:
- React Native
- Expo Router
- NativeWind utility classes
- role-aware theme helpers
- shared feature components
- Ionicons from `@expo/vector-icons`
- Rubik font from `assets/fonts/Rubik-Variable.ttf`

The root layout loads the font, applies global providers, and renders routes without native headers. Most screens provide their own headers and action controls.

---

## Shared Core Components

Shared components are located in:

```text
src/features/core/components/
```

Implemented core components include:
- `MobileHeader.tsx` - common mobile screen header with actions and Help Center access
- `Header.tsx` - shared header variant
- `RoleTabBar.tsx` - bottom tab bar for faculty and administrator roles
- `OfflineBanner.tsx` - connection state indicator rendered inside authenticated routes
- `ForceUpdateModal.tsx` - update prompt driven by app version checks
- `FloatingActionButton.tsx` - reusable floating action button
- `BottomModal.tsx` - reusable bottom-sheet style modal
- `ConfirmModal.tsx` - confirmation dialog
- `CustomDropdown.tsx` - dropdown selector
- `LoadingOverlay.tsx` - blocking loading state
- `Skeleton.tsx` - loading placeholders
- `AnimatedCapsLoader.tsx` and `CapsActivityIndicator.tsx` - loading indicators
- `AppVersion.tsx` - app version display

These components are used across role dashboards, lists, modals, profile screens, and data-heavy admin workflows.

---

## Student UI Components

Student-specific UI lives in:

```text
src/features/student/
```

Current student UI files include:
- `ui/StudentUI.tsx`
- `ui/StudentTabBar.tsx`
- `ui/StudentCard.tsx`
- `ui/StudentSectionHeader.tsx`
- `ui/StudentAvatar.tsx`
- `ui/StudentLeaderboard.tsx`
- `ui/StudentFilterSheet.tsx`
- `ui/LeaderboardShareModal.tsx`
- `ui/studentTokens.ts`
- `shared/components/StudentExamCard.tsx`
- `shared/components/DailyMotivationModal.tsx`
- `shared/components/StudentLeaderboardRow.tsx`
- `shared/components/StudentLeaderboardPodium.tsx`
- `shared/components/StudentSegmentedControl.tsx`
- `shared/components/StudentHeroDecoration.tsx`

The student interface uses a separate visual system from admin screens. It includes a custom tab bar, student cards, leaderboard presentation, segmented controls, and filter sheets.

---

## Administrator and Faculty UI Components

Admin-style shared UI lives in:

```text
src/features/admin/shared/
```

Implemented files include:
- `components/AdminFloatingTools.tsx`
- `context/FloatingToolsContext.tsx`
- `hooks/useScreenFloatingTools.ts`

Admin and faculty layouts use:
- `RoleTabBar` for role navigation
- `AdminFloatingTools` for quick actions
- role theme colors from `src/features/core/styles/roleTheme.ts`

The role layouts define visible tabs and keep secondary screens hidden from the tab bar through Expo Router `href: null`.

---

## Feature Components

### Support
Support UI is implemented in:

```text
src/features/support/components/HelpCenterModal.tsx
```

The modal provides:
- student FAQ viewing
- student support request form
- role-aware behavior for non-student users

### Classes
Class screens are implemented in:

```text
src/features/classes/screens/
```

Screens include:
- `ClassesScreen.tsx`
- `ClassDetailScreen.tsx`
- `ArchivedClassesScreen.tsx`

These screens support class listing, class detail, quiz listing, class leaderboard sections, recent activity, and archived class views depending on role.

### Practice
Practice exam components are implemented in:

```text
src/features/practice/components/
```

Components include:
- `Questionnaire.tsx`
- `QuestionListModal.tsx`
- `PrintExamModal.tsx`
- `RichTextEditor.tsx`

These support exam taking, question navigation, question editing, print/export-related workflows, and rich question content.

### Profile
Profile UI is implemented in:

```text
src/features/profile/
```

Files include:
- `screens/RoleProfileScreen.tsx`
- `components/EditProfileModal.tsx`
- `components/UserDetailModal.tsx`

### Subjects
Subject cards and action menus are implemented in:

```text
src/features/subjects/components/
```

Files include:
- `SubjectCard.tsx`
- `SubjectCardFaculty.tsx`
- `SubjectCardProgramChair.tsx`
- `RoleSubjectActionMenu.tsx`

### Notifications
Notification UI is implemented in:

```text
src/features/notifications/
```

Files include:
- `screens/RoleAnnouncementScreen.tsx`
- `components/NotificationPanel.tsx`

### Admin Insights
Admin analytics, enhancement, and reports UI is implemented in:

```text
src/features/admin/insights/
```

Screens include:
- `AdminInsightsShellScreen.tsx`
- `AdminReportsScreen.tsx`
- `AdminUnifiedEnhancementScreen.tsx`

---

## Layout Structure

### Root stack
`app/_layout.tsx` defines the top-level stack:
- `index`
- `register`
- `forgot-password`
- `reset-password`
- `team-caps`
- `(auth)`

Headers are disabled globally so screens own their visual layout.

### Authenticated wrapper
`app/(auth)/_layout.tsx` wraps all authenticated routes and renders:
- role guard
- page background
- `OfflineBanner`
- child route slot

### Student layout
`app/(auth)/(student)/_layout.tsx` renders a tab layout with:
- `dashboard`
- `classes`
- `leaderboard`
- `insights`

Hidden routes:
- `search`
- `bookmarks`
- `frequently-mistaken`
- `practice-history`
- `strong-areas`
- `weak-areas`
- `time-per-topic`
- `class-detail`

### Faculty layout
`app/(auth)/(faculty)/_layout.tsx` renders:
- `dashboard`
- `subjects`
- `classes`
- `profile`

Hidden routes:
- `users`
- `create-announcement`
- `class-detail`
- `reports`
- `insights`
- `archived-classes`

### Program Chair layout
The Program Chair route group includes:
- dashboard
- users
- subjects
- reports
- profile
- insights
- create announcement
- classes
- class detail
- archived classes

### Dean layout
`app/(auth)/(dean)/_layout.tsx` renders visible tabs:
- `dashboard`
- `subjects`
- `classes`
- `enhancement`
- `profile`

Hidden routes:
- `users`
- `class-detail`
- `analytics`
- `reports`
- `insights`
- `support`
- `create-announcement`
- `archived-classes`

### Associate Dean layout
The Associate Dean route group includes:
- dashboard
- analytics
- enhancement
- users
- subjects
- reports
- profile
- insights
- create announcement
- classes
- class detail
- archived classes

---

## Styling Rules Used by the App

The current frontend uses a combination of:
- NativeWind `className` utility styling
- inline style objects for dynamic theme colors
- role theme values from `roleTheme.ts`
- student tokens from `studentTokens.ts`
- dark and light mode from `ThemeContext`
- Ionicons for tab and action icons

The app favors:
- card-based list items
- compact badges
- bottom tab navigation
- modal and bottom-sheet interactions
- pull-to-refresh on data screens
- role-specific color accents

---

## Current File Structure Summary

```text
FrontendMobile/
  app/
    _layout.tsx
    index.tsx
    register.tsx
    forgot-password.tsx
    reset-password.tsx
    team-caps.tsx
    (auth)/
      _layout.tsx
      help.tsx
      (student)/
      (faculty)/
      (program-chair)/
      (dean)/
      (associate-dean)/
      practice-exam/
  src/
    contexts/
      ThemeContext.tsx
      FloatingToolsContext.tsx
    features/
      admin/
      classes/
      core/
      notifications/
      practice/
      profile/
      student/
      subjects/
      support/
    hooks/
    services/
    store/
    types/
    utils/
```

---

## Maintenance Notes

- Do not document generic placeholder component paths; the mobile app uses TypeScript and feature-based components.
- Add new reusable UI to the relevant feature folder unless it is truly shared across the whole app.
- Keep role route documentation synchronized with the matching `_layout.tsx` files.
- Keep student UI documentation separate from admin/faculty UI when the patterns differ.

---

*End of Document*
