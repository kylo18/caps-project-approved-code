// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Native share sheet helpers for exam results and leaderboard
//          achievements.
//
// Dependencies: expo-sharing (already installed)
// ─────────────────────────────────────────────────────────────────────────────

import { Share } from 'react-native';
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
  points?: number;
  subjectName?: string | null;
  imageUri?: string;
}

export async function shareExamResult(data: ShareExamResultData) {
  try {
    const message =
      `I scored ${data.percentage}% on ${data.subjectName || 'Practice Exam'}!\n` +
      `Score: ${data.earnedPoints}/${data.totalPoints}\n` +
      `Correct: ${data.correctCount} | Incorrect: ${data.incorrectCount}\n\n` +
      `Try CAPS and test your knowledge too!`;

    await Share.share({
      message,
      title: 'Share Exam Result',
    });
  } catch (error: any) {
    console.error('Failed to share exam result:', error);
    showToast('Failed to share exam result', 'error');
  }
}

export async function shareLeaderboardAchievement(data: ShareLeaderboardData) {
  try {
    // If an image card URI is provided, share the image file using expo-sharing
    if (data.imageUri) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showToast('Sharing is not available on this device', 'error');
        return;
      }
      await Sharing.shareAsync(data.imageUri, {
        dialogTitle: 'Share Achievement Card',
        UTI: 'public.png',
        mimeType: 'image/png',
      });
      return;
    }

    // Fallback: Share plain text message via React Native Share API
    const pts = data.points ?? data.score;
    const subjectPart = data.subjectName ? ` on ${data.subjectName}` : '';
    const message =
      `I ranked #${data.rank}${subjectPart} on the CAPS Leaderboard with ${pts} points!\n\n` +
      `Join me and climb the leaderboard!`;

    await Share.share({
      message,
      title: 'Share Achievement',
    });
  } catch (error: any) {
    console.error('Failed to share leaderboard achievement:', error);
    showToast('Failed to share achievement', 'error');
  }
}
