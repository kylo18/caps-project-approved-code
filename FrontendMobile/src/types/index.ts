// ─────────────────────────────────────────────────────────────────────────────
// Domain type definitions for CAPS Mobile
// Replaces inline `any` types with proper TypeScript interfaces.
// ─────────────────────────────────────────────────────────────────────────────

// ── User ──────────────────────────────────────────────────────────────────

export interface User {
  id?: number;
  userCode: string;
  firstName: string;
  lastName: string;
  email: string;
  roleID: number;
  programID?: number;
  yearLevel?: number;
  campus?: string;
  isActive?: boolean;
  status?: string;
  [key: string]: unknown; // allows dynamic property access
}

// ── Roles ─────────────────────────────────────────────────────────────────

/** 1=Student, 2=Faculty, 3=Program Chair, 4=Dean, 5=Associate Dean */
export type RoleID = 1 | 2 | 3 | 4 | 5;

export const ROLE_LABELS: Record<RoleID, string> = {
  1: 'Student',
  2: 'Faculty',
  3: 'Program Chair',
  4: 'Dean',
  5: 'Associate Dean',
};

// ── Auth State ─────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Exam / Quiz ────────────────────────────────────────────────────────────

export interface Exam {
  id: number;
  title: string;
  subjectID: number;
  subjectName: string;
  durationMinutes: number;
  totalQuestions: number;
  totalPoints: number;
  enableTimer: boolean;
  status: string;
  startTime?: string;
  endTime?: string;
}

export interface Question {
  id: number;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'essay' | string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  topic?: string;
  image?: string;
  choices?: Choice[];
  points?: number;
}

export interface Choice {
  id: number;
  choiceText: string;
  isCorrect: boolean;
}

export interface QuizResult {
  id: number;
  score: number;
  percentage: number;
  takenAt: string;
  subjectName: string;
  examTitle?: string;
}

export interface ExamState {
  currentExam: Exam | null;
  examQuestions: Question[];
  examStartTime: number | null;
  examState: 'idle' | 'in-progress' | 'completed';
  answers: Record<string, string | number | string[]>;
  bookmarks: number[];
  currentQuestionIndex: number;
}

// ── Subject ───────────────────────────────────────────────────────────────

export interface Subject {
  subjectID: number;
  subjectName: string;
  subjectCode?: string;
  questionCount?: number;
  description?: string;
  image?: string;
}

// ── Class ──────────────────────────────────────────────────────────────────

export interface Class {
  id: number;
  className: string;
  classCode: string;
  subjectID: number;
  subjectName?: string;
  facultyName?: string;
  enrolledCount?: number;
  isArchived?: boolean;
}

// ── Analytics ─────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  average_score: number;
  total_exams: number;
  active_students: number;
}

export interface TopicAnalytics {
  topic: string;
  score_pct: number;
  is_weak: boolean;
  error_rate: number;
}

export interface PerformanceTrend {
  date: string;
  score_percentage: number;
  label?: string;
}

// ── Notification ───────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

// ── Support Ticket ─────────────────────────────────────────────────────────

export interface SupportTicket {
  id: number;
  userID: number;
  userName?: string;
  subject: string;
  message: string;
  issueType: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

// ── API Shapes ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total?: number;
  page?: number;
  limit?: number;
}

// ── Offline Queue ──────────────────────────────────────────────────────────

export interface QueuedRequest {
  id: string;
  path: string;
  method: string;
  body?: unknown;
  auth: boolean;
  timestamp: number;
}