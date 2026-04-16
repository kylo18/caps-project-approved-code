// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Native share sheet helpers for exam results and leaderboard
//          achievements.
//
// Dependencies: expo-sharing (already installed)
// ─────────────────────────────────────────────────────────────────────────────

import * as Sharing from 'expo-sharing';
import { showToast } from '../hooks/useToast';

interface ShareExamResultData {
  subjectName?: string;
  percentage: number;
  earnedPoints: number;
  totalPoints: number;
  correctCount: number;
  incorrectCount: number;
}

interface ShareLeaderboardData {
  rank: number;
  score: number;
  subjectName?: string | null;
}

export async function shareExamResult(data: ShareExamResultData) {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    showToast('Sharing is not available on this device', 'error');
    return;
  }

  const message =
    `I scored ${data.percentage}% on ${data.subjectName || 'Practice Exam'}!\n` +
    `Score: ${data.earnedPoints}/${data.totalPoints}\n` +
    `Correct: ${data.correctCount} | Incorrect: ${data.incorrectCount}\n\n` +
    `Try CAPS and test your knowledge too!`;

  await Sharing.shareAsync(message, {
    dialogTitle: 'Share Exam Result',
    UTI: 'public.plain-text',
    mimeType: 'text/plain',
  }).catch(() => {
    // User cancelled — no action needed
  });
}

export async function shareLeaderboardAchievement(data: ShareLeaderboardData) {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    showToast('Sharing is not available on this device', 'error');
    return;
  }

  const subjectPart = data.subjectName ? ` on ${data.subjectName}` : '';
  const message =
    `I ranked #${data.rank}${subjectPart} on the CAPS Leaderboard with a score of ${data.score}!\n\n` +
    `Join me and climb the leaderboard!`;

  await Sharing.shareAsync(message, {
    dialogTitle: 'Share Achievement',
    UTI: 'public.plain-text',
    mimeType: 'text/plain',
  }).catch(() => {
    // User cancelled — no action needed
  });
}
