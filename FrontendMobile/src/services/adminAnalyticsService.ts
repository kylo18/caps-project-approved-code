/**
 * Admin Analytics Service
 * Handles all admin analytics API endpoints for the CAPS mobile app
 */

import { apiRequest } from './apiClient';

// Types
export interface DashboardSummary {
    average_score: number;
    active_students: number;
    total_exams: number;
    best_score: number;
    lowest_score: number;
    frequently_mistaken_questions_count: number;
    average_attempts_before_passing: number;
    weakest_topic: { name: string; error_rate: number } | null;
    strongest_subject: string | null;
    trend: 'up' | 'down' | 'stable';
}

export interface SubjectScore {
    subject_id: number;
    subject_name: string;
    average_score: number;
    total_exams: number;
}

export interface ProgressPoint {
    date: string;
    score: number;
    exams_taken: number;
}

export interface PassFailRate {
    pass_rate: number;
    fail_rate: number;
    total_passed: number;
    total_failed: number;
}

export interface ImprovementData {
    improvement_percentage: number;
    previous_period_avg: number;
    current_period_avg: number;
}

export interface TopicMastery {
    topic_id: number;
    topic_name: string;
    mastery_level: number; // 0-1 ratio
    total_questions: number;
    correct_answers: number;
}

export interface ContentAnalytics {
    total_questions: number;
    approved_questions: number;
    pending_questions: number;
    total_subjects: number;
    total_topics: number;
    total_lessons: number;
}

/**
 * Get dashboard summary with key metrics
 */
export async function getDashboardSummary(): Promise<{ data: DashboardSummary }> {
    try {
        const response = await apiRequest('/api/admin/analytics/summary');
        const d = response?.data || response || {};

        return {
            data: {
                average_score: Number(d.average_score ?? d.averageScore ?? 0),
                active_students: Number(d.active_students ?? d.activeStudents ?? 0),
                total_exams: Number(d.total_exams ?? d.totalExams ?? 0),
                best_score: Number(d.best_score ?? d.bestScore ?? 0),
                lowest_score: Number(d.lowest_score ?? d.lowestScore ?? 0),
                frequently_mistaken_questions_count: Number(d.frequently_mistaken_questions_count ?? 0),
                average_attempts_before_passing: Number(d.average_attempts_before_passing ?? 0),
                weakest_topic: d.weakest_topic || null,
                strongest_subject: d.strongest_subject || null,
                trend: d.trend || 'stable',
            },
        };
    } catch (error) {
        console.error('Failed to get dashboard summary:', error);
        return {
            data: {
                average_score: 0,
                active_students: 0,
                total_exams: 0,
                best_score: 0,
                lowest_score: 0,
                frequently_mistaken_questions_count: 0,
                average_attempts_before_passing: 0,
                weakest_topic: null,
                strongest_subject: null,
                trend: 'stable',
            },
        };
    }
}

/**
 * Get average score per subject
 */
export async function getAverageScorePerSubject(): Promise<{ data: SubjectScore[] }> {
    try {
        const response = await apiRequest('/api/admin/analytics/average-score-per-subject');
        const items = response?.data || response || [];

        const data = (Array.isArray(items) ? items : []).map((item: any) => ({
            subject_id: item.subjectID || item.subject_id,
            subject_name: item.subjectName || item.subject_name || 'Unknown',
            average_score: Number(Number(item.avg_score ?? item.average_score ?? 0).toFixed(2)),
            total_exams: Number(item.total_exams ?? item.totalExams ?? 0),
        }));

        return { data };
    } catch (error) {
        console.error('Failed to get average score per subject:', error);
        return { data: [] };
    }
}

/**
 * Get student progress over time
 */
export async function getStudentProgressOverTime(days: number = 30): Promise<{ data: ProgressPoint[] }> {
    try {
        const response = await apiRequest(`/api/admin/analytics/student-progress-over-time?days=${days}`);
        const items = response?.data || response || [];

        const data = (Array.isArray(items) ? items : []).map((item: any) => ({
            date: item.date || item.created_at || '',
            score: Number(Number(item.score ?? item.avg_score ?? 0).toFixed(2)),
            exams_taken: Number(item.exams_taken ?? item.count ?? 0),
        }));

        return { data };
    } catch (error) {
        console.error('Failed to get student progress over time:', error);
        return { data: [] };
    }
}

