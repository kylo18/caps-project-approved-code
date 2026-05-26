import { apiRequest } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Class } from '../types';

const MY_CLASSES_CACHE_KEY = 'my_classes_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T) {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // silent fail — StorageManager in cacheService.ts prevents unbounded growth
    // for other managed keys; my_classes_cache is small so direct write is fine
  }
}

export async function invalidateMyClassesCache() {
  await AsyncStorage.removeItem(MY_CLASSES_CACHE_KEY);
}

// ── Enrollment & Discovery ─────────────────────────────────────────────────

export async function getMyClasses() {
  const cached = await getCached<Class[]>(MY_CLASSES_CACHE_KEY);
  if (cached) return { data: cached, fromCache: true };

  const response = await apiRequest('/api/my-classes');
  const classes = response?.data?.classes || response?.classes || [];
  await setCache(MY_CLASSES_CACHE_KEY, classes);
  return { data: classes, fromCache: false };
}

export async function joinClass(classCode: string) {
  const response = await apiRequest('/api/classes/join', {
    method: 'POST',
    body: { classCode: classCode.trim().toUpperCase() },
  });
  await invalidateMyClassesCache();
  return response;
}

export async function unenroll(classID: number | string) {
  const response = await apiRequest(`/api/classes/${classID}/unenroll`, {
    method: 'DELETE',
  });
  await invalidateMyClassesCache();
  return response;
}

// ── Class Quizzes ──────────────────────────────────────────────────────────

export async function getClassQuizzes(classID: number | string) {
  const response = await apiRequest(`/api/classes/${classID}/quizzes/student`);
  return response?.data || response || {};
}

export async function getQuizInfo(classPersonalQuizID: number | string) {
  const response = await apiRequest(`/api/quizzes/${classPersonalQuizID}/info`);
  return response?.data || response || {};
}

export async function startQuiz(classPersonalQuizID: number | string) {
  const response = await apiRequest(`/api/quizzes/${classPersonalQuizID}/start`, {
    method: 'POST',
  });
  return response?.data || response || {};
}

export async function submitQuiz(classPersonalQuizID: number | string, payload: object) {
  const response = await apiRequest(`/api/quizzes/${classPersonalQuizID}/submit`, {
    method: 'POST',
    body: payload,
  });
  return response?.data || response || {};
}

// ── Results & History ──────────────────────────────────────────────────────

export async function getQuizResults() {
  const response = await apiRequest('/api/quiz-results');
  return response?.data || response || [];
}

export async function getQuizResult(resultID: number | string) {
  const response = await apiRequest(`/api/quiz-results/${resultID}`);
  return response?.data || response || {};
}

export async function getClassHistory(classID: number | string) {
  const response = await apiRequest(`/api/classes/${classID}/quiz-history`);
  return response?.history || response?.data || response || [];
}

export async function getQuizHistory(classPersonalQuizID: number | string) {
  const response = await apiRequest(`/api/quizzes/${classPersonalQuizID}/history`);
  return response?.data || response || [];
}

export async function getQuizSessions() {
  const response = await apiRequest('/api/quiz-sessions');
  return response?.data || response || [];
}

// ── Teachers ───────────────────────────────────────────────────────────────

export async function getMyTeachers() {
  const response = await apiRequest('/api/my-teachers');
  return response?.data || response || [];
}

export async function enrollTeacher(teacherID: number | string) {
  const response = await apiRequest('/api/enroll-teacher', {
    method: 'POST',
    body: { teacherID },
  });
  return response?.data || response || {};
}

// ── Added Student API service functions ───────────────────────────────────────

export async function getStudentPracticeSubjects() {
  const response = await apiRequest('/api/student/practice-subjects');
  return response?.data || response || [];
}

export async function getExamPreview(subjectID: number | string) {
  const response = await apiRequest(`/api/subjects/${subjectID}/exam-preview`);
  return response?.data || response || {};
}

export async function getStudentDashboardSubjects() {
  const response = await apiRequest('/api/student/dashboard-subjects');
  return response?.data || response || [];
}

