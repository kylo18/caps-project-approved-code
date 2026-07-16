/**
 * Admin Analytics Service
 * Handles all admin analytics API endpoints for the CAPS mobile app.
 * Data models are aligned with the TRUE backend return structures from
 * Modules\Analytics\Controllers\AdminAnalyticsController.php
 */

import { apiRequest } from '../../../../services/apiClient';

// ─────────────────────────────────────────────────────────────────────────────
// Types matching the actual backend JSON responses
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgramStat {
    programName: string;
    programName2?: string;
    count: number;
}

export interface DashboardSummary {
    active_students: number;
    total_students: number;
    total_exams: number;
    average_score: number;          // 0-100
    pass_rate: number;              // Backend returns 0-1 ratio
    improvement_percentage: number;
    fail_rate: number;              // Backend returns 0-1 ratio
    program_stats?: ProgramStat[];
}

export interface PassFailRate {
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;              // Backend returns 0-100 percentage
    breakdown: {
        excellent: number;          // 80%+
        good: number;               // 60-79%
        needs_improvement: number;  // 40-59%
        poor: number;               // <40%
    };
}

export interface ImprovementData {
    current_month_avg: number;
    previous_month_avg: number;
    improvement_percentage: number;
    trend: 'improving' | 'declining' | 'stable';
}

export interface ProgressPoint {
    period: string;                 // e.g. "2025-10" or "2025-10-21"
    avg_score: number;
    student_count: number;
    exam_count: number;
}

export interface SubjectScore {
    subjectID: number;
    subjectName: string;
    avg_score: number;
    exam_count: number;
}

export interface TopicMastery {
    subjectName: string;
    topic: string;
    avg_difficulty: number;
    total_attempts: number;
    avg_attempts: number;
    mastery_level: 'easy' | 'moderate' | 'difficult';
}