/**
 * Get pass/fail rate statistics
 */
export async function getPassFailRate(): Promise<{ data: PassFailRate }> {
    try {
        const response = await apiRequest('/api/admin/analytics/pass-fail-rate');
        const d = response?.data || response || {};

        return {
            data: {
                pass_rate: Number(d.pass_rate ?? d.passRate ?? 0),
                fail_rate: Number(d.fail_rate ?? d.failRate ?? 0),
                total_passed: Number(d.total_passed ?? d.totalPassed ?? 0),
                total_failed: Number(d.total_failed ?? d.totalFailed ?? 0),
            },
        };
    } catch (error) {
        console.error('Failed to get pass/fail rate:', error);
        return {
            data: {
                pass_rate: 0,
                fail_rate: 0,
                total_passed: 0,
                total_failed: 0,
            },
        };
    }
}

/**
 * Get improvement percentage comparing periods
 */
export async function getImprovementPercentage(): Promise<{ data: ImprovementData }> {
    try {
        const response = await apiRequest('/api/admin/analytics/improvement-percentage');
        const d = response?.data || response || {};

        return {
            data: {
                improvement_percentage: Number(d.improvement_percentage ?? d.improvementPercentage ?? 0),
                previous_period_avg: Number(d.previous_period_avg ?? d.previousPeriodAvg ?? 0),
                current_period_avg: Number(d.current_period_avg ?? d.currentPeriodAvg ?? 0),
            },
        };
    } catch (error) {
        console.error('Failed to get improvement percentage:', error);
        return {
            data: {
                improvement_percentage: 0,
                previous_period_avg: 0,
                current_period_avg: 0,
            },
        };
    }
}

/**
 * Get topic mastery levels
 */
export async function getTopicMasteryLevel(): Promise<{ data: TopicMastery[] }> {
    try {
        const response = await apiRequest('/api/admin/analytics/topic-mastery-level');
        const items = response?.data || response || [];

        const data = (Array.isArray(items) ? items : []).map((item: any) => ({
            topic_id: item.topicID || item.topic_id,
            topic_name: item.topicName || item.topic_name || 'Unknown',
            mastery_level: Number(Number(item.mastery_level ?? item.masteryLevel ?? 0).toFixed(2)),
            total_questions: Number(item.total_questions ?? 0),
            correct_answers: Number(item.correct_answers ?? 0),
        }));

        return { data };
    } catch (error) {
        console.error('Failed to get topic mastery level:', error);
        return { data: [] };
    }
}

/**
 * Get content analytics (questions, subjects, topics, lessons counts)
 */
export async function getContentAnalytics(): Promise<{ data: ContentAnalytics }> {
    try {
        const response = await apiRequest('/api/admin/analytics/content-analytics');
        const d = response?.data || response || {};

        return {
            data: {
                total_questions: Number(d.total_questions ?? d.totalQuestions ?? 0),
                approved_questions: Number(d.approved_questions ?? d.approvedQuestions ?? 0),
                pending_questions: Number(d.pending_questions ?? d.pendingQuestions ?? 0),
                total_subjects: Number(d.total_subjects ?? d.totalSubjects ?? 0),
                total_topics: Number(d.total_topics ?? d.totalTopics ?? 0),
                total_lessons: Number(d.total_lessons ?? d.totalLessons ?? 0),
            },
        };
    } catch (error) {
        console.error('Failed to get content analytics:', error);
        return {
            data: {
                total_questions: 0,
                approved_questions: 0,
                pending_questions: 0,
                total_subjects: 0,
                total_topics: 0,
                total_lessons: 0,
            },
        };
    }
}

/**
 * Fetch all analytics data in parallel (convenience function)
 */
export async function getAllAnalytics(): Promise<{
    summary: DashboardSummary;
    subjectScores: SubjectScore[];
    progress: ProgressPoint[];
    passFail: PassFailRate;
    improvement: ImprovementData;
    topicMastery: TopicMastery[];
    content: ContentAnalytics;
}> {
    const [summaryRes, subjectRes, progressRes, passFailRes, improvementRes, topicRes, contentRes] = await Promise.all([
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
        passFail: passFailRes.data,
        improvement: improvementRes.data,
        topicMastery: topicRes.data,
        content: contentRes.data,
    };
}
