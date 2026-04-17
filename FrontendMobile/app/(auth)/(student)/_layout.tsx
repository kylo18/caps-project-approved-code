// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Student tab-based navigation layout. Renders a custom tab bar
//          (StudentTabBar) with four top-level screens for the student role.
//
// Tabs:
//   - dashboard  → Home (student dashboard/overview)
//   - search     → Search (search functionality)
//   - leaderboard→ Leaderboard (student rankings/achievements)
//   - insights   → Insights (analytics/personal progress)
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
        name="search"
        options={{
          title: 'Search',
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
          title: 'Insights',
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
    </Tabs>
  );
}
