import { apiRequest } from './apiClient';

function normalizeList(response: any, key?: string) {
  if (key && Array.isArray(response?.[key])) return response[key];
  if (key && Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function getServiceErrorMessage(error: any, fallback: string) {
  return error?.data?.message || error?.response?.data?.message || error?.message || fallback;
}

function matchesMessage(error: any, text: string) {
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
  } catch (error: any) {
    const notFound = matchesMessage(error, 'class not found');
    const message = notFound
      ? 'Class not found.'
      : getServiceErrorMessage(error, 'Unable to load class students.');

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
  } catch (error: any) {
    const notFound = matchesMessage(error, 'class not found');
    const message = notFound
      ? 'No archived classes'
      : getServiceErrorMessage(error, 'Unable to load archived classes.');

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
    startTime?: string;
    endTime?: string;
  }
) {
  return apiRequest(`/api/class-quizzes/${classPersonalQuizID}/settings`, {
    method: 'PUT',
    body: payload,
  });
}
