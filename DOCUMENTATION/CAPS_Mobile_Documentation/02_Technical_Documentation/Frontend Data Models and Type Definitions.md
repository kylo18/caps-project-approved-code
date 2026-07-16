# Frontend Data Models and Type Definitions

## Purpose
This document describes the data models and TypeScript type definitions used by the CAPS mobile frontend. It is based on the current `FrontendMobile/src/types/index.ts` definitions and the mobile app's API response shapes.

## Core type definitions

### `User`
Represents the logged-in user and profile metadata.
- `id?: number`
- `userCode: string`
- `firstName: string`
- `lastName: string`
- `email: string`
- `roleID: number`
- Optional values: `programID`, `yearLevel`, `campus`, `isActive`, `status`
- Allows dynamic properties via `[key: string]: unknown`

### `RoleID`
Role IDs are strongly typed as:
- `1` = Student
- `2` = Faculty
- `3` = Program Chair
- `4` = Dean
- `5` = Associate Dean

The app also uses `ROLE_LABELS` to map IDs to display names.

### `AuthState`
Tracks authentication state in Redux.
- `user: User | null`
- `token: string | null`
- `isAuthenticated: boolean`
- `isLoading: boolean`

## Exam and quiz models

### `Exam`
Represents a quiz or exam payload.
- `id: number`
- `title: string`
- `subjectID: number`
- `subjectName: string`
- `durationMinutes: number`
- `totalQuestions: number`
- `totalPoints: number`
- `enableTimer: boolean`
- `status: string`
- Optional `startTime`, `endTime`

### `Question`
Represents a single exam question.
- `id: number`
- `questionText: string`
- `questionType: 'multiple_choice' | 'true_false' | 'essay' | string`
- `difficulty: 'easy' | 'medium' | 'hard' | string`
- Optional `topic`, `image`, `choices`, `points`

### `Choice`
Represents a possible answer option.
- `id: number`
- `choiceText: string`
- `isCorrect: boolean`

### `QuizResult`
Represents completed quiz performance.
- `id: number`
- `score: number`
- `percentage: number`
- `takenAt: string`
- `subjectName: string`
- Optional `examTitle`

### `ExamState`
Represents local exam session state.
- `currentExam: Exam | null`
- `examQuestions: Question[]`
- `examStartTime: number | null`
- `examState: 'idle' | 'in-progress' | 'completed'`
- `answers: Record<string, string | number | string[]>`
- `bookmarks: number[]`
- `currentQuestionIndex: number`

## Subject and class models

### `Subject`
- `subjectID: number`
- `subjectName: string`
- Optional `subjectCode`, `questionCount`, `description`, `image`

### `Class`
- `id: number`
- `className: string`
- `classCode: string`
- `subjectID: number`
- Optional `subjectName`, `facultyName`, `enrolledCount`, `isArchived`

## Analytics models

### `AnalyticsSummary`
- `average_score: number`
- `total_exams: number`
- `active_students: number`

### `TopicAnalytics`
- `topic: string`
- `score_pct: number`
- `is_weak: boolean`
- `error_rate: number`

### `PerformanceTrend`
- `date: string`
- `score_percentage: number`
- Optional `label`

## Notification and support models

### `Notification`
- `id: number`
- `title: string`
- `body: string`
- `isRead: boolean`
- `createdAt: string`
- Optional `type`

### `SupportTicket`
- `id: number`
- `userID: number`
- Optional `userName`
- `subject: string`
- `message: string`
- `issueType: string`
- `status: string`
- `createdAt: string`
- Optional `updatedAt`

## API response models

### `ApiResponse<T>`
Generic API wrapper used across mobile services.
- Optional `data?: T`
- Optional `message?: string`
- Optional `success?: boolean`

### `PaginatedResponse<T>`
Extends `ApiResponse<T>` with pagination metadata.
- Optional `total?: number`
- Optional `page?: number`
- Optional `limit?: number`

## Offline request models

### `QueuedRequest`
Represents a locally queued API mutation for offline support.
- `id: string`
- `path: string`
- `method: string`
- Optional `body?: unknown`
- `auth: boolean`
- `timestamp: number`

## Usage notes

- The typed models in `FrontendMobile/src/types/index.ts` are shared across services, screens, and Redux slices.
- The mobile app uses `RoleID` and `ROLE_LABELS` to enforce role-specific routes and UI behavior.
- Optional fields reflect data returned by the backend in some endpoints but not all.
- `ApiResponse<T>` and `PaginatedResponse<T>` help keep HTTP service results consistent.

## Referenced files
- `FrontendMobile/src/types/index.ts`
- `FrontendMobile/src/services/apiClient.ts`
- `FrontendMobile/src/store/slices/authSlice.ts`
- `FrontendMobile/src/features/admin/insights/services/adminAnalyticsService.ts`
- `FrontendMobile/src/features/student/insights/services/studentAnalyticsService.ts`
- `FrontendMobile/src/features/support/components/HelpCenterModal.tsx`
