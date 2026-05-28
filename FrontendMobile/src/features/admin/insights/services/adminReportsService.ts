import { apiRequest } from '../../../../services/apiClient';

export interface RecentTaker {
  userID: number | string;
  roleID?: number;
  roleId?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  course?: string;
  year?: string;
  yearLevel?: string;
  studentID?: string;
  totalAttempts?: number;
  totalPoints?: number;
  lastAttemptScore?: number;
  lastAttemptPercentage?: number;
  highestPercentage?: number;
  averagePercentage?: number;
  lastAttemptDate?: string;
  lastAttemptSubject?: {
    subjectName?: string;
    subjectCode?: string;
    subjectID?: number | string;
  } | null;
}

export interface LeaderboardEntry {
  userID: number | string;
  roleID?: number;
  roleId?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  course?: string;
  year?: string;
  yearLevel?: string;
  studentID?: string;
  totalAttempts?: number;
  highestPercentage?: number;
  averagePercentage?: number;
  lastAttemptDate?: string;
}

export interface UserReportTicket {
  id: number | string;
  category?: string;
  subject?: string;
  description?: string;
  status?: string;
  created_at?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    roleID?: number;
    roleId?: number;
  } | null;
}

function normalizeRecentTaker(item: any): RecentTaker {
  return {
    userID: item.userID ?? item.userId ?? item.id ?? `${item.firstName ?? ''}-${item.lastName ?? ''}`,
    roleID: item.roleID,
    roleId: item.roleId,
    firstName: item.firstName,
    lastName: item.lastName,
    name: item.name,
    course: item.course,
    year: item.year,
    yearLevel: item.yearLevel,
    studentID: item.studentID,
    totalAttempts: Number(item.totalAttempts ?? 0),
    totalPoints: Number(item.totalPoints ?? 0),
    lastAttemptScore: Number(item.lastAttemptScore ?? 0),
    lastAttemptPercentage: Number(item.lastAttemptPercentage ?? 0),
    highestPercentage: Number(item.highestPercentage ?? 0),
    averagePercentage: Number(item.averagePercentage ?? 0),
    lastAttemptDate: item.lastAttemptDate,
    lastAttemptSubject: item.lastAttemptSubject
      ? {
          subjectName: item.lastAttemptSubject.subjectName,
          subjectCode: item.lastAttemptSubject.subjectCode,
          subjectID: item.lastAttemptSubject.subjectID,
        }
      : null,
  };
}

function normalizeLeaderboardEntry(item: any): LeaderboardEntry {
  return {
    userID: item.userID ?? item.userId ?? item.id ?? `${item.firstName ?? ''}-${item.lastName ?? ''}`,
    roleID: item.roleID,
    roleId: item.roleId,
    firstName: item.firstName,
    lastName: item.lastName,
    name: item.name,
    course: item.course,
    year: item.year,
    yearLevel: item.yearLevel,
    studentID: item.studentID,
    totalAttempts: Number(item.totalAttempts ?? 0),
    highestPercentage: Number(item.highestPercentage ?? 0),
    averagePercentage: Number(item.averagePercentage ?? 0),
    lastAttemptDate: item.lastAttemptDate,
  };
}

function normalizeUserReport(item: any): UserReportTicket {
  const reporter = item.user || item.student || null;
  return {
    id: item.id ?? item.ticketID ?? item.ticketId,
    category: item.category ?? 'General',
    subject: item.subject ?? 'No Subject',
    description: item.description ?? item.message ?? '',
    status: item.status ?? 'Open',
    created_at: item.created_at ?? item.createdAt,
    user: reporter
      ? {
          firstName: reporter.firstName,
          lastName: reporter.lastName,
          email: reporter.email,
          roleID: reporter.roleID,
          roleId: reporter.roleId,
        }
      : null,
  };
}

export async function getOverallRecentTakers(filters?: { programID?: string; subjectID?: string; facultyID?: string }): Promise<RecentTaker[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.programID) params.set('programID', filters.programID);
    if (filters?.subjectID) params.set('subjectID', filters.subjectID);
    if (filters?.facultyID) params.set('facultyID', filters.facultyID);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiRequest(`/api/practice-exam/overall-recent-takers${query}`);
    const items = response?.recentTakers ?? response?.data ?? response ?? [];
    return Array.isArray(items) ? items.map(normalizeRecentTaker) : [];
  } catch (error) {
    console.error('Failed to get recent takers:', error);
    return [];
  }
}

export async function getOverallLeaderboard(filters?: { programID?: string; subjectID?: string }): Promise<LeaderboardEntry[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.programID) params.set('programID', filters.programID);
    if (filters?.subjectID) params.set('subjectID', filters.subjectID);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiRequest(`/api/practice-exam/overall-leaderboard${query}`);
    const items = response?.leaderboard ?? response?.data ?? response ?? [];
    return Array.isArray(items) ? items.map(normalizeLeaderboardEntry) : [];
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return [];
  }
}

export async function getAllUserReports(): Promise<UserReportTicket[]> {
  try {
    const response = await apiRequest('/api/admin/support/tickets');
    const items = response?.data ?? response ?? [];
    return Array.isArray(items) ? items.map(normalizeUserReport) : [];
  } catch (error) {
    console.error('Failed to get user reports:', error);
    return [];
  }
}
