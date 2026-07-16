import { apiRequest } from './apiClient';

export type LeaderboardPeriod = 'weekly' | 'all_time';

export interface StudentLeaderboardEntry {
  rank: number;
  userID: number;
  student_id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  program?: string | null;
  programID?: number | null;
  subject?: string | null;
  subjectCode?: string | null;
  subjectID?: number | null;
  score: number;
  points: number;
  highestScore: number;
  highestPercentage: number;
  attempts: number;
  resultID?: number | null;
  createdAt?: string | null;
}

export interface StudentLeaderboardViewer {
  userID: number;
  rank: number | null;
  name?: string;
  score?: number;
  highestPercentage?: number;
  attempts?: number;
  program?: string | null;
  subject?: string | null;
  totalCandidates: number;
  betterThanPercentage: number;
  percentile: number;
  period: LeaderboardPeriod;
  periodEndsAt?: string | null;
}

export interface StudentLeaderboardResponse {
  leaderboard: StudentLeaderboardEntry[];
  programs: Array<{ programID: number; programName: string }>;
  subjects: Array<{ subjectID: number; subjectName: string; subjectCode?: string }>;
  viewer: StudentLeaderboardViewer | null;
  meta: {
    total: number;
    period: LeaderboardPeriod;
    periodStartsAt?: string | null;
    periodEndsAt?: string | null;
    programFilter?: string | number | null;
    subjectFilter?: string | number | null;
    generated_from?: string;
  };
}

type LeaderboardParams = {
  period: LeaderboardPeriod;
  programID?: number | null;
  subjectID?: number | null;
  limit?: number;
};

export async function getStudentLeaderboard({
  period,
  programID = null,
  subjectID = null,
  limit = 20,
}: LeaderboardParams): Promise<StudentLeaderboardResponse> {
  const params = new URLSearchParams();
  params.set('period', period);
  params.set('limit', `${limit}`);

  if (programID) {
    params.set('program', `${programID}`);
  }

  if (subjectID) {
    params.set('subject', `${subjectID}`);
  }

  const response = await apiRequest(`/api/leaderboard?${params.toString()}`);

  return {
    leaderboard: Array.isArray(response?.leaderboard) ? response.leaderboard : [],
    programs: Array.isArray(response?.programs) ? response.programs : [],
    subjects: Array.isArray(response?.subjects) ? response.subjects : [],
    viewer: response?.viewer ?? null,
    meta: {
      total: Number(response?.meta?.total ?? 0),
      period: response?.meta?.period === 'weekly' ? 'weekly' : 'all_time',
      periodStartsAt: response?.meta?.periodStartsAt ?? null,
      periodEndsAt: response?.meta?.periodEndsAt ?? null,
      programFilter: response?.meta?.programFilter ?? null,
      subjectFilter: response?.meta?.subjectFilter ?? null,
      generated_from: response?.meta?.generated_from ?? 'database',
    },
  };
}
