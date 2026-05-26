import { apiRequest } from './apiClient';

function normalizeList(response: Record<string, unknown>, key?: string): unknown[] {
  if (key && Array.isArray(response[key])) return response[key] as unknown[];
  if (key && Array.isArray((response.data as Record<string, unknown>)?.[key])) return (response.data as Record<string, unknown>)?.[key] as unknown[];
  if (Array.isArray(response.data)) return response.data as unknown[];
  if (Array.isArray(response)) return response as unknown[];
  return [];
}

function getServiceErrorMessage(error: unknown, fallback: string) {
  const err = error as { data?: { message?: string }; response?: { data?: { message?: string } }; message?: string };
  return err?.data?.message || err?.response?.data?.message || err?.message || fallback;
}

function matchesMessage(error: unknown, text: string) {
  return getServiceErrorMessage(error, '').toLowerCase().includes(text.toLowerCase());
}

export async function getFacultyClasses() {
  const response = await apiRequest('/api/classes/index');
  return normalizeList(response, 'classes');
}

export async function getClassStudents(classID: number | string) {
  try {
    const response = await apiRequest(`/api/classes/${classID}/students`);
    return {
      classInfo: response?.class || response?.data?.class || null,
      students: normalizeList(response, 'students'),
      emptyReason: null,
      message: '',
    };
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; message?: string };
    const notFound = matchesMessage(err, 'class not found');
    const message = notFound
      ? 'Class not found.'
      : getServiceErrorMessage(err, 'Unable to load class students.');

    console.error('Unable to load class students:', message, error);

    return {
      classInfo: null,
      students: [],
      emptyReason: notFound ? 'class_not_found' : 'error',
      message,
    };
  }
}

export async function removeStudentFromClass(classID: number | string, studentID: number | string) {
  return apiRequest(`/api/classes/${classID}/remove-student`, {
    method: 'DELETE',
    body: { studentID },
  });
}

export async function getAssignedClassQuizzes(classID: number | string) {
  const response = await apiRequest(`/api/classes/${classID}/quizzes`);
  return normalizeList(response, 'quizzes');
}

export async function getAvailableClassQuizzes(classID: number | string) {
  if (!classID) return [];
  const response = await apiRequest(`/api/classes/${classID}/quizzes/available`);
  return normalizeList(response, 'quizzes');
}

export async function assignQuizToClass(payload: {
  classID: number | string;
  personalQuizID: number | string;
  startDate?: string | null;
  deadlineDate?: string | null;
}) {
  return apiRequest('/api/classes/quizzes', {
    method: 'POST',
    body: payload,
  });
}

export async function unassignQuizFromClass(classPersonalQuizID: number | string) {
  return apiRequest(`/api/classes/quizzes/${classPersonalQuizID}`, {
    method: 'DELETE',
  });
}

export async function getClassSubjects() {
  const response = await apiRequest('/api/subjects');
  return normalizeList(response, 'subjects');
}

