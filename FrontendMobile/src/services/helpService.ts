/**
 * Help Service
 * Handles FAQ and support ticket submission for the CAPS mobile app
 */

import { apiRequest } from './apiClient';

// Types
export interface FAQ {
    id: number;
    question: string;
    answer: string;
    category?: string;
    order?: number;
}

export interface SupportTicketPayload {
    subject: string;
    message: string;
    category?: string;
}

export interface AdminAnnouncementPayload {
    type: string;
    title: string;
    message: string;
    targetRoles?: number[];
}

function normalizeFaqItem(item: any, fallbackCategory = 'General'): FAQ {
    return {
        id: item.id || item.faqID || item.faq_id,
        question: item.question || item.q || '',
        answer: item.answer || item.a || '',
        category: item.category || item.category_name || fallbackCategory,
        order: item.order ?? item.displayOrder ?? item.display_order ?? 0,
    };
}

function normalizeFaqList(payload: any): FAQ[] {
    if (Array.isArray(payload)) {
        return payload.map((item) => normalizeFaqItem(item));
    }

    if (payload && typeof payload === 'object') {
        return Object.entries(payload).flatMap(([category, items]) => {
            if (!Array.isArray(items)) {
                return [];
            }

            return items.map((item) => normalizeFaqItem(item, category));
        });
    }

    return [];
}

function getRequestErrorMessage(error: any, fallbackMessage: string): string {
    const data = error?.data || error?.response?.data;
    const validationErrors = data?.errors;

    if (validationErrors && typeof validationErrors === 'object') {
        const firstEntry = Object.values(validationErrors).find((value) => Array.isArray(value) ? value.length > 0 : value);
        if (Array.isArray(firstEntry) && firstEntry[0]) {
            return String(firstEntry[0]);
        }
        if (typeof firstEntry === 'string') {
            return firstEntry;
        }
    }

    return data?.message || error?.message || fallbackMessage;
}

/**
 * Default FAQs used when API is unavailable
 */
const DEFAULT_FAQS: FAQ[] = [
    {
        id: 1,
        question: 'How do I take a practice exam?',
        answer: 'Go to your dashboard, select a subject, and tap on it to start the exam. Answer all questions and submit when done.',
        category: 'Exams',
        order: 1,
    },
    {
        id: 2,
        question: 'Can I retake an exam?',
        answer: 'Yes! You can retake any practice exam as many times as you want to improve your score.',
        category: 'Exams',
        order: 2,
    },
    {
        id: 3,
        question: 'How is my score calculated?',
        answer: 'Your score is based on the number of correct answers divided by total questions, expressed as a percentage.',
        category: 'Scoring',
        order: 3,
    },
    {
        id: 4,
        question: 'What does the leaderboard show?',
        answer: 'Rankings are based on your average score across all practice exams you have completed.',
        category: 'Leaderboard',
        order: 4,
    },
    {
        id: 5,
        question: 'How do I contact support?',
        answer: 'Switch to the "Support" tab in the Help Center and submit a request. Admins will respond as soon as possible.',
        category: 'Support',
        order: 5,
    },
    {
        id: 6,
        question: 'Can I change my password?',
        answer: 'Yes, tap your profile icon in the header and select "Edit Profile" to update your account details.',
        category: 'Account',
        order: 6,
    },
];

/**
 * Get FAQs from API or return defaults
 */
export async function getFAQs(): Promise<{ data: FAQ[] }> {
    try {
        const response = await apiRequest('/api/support/faqs');
        const items = normalizeFaqList(response?.data || response || []);

        if (items.length > 0) {
            const data = [...items];

            // Sort by order
            data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return { data };
        }

        // Return defaults if no data from API
        return { data: DEFAULT_FAQS };
    } catch (error) {
        console.error('Failed to get FAQs, using defaults:', error);
        return { data: DEFAULT_FAQS };
    }
}

/**
 * Submit a support request/ticket
 * For students: creates a support ticket
 * For staff/admins: creates a system announcement
 */
export async function submitSupportRequest(
    payload: SupportTicketPayload,
    userRole?: number
): Promise<{ success: boolean; message: string }> {
    try {
        // Validate input
        if (!payload.subject?.trim() || !payload.message?.trim()) {
            return { success: false, message: 'Please fill in all fields' };
        }

        if (payload.message.trim().length < 10) {
            return { success: false, message: 'Please enter at least 10 characters in your message' };
        }

        // Role 1 = student, sends to support tickets
        // Other roles = staff/admin, sends as announcement
        const isStudent = !userRole || userRole === 1;

        if (isStudent) {
            // Student submits support ticket
            await apiRequest('/api/support-tickets', {
                method: 'POST',
                body: {
                    subject: payload.subject.trim(),
                    message: payload.message.trim(),
                    issue_type: payload.category || 'general',
                },
            });

            return { success: true, message: 'Support request submitted successfully' };
        } else {
            // Staff/admin creates system announcement
            await apiRequest('/api/admin/notifications', {
                method: 'POST',
                body: {
                    type: 'system_announcement',
                    title: payload.subject.trim(),
                    message: payload.message.trim(),
                    target_type: 'all',
                },
            });

            return { success: true, message: 'Announcement posted successfully' };
        }
    } catch (error: any) {
        console.error('Failed to submit support request:', error);
        return {
            success: false,
            message: getRequestErrorMessage(error, 'Failed to submit request. Please try again.'),
        };
    }
}

/**
 * Get help categories (for organizing FAQs)
 */
export async function getHelpCategories(): Promise<{ data: string[] }> {
    try {
        const response = await apiRequest('/api/support/categories');
        const items = response?.data || response || [];

        if (Array.isArray(items) && items.length > 0) {
            return { data: items.map((c: any) => c.name || c.subject || c.category || c) };
        }

        // Default categories
        return {
            data: ['General', 'Exams', 'Scoring', 'Leaderboard', 'Account', 'Support'],
        };
    } catch (error) {
        console.error('Failed to get help categories:', error);
        return {
            data: ['General', 'Exams', 'Scoring', 'Leaderboard', 'Account', 'Support'],
        };
    }
}

/**
 * Search FAQs by query
 */
export async function searchFAQs(query: string): Promise<{ data: FAQ[] }> {
    // Local filtering only — backend search endpoint not available
    const lowerQuery = query.toLowerCase();
    const filtered = DEFAULT_FAQS.filter(
        faq =>
            faq.question.toLowerCase().includes(lowerQuery) ||
            faq.answer.toLowerCase().includes(lowerQuery)
    );
    return { data: filtered };
}

/**
 * Submit feedback about the app
 */
export async function submitFeedback(
    feedback: string,
    rating?: number
): Promise<{ success: boolean }> {
    try {
        await apiRequest('/api/feedback', {
            method: 'POST',
            body: {
                feedback: feedback.trim(),
                rating,
            },
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to submit feedback:', error);
        return { success: false };
    }
}
