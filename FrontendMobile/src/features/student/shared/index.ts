// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Barrel export for all student shared components.
//          Re-exports from StudentUI.tsx for backward compatibility.
// ─────────────────────────────────────────────────────────────────────────────

// Core exports from studentTheme.ts
export {
  studentColors,
  studentRadii,
  studentShadow,
  avatarPalette,
  getSubjectVisualVariant,
  formatWeeklyCountdown,
  IconVariant,
} from './studentTheme';

// Components
export { StudentAvatar } from './components/StudentAvatar';
export type { StudentAvatarProps } from './components/StudentAvatar';

export { StudentHeroDecoration } from './components/StudentHeroDecoration';
export { StudentSectionHeader } from './components/StudentSectionHeader';
export type { StudentSectionHeaderProps } from './components/StudentSectionHeader';

export { StudentExamCard } from './components/StudentExamCard';
export type { StudentExamCardProps } from './components/StudentExamCard';

export { StudentSegmentedControl } from './components/StudentSegmentedControl';
export type { StudentSegmentedControlProps } from './components/StudentSegmentedControl';

export { StudentFilterSheet } from './components/StudentFilterSheet';
export type { StudentFilterSheetProps } from './components/StudentFilterSheet';

export { StudentLeaderboardRow, LeaderboardEntry } from './components/StudentLeaderboardRow';
export type { StudentLeaderboardRowProps } from './components/StudentLeaderboardRow';

export { StudentLeaderboardPodium } from './components/StudentLeaderboardPodium';
export type { StudentLeaderboardPodiumProps } from './components/StudentLeaderboardPodium';

export { StudentTabBar } from './components/StudentTabBar';