export async function updateFacultyClass(
  classID: number | string,
  payload: {
    className: string;
    subjectID: number;
    description?: string | null;
    schedule?: string | null;
    isActive?: boolean;
  }
) {
  return apiRequest(`/api/classes/${classID}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function archiveFacultyClass(classID: number | string) {
  return apiRequest(`/api/classes/archive/${classID}`, {
    method: 'PATCH',
  });
}

export async function getArchivedClasses() {
  try {
    const response = await apiRequest('/api/classes/archived');
    const classes = normalizeList(response, 'classes');

    return {
      ...response,
      classes,
      emptyReason: classes.length === 0 ? 'empty' : null,
      message: response?.message || '',
    };
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; message?: string };
    const notFound = matchesMessage(err, 'class not found');
    const message = notFound
      ? 'No archived classes'
      : getServiceErrorMessage(err, 'Unable to load archived classes.');

    console.error('Unable to load archived classes:', message, error);

    return {
      success: false,
      classes: [],
      total: 0,
      emptyReason: notFound ? 'class_not_found' : 'error',
      message,
    };
  }
}

export async function unarchiveFacultyClass(classID: number | string) {
  return apiRequest(`/api/classes/${classID}/unarchive`, {
    method: 'PATCH',
  });
}

export async function createFacultyClass(payload: {
  className: string;
  subjectID: number;
  description?: string | null;
  schedule?: string | null;
  isActive?: boolean;
}) {
  return apiRequest('/api/classes', {
    method: 'POST',
    body: payload,
  });
}

export async function updateClassQuizDates(
  classPersonalQuizID: number | string,
  payload: {
    startTime?: string | null;
    endTime?: string | null;
    quizAttempts?: number | null;
  }
) {
  return apiRequest(`/api/class-quizzes/${classPersonalQuizID}/settings`, {
    method: 'PUT',
    body: payload,
  });
}

export async function getPersonalQuizQuestions(personalQuizID: number | string) {
  const response = await apiRequest(`/api/personal-quiz-questions/${personalQuizID}`);
  return {
    questions: Array.isArray(response?.questions) ? response.questions : [],
    total: response?.total ?? 0,
    quiz: response?.quiz || null,
  };
}

// ── Added Admin & Faculty API service functions ───────────────────────────────

export async function getFacultyClassDetail(classID: number | string) {
  return apiRequest(`/api/classes/${classID}`);
}

export async function deleteFacultyClass(classID: number | string) {
  return apiRequest(`/api/classes/${classID}`, {
    method: 'DELETE',
  });
}

export async function updateClassQuiz(id: number | string, payload: any) {
  return apiRequest(`/api/classes/quizzes/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function updateClassQuizSchedule(id: number | string, payload: any) {
  return apiRequest(`/api/classes/quizzes/${id}/dates`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function getClassQuizResults(classID: number | string) {
  const response = await apiRequest(`/api/classes/${classID}/quiz-results`);
  return normalizeList(response, 'results');
}

export async function getQuizResultsForQuiz(quizID: number | string) {
  const response = await apiRequest(`/api/quizzes/${quizID}/results`);
  return normalizeList(response, 'students');
}

export async function getQuizNonTakers(quizID: number | string) {
  const response = await apiRequest(`/api/quizzes/${quizID}/non-takers`);
  return normalizeList(response, 'nonTakers');
}

export async function getQuizClassAssignments(quizID: number | string) {
  const response = await apiRequest(`/api/personal-quizzes/${quizID}/classes`);
  return normalizeList(response, 'assignments');
}

export async function assignQuizToMultipleClasses(quizID: number | string, classIDs: (number | string)[]) {
  return apiRequest(`/api/personal-quizzes/${quizID}/assign-classes`, {
    method: 'POST',
    body: { classIDs },
  });
}

export async function getClassQuizSettings(quizID: number | string) {
  return apiRequest(`/api/class-quizzes/${quizID}/settings`);
}

export async function createClassQuizSettings(quizID: number | string, payload: any) {
  return apiRequest(`/api/class-quizzes/${quizID}/settings`, {
    method: 'POST',
    body: payload,
  });
}

export async function deleteClassQuizSettings(quizID: number | string) {
  return apiRequest(`/api/class-quizzes/${quizID}/settings`, {
    method: 'DELETE',
  });
}

export async function getPersonalQuizLeaderboard(quizID: number | string) {
  const response = await apiRequest(`/api/personal-quiz/${quizID}/leaderboard`);
  return normalizeList(response, 'leaderboard');
}

export async function getPersonalQuizRecentTakers(quizID: number | string) {
  const response = await apiRequest(`/api/personal-quiz/${quizID}/recent-takers`);
  return normalizeList(response, 'recentTakers');
}

export async function getFacultyQuizSessions() {
  const response = await apiRequest('/api/quiz-sessions/faculty-sessions');
  return normalizeList(response, 'sessions');
}

export async function getFacultyClassAnalytics(classId: number | string) {
  return apiRequest(`/api/analytics/faculty/summary/${classId}`);
}