export interface ContentAnalytics {
    most_viewed_lessons: Array<{
        lesson_id: number;
        lesson_title: string;
        views: number;
    }>;
    most_attempted_quiz_questions: Array<{
        question_id: number;
        question_preview: string;
        attempts: number;
    }>;
    most_skipped_topics: Array<{
        topic: string;
        skip_count: number;
    }>;
    highest_error_questions: Array<{
        question_id: number;
        question_preview: string;
        error_rate: number;
    }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

function safeNumber(value: any, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get dashboard summary with key metrics.
 * Backend returns pass_rate and fail_rate as 0-1 ratios.
 */
export async function getDashboardSummary(): Promise<{ data: DashboardSummary }> {
    try {
        const response = await apiRequest('/api/admin/analytics/summary');
        const d = response?.data || response || {};

        return {
            data: {
                active_students: safeNumber(d.active_students),
                total_students: safeNumber(d.total_students),
                total_exams: safeNumber(d.total_exams),
                average_score: safeNumber(d.average_score),
                pass_rate: safeNumber(d.pass_rate),              // 0-1 ratio
                improvement_percentage: safeNumber(d.improvement_percentage),
                fail_rate: safeNumber(d.fail_rate),              // 0-1 ratio
                program_stats: d.program_stats,
            },
        };
    } catch (error) {
        console.error('Failed to get dashboard summary:', error);
        return {
            data: {
                active_students: 0,
                total_students: 0,
                total_exams: 0,
                average_score: 0,
                pass_rate: 0,
                improvement_percentage: 0,
                fail_rate: 0,
            },
        };
    }
}

/**
 * Get pass/fail rate statistics.
 * Backend returns: total, passed, failed, pass_rate (0-100), breakdown.
 */
export async function getPassFailRate(): Promise<{ data: PassFailRate }> {
    try {
        const response = await apiRequest('/api/admin/analytics/pass-fail-rate');
        const d = response?.data || response || {};
        const b = d.breakdown || {};

        return {
            data: {
                total: safeNumber(d.total),
                passed: safeNumber(d.passed),
                failed: safeNumber(d.failed),
                pass_rate: safeNumber(d.pass_rate),               // already 0-100
                breakdown: {
                    excellent: safeNumber(b.excellent),
                    good: safeNumber(b.good),
                    needs_improvement: safeNumber(b.needs_improvement),
                    poor: safeNumber(b.poor),
                },
            },
        };
    } catch (error) {
        console.error('Failed to get pass/fail rate:', error);
        return {
            data: {
                total: 0,
                passed: 0,
                failed: 0,
                pass_rate: 0,
                breakdown: { excellent: 0, good: 0, needs_improvement: 0, poor: 0 },
            },
        };
    }
}

/**
 * Get improvement percentage comparing periods.
 */
export async function getImprovementPercentage(): Promise<{ data: ImprovementData }> {
    try {
        const response = await apiRequest('/api/admin/analytics/improvement-percentage');
        const d = response?.data || response || {};

        return {
            data: {
                current_month_avg: safeNumber(d.current_month_avg),
                previous_month_avg: safeNumber(d.previous_month_avg),
                improvement_percentage: safeNumber(d.improvement_percentage),
                trend: d.trend || 'stable',
            },
        };
    } catch (error) {
        console.error('Failed to get improvement percentage:', error);
        return {
            data: {
                current_month_avg: 0,
                previous_month_avg: 0,
                improvement_percentage: 0,
                trend: 'stable',
            },
        };
    }
}

/**
 * Get student progress over time.
 * Backend returns period (string), avg_score, student_count, exam_count.
 */
export async function getStudentProgressOverTime(
    period: 'week' | 'month' = 'week'
): Promise<{ data: ProgressPoint[]; period: string }> {
    try {
        const response = await apiRequest(`/api/admin/analytics/student-progress?period=${period}`);
        const items = response?.data || response || [];
        const resPeriod = response?.period || period;

        const data = (Array.isArray(items) ? items : []).map((item: any) => ({
            period: String(item.period || ''),
            avg_score: safeNumber(item.avg_score),
            student_count: safeNumber(item.student_count),
            exam_count: safeNumber(item.exam_count),
        }));

        return { data, period: resPeriod };
    } catch (error) {
        console.error('Failed to get student progress over time:', error);
        return { data: [], period };
    }
}

/**
 * Get average score per subject.
 * Backend returns subjectID, subjectName, avg_score, exam_count.
 */
export async function getAverageScorePerSubject(): Promise<{ data: SubjectScore[] }> {
    try {
        const response = await apiRequest('/api/admin/analytics/average-score-per-subject');
        const items = response?.data || response || [];

        const data = (Array.isArray(items) ? items : []).map((item: any) => ({
            subjectID: Number(item.subjectID || item.subject_id || 0),
            subjectName: String(item.subjectName || item.subject_name || 'Unknown'),
            avg_score: safeNumber(item.avg_score),
            exam_count: safeNumber(item.exam_count),
        }));

        return { data };
    } catch (error) {
        console.error('Failed to get average score per subject:', error);
        return { data: [] };
    }
}

/**
 * Get topic mastery levels.
 * Backend returns subjectName, topic, avg_difficulty, total_attempts, avg_attempts, mastery_level (STRING).
 */
export async function getTopicMasteryLevel(): Promise<{ data: TopicMastery[] }> {
    try {
        const response = await apiRequest('/api/admin/analytics/topic-mastery');
        const items = response?.data || response || [];

        const data = (Array.isArray(items) ? items : []).map((item: any) => ({
            subjectName: String(item.subjectName || ''),
            topic: String(item.topic || 'Unnamed Topic'),
            avg_difficulty: safeNumber(item.avg_difficulty),
            total_attempts: safeNumber(item.total_attempts),
            avg_attempts: safeNumber(item.avg_attempts),
            mastery_level: (item.mastery_level || 'moderate') as TopicMastery['mastery_level'],
        }));

        return { data };
    } catch (error) {
        console.error('Failed to get topic mastery level:', error);
        return { data: [] };
    }
}

/**
 * Get content analytics.
 * Backend returns most_viewed_lessons, most_attempted_quiz_questions, most_skipped_topics, highest_error_questions.
 */
export async function getContentAnalytics(): Promise<{ data: ContentAnalytics }> {
    try {
        const response = await apiRequest('/api/admin/analytics/content');
        const d = response?.data || response || {};

        return {
            data: {
                most_viewed_lessons: Array.isArray(d.most_viewed_lessons)
                    ? d.most_viewed_lessons.map((item: any) => ({
                          lesson_id: Number(item.lesson_id || 0),
                          lesson_title: String(item.lesson_title || ''),
                          views: safeNumber(item.views),
                      }))
                    : [],
                most_attempted_quiz_questions: Array.isArray(d.most_attempted_quiz_questions)
                    ? d.most_attempted_quiz_questions.map((item: any) => ({
                          question_id: Number(item.question_id || 0),
                          question_preview: String(item.question_preview || ''),
                          attempts: safeNumber(item.attempts),
                      }))
                    : [],
                most_skipped_topics: Array.isArray(d.most_skipped_topics)
                    ? d.most_skipped_topics.map((item: any) => ({
                          topic: String(item.topic || ''),
                          skip_count: safeNumber(item.skip_count),
                      }))
                    : [],
                highest_error_questions: Array.isArray(d.highest_error_questions)
                    ? d.highest_error_questions.map((item: any) => ({
                          question_id: Number(item.question_id || 0),
                          question_preview: String(item.question_preview || ''),
                          error_rate: safeNumber(item.error_rate),
                      }))
                    : [],
            },
        };
    } catch (error) {
        console.error('Failed to get content analytics:', error);
        return {
            data: {
                most_viewed_lessons: [],
                most_attempted_quiz_questions: [],
                most_skipped_topics: [],
                highest_error_questions: [],
            },
        };
    }
}

/**
 * Fetch all analytics data in parallel (convenience function).
 */
export async function getAllAnalytics(): Promise<{
    summary: DashboardSummary;
    subjectScores: SubjectScore[];
    progress: ProgressPoint[];
    progressPeriod: string;
    passFail: PassFailRate;
    improvement: ImprovementData;
    topicMastery: TopicMastery[];
    content: ContentAnalytics;
}> {
    const [
        summaryRes,
        subjectRes,
        progressRes,
        passFailRes,
        improvementRes,
        topicRes,
        contentRes,
    ] = await Promise.all([
        getDashboardSummary(),
        getAverageScorePerSubject(),
        getStudentProgressOverTime(),
        getPassFailRate(),
        getImprovementPercentage(),
        getTopicMasteryLevel(),
        getContentAnalytics(),
    ]);

    return {
        summary: summaryRes.data,
        subjectScores: subjectRes.data,
        progress: progressRes.data,
        progressPeriod: progressRes.period,
        passFail: passFailRes.data,
        improvement: improvementRes.data,
        topicMastery: topicRes.data,
        content: contentRes.data,
    };
}
