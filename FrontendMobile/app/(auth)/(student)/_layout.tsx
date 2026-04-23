// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Student tab-based navigation layout. Renders a custom tab bar
//          (StudentTabBar) with four top-level screens for the student role.
//
// Tabs:
//   - dashboard  → Home (student dashboard/overview)
//   - classes    → Classes (enrolled classes & quizzes)
//   - leaderboard→ Leaderboard (student rankings/achievements)
//   - insights   → Profile (analytics/personal progress)
// ─────────────────────────────────────────────────────────────────────────────

import { Tabs } from 'expo-router';
import { StudentTabBar } from '../../../src/student/ui';

export default function StudentTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => (
        <StudentTabBar {...props} />
      )}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Profile',
        }}
      />
      {/* Hidden routes (accessible via deep links / router.push) */}
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="frequently-mistaken"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="practice-history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="strong-areas"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="weak-areas"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="time-per-topic"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
