/**
 * Admin Support Service
 * Handles support ticket management for admin users
 */

import { apiRequest } from './apiClient';

// Types
export interface SupportTicket {
    ticketID: number;
    studentID: number;
    studentName?: string;
    studentEmail?: string;
    subject: string;
    message: string;
    status: 'pending' | 'in_review' | 'resolved';
    priority?: 'low' | 'medium' | 'high';
    created_at: string;
    updated_at?: string;
    resolved_at?: string;
    admin_response?: string;
}

export interface SupportTicketDetail extends SupportTicket {
    userCode?: string;
    program?: string;
    responses?: TicketResponse[];
}

export interface TicketResponse {
    responseID: number;
    ticketID: number;
    adminID: number;
    adminName?: string;
    message: string;
    created_at: string;
}

export interface CreateTicketPayload {
    subject: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTicketPayload {
    status?: 'pending' | 'in_review' | 'resolved';
    priority?: 'low' | 'medium' | 'high';
    admin_response?: string;
}

// Status mapping between UI and API
const STATUS_MAP = {
    // UI -> API
    pending: 'open',
    in_review: 'in_progress',
    resolved: 'closed',
} as const;

const API_TO_UI_STATUS = {
    open: 'pending',
    in_progress: 'in_review',
    closed: 'resolved',
    pending: 'pending',
    in_review: 'in_review',
    resolved: 'resolved',
} as const;

/**
 * Normalize ticket data from API response
 */
function normalizeTicket(item: any): SupportTicket {
    return {
        ticketID: item.ticketID || item.id || item.ticket_id,
        studentID: item.studentID || item.student_id,
        studentName: item.studentName || item.student_name || `${item.firstName || ''} ${item.lastName || ''}`.trim(),
        studentEmail: item.studentEmail || item.email,
        subject: item.subject || 'No Subject',
        message: item.message || '',
        status: API_TO_UI_STATUS[item.status as keyof typeof API_TO_UI_STATUS] || 'pending',
        priority: item.priority || 'medium',
        created_at: item.created_at || item.createdAt || '',
        updated_at: item.updated_at || item.updatedAt,
        resolved_at: item.resolved_at || item.resolvedAt,
        admin_response: item.admin_response || item.adminResponse,
    };
}

/**
 * Get all support tickets
 */
export async function getSupportTickets(): Promise<{ data: SupportTicket[] }> {
    try {
        const response = await apiRequest('/api/admin/support/tickets');
        const items = response?.data || response || [];

        const data = (Array.isArray(items) ? items : []).map(normalizeTicket);

        // Sort by created_at descending (newest first)
        data.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });

        return { data };
    } catch (error) {
        console.error('Failed to get support tickets:', error);
        return { data: [] };
    }
}

/**
 * Get a single support ticket by ID with full details
 */
export async function getSupportTicketById(ticketID: number): Promise<{ data: SupportTicketDetail | null }> {
    try {
        const response = await apiRequest(`/api/admin/support/tickets/${ticketID}`);
        const item = response?.data || response;

        if (!item) return { data: null };

        const data: SupportTicketDetail = {
            ...normalizeTicket(item),
            userCode: item.userCode || item.user_code,
            program: item.program || item.programName,
            responses: (item.responses || []).map((r: any) => ({
                responseID: r.responseID || r.id,
                ticketID: r.ticketID || ticketID,
                adminID: r.adminID || r.admin_id,
                adminName: r.adminName || r.admin_name,
                message: r.message || '',
                created_at: r.created_at || r.createdAt || '',
            })),
        };

        return { data };
    } catch (error) {
        console.error('Failed to get support ticket:', error);
        return { data: null };
    }
}

/**
 * Update support ticket status
 */
export async function updateSupportTicketStatus(
    ticketID: number,
    status: 'pending' | 'in_review' | 'resolved'
): Promise<{ success: boolean; data?: SupportTicket }> {
    try {
        // Map UI status to API status
        const apiStatus = STATUS_MAP[status] || status;

        const response = await apiRequest(`/api/admin/support/tickets/${ticketID}`, {
            method: 'PATCH',
            body: { status: apiStatus },
        });

        const item = response?.data || response;

        return {
            success: true,
            data: normalizeTicket({ ...item, status }),
        };
    } catch (error) {
        console.error('Failed to update ticket status:', error);
        return { success: false };
    }
}

/**
 * Update support ticket with full payload
 */
export async function updateSupportTicket(
    ticketID: number,
    payload: UpdateTicketPayload
): Promise<{ success: boolean; data?: SupportTicket }> {
    try {
        const body: any = {};

        if (payload.status) {
            body.status = STATUS_MAP[payload.status] || payload.status;
        }
        if (payload.priority) {
            body.priority = payload.priority;
        }
        if (payload.admin_response) {
            body.admin_response = payload.admin_response;
        }

        const response = await apiRequest(`/api/admin/support/tickets/${ticketID}`, {
            method: 'PATCH',
            body,
        });

        const item = response?.data || response;

        return {
            success: true,
            data: normalizeTicket(item),
        };
    } catch (error) {
        console.error('Failed to update ticket:', error);
        return { success: false };
    }
}

/**
 * Add response to a support ticket
 */
export async function addTicketResponse(
    ticketID: number,
    message: string
): Promise<{ success: boolean; data?: TicketResponse }> {
    try {
        const response = await apiRequest(`/api/admin/support/tickets/${ticketID}/respond`, {
            method: 'POST',
            body: { message },
        });

        const item = response?.data || response;

        return {
            success: true,
            data: {
                responseID: item.responseID || item.id,
                ticketID,
                adminID: item.adminID || item.admin_id,
                adminName: item.adminName || item.admin_name,
                message: item.message || message,
                created_at: item.created_at || new Date().toISOString(),
            },
        };
    } catch (error) {
        console.error('Failed to add ticket response:', error);
        return { success: false };
    }
}

/**
 * Delete a support ticket
 */
export async function deleteSupportTicket(ticketID: number): Promise<{ success: boolean }> {
    try {
        await apiRequest(`/api/admin/support/tickets/${ticketID}`, {
            method: 'DELETE',
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to delete ticket:', error);
        return { success: false };
    }
}

/**
 * Get next status in the status cycle
 */
export function getNextStatus(currentStatus: string): 'pending' | 'in_review' | 'resolved' {
    switch (currentStatus) {
        case 'pending':
            return 'in_review';
        case 'in_review':
            return 'resolved';
        case 'resolved':
        default:
            return 'pending';
    }
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: string): string {
    switch (status) {
        case 'pending':
            return '#F59E0B'; // yellow/amber
        case 'in_review':
            return '#3B82F6'; // blue
        case 'resolved':
            return '#10B981'; // green
        default:
            return '#F59E0B';
    }
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: string): string {
    switch (status) {
        case 'pending':
            return 'Pending';
        case 'in_review':
            return 'In Review';
        case 'resolved':
            return 'Resolved';
        default:
            return status;
    }
}
