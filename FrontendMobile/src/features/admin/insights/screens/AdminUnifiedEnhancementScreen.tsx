import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useRouter } from 'expo-router';
import MobileHeader from '../../../../features/core/components/MobileHeader';
import { useTheme } from '../../../../contexts/ThemeContext';
import { apiRequest } from '../../../../services/apiClient';
import { showToast } from '../../../../hooks/useToast';
import { useScreenFloatingTools } from '../../shared/hooks/useScreenFloatingTools';
import CapsActivityIndicator from '../../../../features/core/components/CapsActivityIndicator';
import {
    getAllAnalytics,
    type DashboardSummary,
    type PassFailRate,
    type ImprovementData,
    type SubjectScore,
    type ProgressPoint,
    type TopicMastery,
    type ContentAnalytics,
} from '../services/adminAnalyticsService';

type Role = 'dean' | 'associate-dean';
type TabKey = 'overview' | 'students' | 'analytics';

const PROGRAMS = ['All', 'BSCpE', 'CE', 'ECE', 'EE'];
const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];
// Scores are fetched separately from /api/admin/analytics/student-scores and merged
// into student objects. Students without exam data will show "—" for scores.

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeProgram(program: any) {
    if (!program) return '';
    const key = program.toString().trim().replace(/\s+/g, '').replace(/[-_]/g, '').toUpperCase();
    if (['BSCPE', 'BSCOE'].includes(key)) return 'BSCpE';
    if (['BSCE', 'CE'].includes(key)) return 'CE';
    if (['BSECE', 'ECE'].includes(key)) return 'ECE';
    if (['BSEE', 'EE'].includes(key)) return 'EE';
    return program.toString().trim();
}

function formatPeriod(period: string, periodType: string) {
    if (!period) return 'N/A';
    if (periodType === 'month') {
        const [y, m] = period.split('-');
        return `${y}-${m}`;
    }
    try {
        return new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return period;
    }
}

function getPerformanceStatus(score: number): 'excellent' | 'good' | 'average' | 'needs support' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'needs support';
}

function fmtPct(value: number): string {
    const n = Number(value);
    return Number.isFinite(n) ? `${n.toFixed(2)}%` : 'N/A';
}

function getStatusTone(status: 'excellent' | 'good' | 'average' | 'needs support') {
    switch (status) {
        case 'excellent':
            return { bg: '#FFF0E0', fg: '#C45E10', label: 'Excellent' };
        case 'good':
            return { bg: '#DCFCE7', fg: '#166534', label: 'Good' };
        case 'average':
            return { bg: '#FEF3C7', fg: '#92400E', label: 'Average' };
        default:
            return { bg: '#FEE2E2', fg: '#991B1B', label: 'Needs Support' };
    }
}

function scoreColor(v: number) {
    if (v >= 80) return '#10B981';
    if (v >= 60) return '#F59E0B';
    return '#EF4444';
}

function initials(name: string) {
    return (name || '?')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

// ── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle, isDark }: { icon: string; title: string; subtitle?: string; isDark: boolean }) {
    return (
        <View className="items-center py-8">
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={40} color={isDark ? '#374151' : '#D1D5DB'} />
            <Text className="mt-3 text-[14px] font-semibold" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                {title}
            </Text>
            {subtitle ? (
                <Text className="mt-1 text-[12px] text-center px-8" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
}

function SectionCard({ title, children, isDark, action }: { title: string; children: React.ReactNode; isDark: boolean; action?: React.ReactNode }) {
    return (
        <View className="rounded-[24px] p-4" style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }}>
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[12px] font-semibold uppercase tracking-[1.2px]" style={{ color: '#FE6902' }}>
                    {title}
                </Text>
                {action}
            </View>
            {children}
        </View>
    );
}

function OverviewMetricCard({
    label,
    value,
    icon,
    color,
    isDark,
}: {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    isDark: boolean;
}) {
    return (
        <View
            className="rounded-[20px] p-4 flex-1 min-w-[47%]"
            style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }}
        >
            <View className="w-10 h-10 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: `${color}18` }}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text className="text-[22px] font-extrabold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                {value}
            </Text>
            <Text className="text-[12px] mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                {label}
            </Text>
        </View>
    );
}

/** Circular progress indicator for pass/fail */
function PassFailRing({ passed, failed, size = 90 }: { passed: number; failed: number; size?: number }) {
    const total = passed + failed;
    const passPct = total > 0 ? Math.round((passed / total) * 100) : 0;
    const ringColor = passPct >= 75 ? '#10B981' : passPct >= 50 ? '#F59E0B' : '#EF4444';

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: ringColor + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <View
                    style={{
                        width: size * 0.72,
                        height: size * 0.72,
                        borderRadius: (size * 0.72) / 2,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: ringColor,
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 3,
                    }}
                >
                    <Text className="text-[18px] font-extrabold" style={{ color: ringColor }}>
                        {passPct}%
                    </Text>
                    <Text className="text-[10px]" style={{ color: '#9CA3AF' }}>
                        Pass
                    </Text>
                </View>
            </View>
        </View>
    );
}

function ProgressLineChart({
    points,
    periodType,
    isDark,
}: {
    points: ProgressPoint[];
    periodType: string;
    isDark: boolean;
}) {
    const { width } = useWindowDimensions();
    const chartWidth = Math.min(width - 64, 360);
    const chartHeight = 132;
    const paddingX = 18;
    const paddingY = 18;
    const usableWidth = chartWidth - paddingX * 2;
    const usableHeight = chartHeight - paddingY * 2;
    const ordered = points.filter((point) => point.exam_count > 0).slice(-6);
    const maxScore = Math.max(100, ...ordered.map((point) => point.avg_score));
    const minScore = Math.min(0, ...ordered.map((point) => point.avg_score));
    const range = Math.max(1, maxScore - minScore);

    const plotted = ordered.map((point, index) => {
        const x = paddingX + (ordered.length === 1 ? usableWidth / 2 : (index / (ordered.length - 1)) * usableWidth);
        const y = paddingY + usableHeight - ((point.avg_score - minScore) / range) * usableHeight;
        return { ...point, x, y };
    });

    const polyline = plotted.map((point) => `${point.x},${point.y}`).join(' ');
    const lineColor = '#FE6902';
    const gridColor = isDark ? '#2A2A2A' : '#E5E7EB';

    return (
        <View
            className="rounded-[22px] px-3 py-3"
            style={{ backgroundColor: isDark ? '#242424' : '#FFF7ED' }}
        >
            <View className="flex-row items-center justify-between mb-2">
                <View>
                    <Text className="text-[13px] font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                        Average Score Trend
                    </Text>
                    <Text className="text-[11px] mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        {ordered.length} recent {periodType === 'month' ? 'months' : 'periods'}
                    </Text>
                </View>
                <Text className="text-[18px] font-extrabold" style={{ color: lineColor }}>
                    {fmtPct(ordered[ordered.length - 1]?.avg_score ?? 0)}
                </Text>
            </View>

            <Svg width={chartWidth} height={chartHeight}>
                {[0.25, 0.5, 0.75].map((ratio) => (
                    <Line
                        key={ratio}
                        x1={paddingX}
                        x2={chartWidth - paddingX}
                        y1={paddingY + usableHeight * ratio}
                        y2={paddingY + usableHeight * ratio}
                        stroke={gridColor}
                        strokeWidth={1}
                    />
                ))}
                {plotted.length > 1 ? (
                    <Polyline points={polyline} fill="none" stroke={lineColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                ) : null}
                {plotted.map((point) => (
                    <Circle key={point.period} cx={point.x} cy={point.y} r={4} fill={lineColor} />
                ))}
            </Svg>

            <View className="flex-row justify-between -mt-1">
                {plotted.map((point) => (
                    <Text key={point.period} className="text-[10px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        {formatPeriod(point.period, periodType)}
                    </Text>
                ))}
            </View>
        </View>
    );
}

const StudentListItem = React.memo(({ student, index, isDark }: {
    student: any;
    index: number;
    isDark: boolean;
}) => {
    const name = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || `Student ${index + 1}`;
    const program = normalizeProgram(student.program || student.programName) || 'Unassigned';
    const email = student.email || 'No email';
    const isActive = student.isActive ?? true;
    const rawScore = student.average_score ?? student.score ?? student.latest_score ?? student.overall_score ?? null;
    const hasScore = Number.isFinite(Number(rawScore)) && Number(rawScore) > 0;
    const scoreDisplay = hasScore ? fmtPct(Number(rawScore)) : '—';
    const scoreColorValue = hasScore ? scoreColor(Number(rawScore)) : (isDark ? '#6B7280' : '#9CA3AF');

    return (
        <View className="rounded-[24px] p-4 mb-3" style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }}>
            <View className="flex-row items-start justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#FFF0E0' }}>
                        <Text className="text-[13px] font-bold" style={{ color: '#C45E10' }}>
                            {initials(name)}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-[15px] font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                            {name}
                        </Text>
                        <Text className="text-[12px] mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                            {email}
                        </Text>
                    </View>
                </View>
                <View className="rounded-full px-3 py-1" style={{ backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' }}>
                    <Text style={{ color: isActive ? '#166534' : '#991B1B', fontSize: 11, fontWeight: '700' }}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between mt-4 pt-3" style={{ borderTopWidth: 1, borderTopColor: isDark ? '#2A2A2A' : '#F3F4F6' }}>
                <View>
                    <Text className="text-[11px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        Program
                    </Text>
                    <Text className="text-[14px] font-semibold mt-0.5" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                        {program}
                    </Text>
                </View>
                <View>
                    <Text className="text-[11px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        Score
                    </Text>
                    <Text className="text-[14px] font-semibold mt-0.5" style={{ color: scoreColorValue }}>
                        {scoreDisplay}
                    </Text>
                </View>
                <View>
                    <Text className="text-[11px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        Status
                    </Text>
                    <Text className="text-[14px] font-semibold mt-0.5" style={{ color: isActive ? '#10B981' : '#EF4444' }}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>
        </View>
    );
});

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminUnifiedEnhancementScreen({ role, initialTab = 'overview' }: { role: Role; initialTab?: TabKey }) {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const roleBaseRoute = `/(auth)/(${role})`;

    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeProgram, setActiveProgram] = useState('All');
    // const [statusFilter, setStatusFilter] = useState<'all'>('all');

    // Data states
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [passFail, setPassFail] = useState<PassFailRate | null>(null);
    const [improvement, setImprovement] = useState<ImprovementData | null>(null);
    const [subjects, setSubjects] = useState<SubjectScore[]>([]);
    const [progress, setProgress] = useState<ProgressPoint[]>([]);
    const [progressPeriod, setProgressPeriod] = useState('week');
    const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
    const [content, setContent] = useState<ContentAnalytics | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [studentCount, setStudentCount] = useState(0);
    const [studentPage, setStudentPage] = useState(1);
    const [hasMoreStudents, setHasMoreStudents] = useState(true);
    const [loadingMoreStudents, setLoadingMoreStudents] = useState(false);
    const [loadingStudentsTab, setLoadingStudentsTab] = useState(false);
    const [studentScores, setStudentScores] = useState<Map<number | string, number>>(new Map());
    const [activeYear, setActiveYear] = useState('All');

    const fetchedTabs = useRef<Set<TabKey>>(new Set());

    const fetchOverview = useCallback(async () => {
        if (fetchedTabs.current.has('overview')) return;
        fetchedTabs.current.add('overview');
        setError(null);
        try {
            const analytics = await getAllAnalytics();
            setSummary(analytics.summary);
            setPassFail(analytics.passFail);
            setImprovement(analytics.improvement);
            setSubjects(analytics.subjectScores);
            setProgress(analytics.progress);
            setProgressPeriod(analytics.progressPeriod);
            setTopicMastery(analytics.topicMastery);
            setContent(analytics.content);
        } catch (err: any) {
            console.error('Failed to load enhancement screen:', err);
            setError(err?.message || 'Failed to load analytics data');
            showToast('Failed to load enhancement and analytics data.', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchStudents = useCallback(async () => {
        if (fetchedTabs.current.has('students')) return;
        fetchedTabs.current.add('students');
        setLoadingStudentsTab(true);
        try {
            const [usersRes, scoresRes] = await Promise.all([
                apiRequest('/api/users?role=Student&limit=20&page=1'),
                apiRequest('/api/admin/analytics/student-scores'),
            ]);

            const payload = usersRes;
            const list = Array.isArray(payload?.users)
                ? payload.users
                : Array.isArray(payload?.data)
                    ? payload.data
                    : [];

            const scoresData = Array.isArray(scoresRes?.data) ? scoresRes.data : [];
            const scoresMap = new Map<number | string, number>();
            for (const s of scoresData) {
                if (s.userID != null && s.average_score != null) {
                    scoresMap.set(s.userID, Number(s.average_score));
                }
            }
            const merged = list.map((u: any) => ({
                ...u,
                average_score: scoresMap.get(u.userID) ?? null,
            }));

            setStudents(merged);
            setStudentScores(scoresMap);
            const total = Number(payload?.total);
            setStudentCount(Number.isFinite(total) ? total : list.length);
            setStudentPage(1);
            setHasMoreStudents(list.length >= 20);
        } catch (e) {
            console.error('Failed to fetch students:', e);
            setStudents([]);
            setStudentCount(0);
        } finally {
            setLoadingStudentsTab(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'overview' || activeTab === 'analytics') fetchOverview();
        else if (activeTab === 'students') fetchStudents();
    }, [activeTab, fetchOverview, fetchStudents]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchedTabs.current.clear();
        if (activeTab === 'overview' || activeTab === 'analytics') fetchOverview();
        else if (activeTab === 'students') fetchStudents();
    }, [activeTab, fetchOverview, fetchStudents]);

    const loadMoreStudents = useCallback(async () => {
        if (!hasMoreStudents || loadingMoreStudents) return;
        setLoadingMoreStudents(true);
        try {
            const nextPage = studentPage + 1;
            const [usersRes, scoresRes] = await Promise.all([
                apiRequest(`/api/users?role=Student&limit=20&page=${nextPage}`),
                apiRequest('/api/admin/analytics/student-scores'),
            ]);
            const payload = usersRes;
            const list = Array.isArray(payload?.users)
                ? payload.users
                : Array.isArray(payload?.data)
                    ? payload.data
                    : [];

            const scoresData = Array.isArray(scoresRes?.data) ? scoresRes.data : [];
            const scoresMap = new Map<number | string, number>();
            for (const s of scoresData) {
                if (s.userID != null && s.average_score != null) {
                    scoresMap.set(s.userID, Number(s.average_score));
                }
            }
            const merged = list.map((u: any) => ({
                ...u,
                average_score: scoresMap.get(u.userID) ?? null,
            }));

            setStudents(prev => [...prev, ...merged]);
            setStudentPage(nextPage);
            setHasMoreStudents(list.length >= 20);
        } catch {
            // ignore — pagination errors are non-critical
        } finally {
            setLoadingMoreStudents(false);
        }
    }, [hasMoreStudents, loadingMoreStudents, studentPage]);

    // ── Derived data ─────────────────────────────────────────────────────────

    const hasExamData = (summary?.total_exams ?? 0) > 0;
    const hasCurrentMonthData = (improvement?.current_month_avg ?? 0) > 0;

    const metrics = useMemo(() => {
        if (!summary) return [];
        return [
            {
                label: 'Students',
                value: String(studentCount || summary.total_students || 0),
                icon: 'people-outline' as const,
                color: '#3B82F6',
            },
            {
                label: 'Avg Score',
                value: summary.total_exams > 0 ? fmtPct(summary.average_score) : 'N/A',
                icon: 'analytics-outline' as const,
                color: '#FE6902',
            },
            {
                label: 'Pass Rate',
                value: summary.total_exams > 0 ? fmtPct(summary.pass_rate * 100) : 'N/A',
                icon: 'checkmark-circle-outline' as const,
                color: '#10B981',
            },
            {
                label: 'Improvement',
                value:
                    summary.total_exams > 0
                        ? `${summary.improvement_percentage > 0 ? '+' : ''}${fmtPct(summary.improvement_percentage)}`
                        : 'N/A',
                icon: 'trending-up-outline' as const,
                color: '#8B5CF6',
            },
        ];
    }, [summary, studentCount]);

    const programStats = useMemo(() => {
        const stats = summary?.program_stats;
        if (stats && Array.isArray(stats)) {
            return PROGRAMS.filter((p) => p !== 'All').map((program) => {
                let count = 0;
                for (const ps of stats) {
                    const normalizedBackend = normalizeProgram(ps.programName || ps.programName2);
                    if (normalizedBackend === program) {
                        count += ps.count;
                    }
                }
                return { program, count };
            });
        }
        return PROGRAMS.filter((p) => p !== 'All').map((program) => {
            const items = students.filter((s) => normalizeProgram(s.program || s.programName) === program);
            return { program, count: items.length };
        });
    }, [summary, students]);

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const program = normalizeProgram(student.program || student.programName);
            const matchesProgram = activeProgram === 'All' || program === activeProgram;
            const name = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim();
            const matchesSearch =
                !debouncedSearch.trim() ||
                name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                String(student.email ?? '').toLowerCase().includes(debouncedSearch.toLowerCase());
            const yearValue = student.yearLevel ?? student.student_profile?.year_level ?? student.studentProfile?.yearLevel;
            const yearNum = Number(yearValue);
            const yearMap: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };
            const yearLabel = yearMap[yearNum] || '';
            const matchesYear = activeYear === 'All' || yearLabel === activeYear;
            return matchesProgram && matchesSearch && matchesYear;
        });
    }, [activeProgram, activeYear, debouncedSearch, students]);

    const topSubjects = useMemo(() => {
        return subjects
            .filter((s) => s.exam_count > 0)
            .sort((a, b) => b.avg_score - a.avg_score)
            .slice(0, 5);
    }, [subjects]);

    const recentProgress = useMemo(() => {
        return progress
            .filter((p) => p.exam_count > 0)
            .slice(-5)
            .reverse();
    }, [progress]);

    // ── FAB actions ──────────────────────────────────────────────────────────
    const fabActions = useMemo(() => {
        const roleTail =
            role === 'dean'
                ? {
                    key: 'unified-support',
                    icon: 'headset-outline' as const,
                    label: 'Support',
                    onPress: () => router.push(`${roleBaseRoute}/support` as string),
                    backgroundColor: '#EF4444',
                }
                : {
                    key: 'unified-export',
                    icon: 'print-outline' as const,
                    label: 'Export',
                    onPress: () => router.push(`${roleBaseRoute}/subjects` as string),
                    backgroundColor: '#8B5CF6',
                };

        return [
            {
                key: 'unified-insights',
                icon: 'grid-outline' as const,
                label: 'Insights Hub',
                onPress: () => router.push(`${roleBaseRoute}/insights` as string),
                backgroundColor: '#3B82F6',
            },
            roleTail,
        ];
    }, [role, roleBaseRoute, router]);

    useScreenFloatingTools(fabActions);

    // ── Loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View className={`flex-1 justify-center items-center ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-100'}`}>
                <CapsActivityIndicator size="large" color="#FE6902" />
            </View>
        );
    }

    // ── Error state ──────────────────────────────────────────────────────────
    if (error) {
        return (
            <View className={`flex-1 items-center justify-center px-6 ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-100'}`}>
                <MobileHeader title="Analytics Overview" />
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="alert-circle-outline" size={56} color="#EF4444" />
                    <Text className="mt-4 text-[16px] font-semibold text-center" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                        Something went wrong
                    </Text>
                    <Text className="mt-2 text-[13px] text-center" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        {error}
                    </Text>
                    <Pressable
                        onPress={() => {
                            setLoading(true);
                            fetchedTabs.current.clear();
                            if (activeTab === 'overview' || activeTab === 'analytics') fetchOverview();
                            else if (activeTab === 'students') fetchStudents();
                        }}
                        className="mt-6 rounded-full px-6 py-3"
                        style={{ backgroundColor: '#FE6902' }}
                    >
                        <Text className="text-white font-semibold text-[14px]">Retry</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────
    const renderHeaderAndTabs = () => (
        <View style={{ gap: 16 }}>
            {/* Tab pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {(
                    [
                        { key: 'overview', label: 'Overview', icon: 'home-outline' },
                        { key: 'students', label: 'Students', icon: 'people-outline' },
                        { key: 'analytics', label: 'Analytics', icon: 'analytics-outline' },
                    ] as const
                ).map((tab) => (
                    <Pressable
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key)}
                        className="rounded-full px-4 py-2.5 flex-row items-center"
                        style={{
                            backgroundColor: activeTab === tab.key ? '#FE6902' : isDark ? '#1A1A1A' : '#FFFFFF',
                            minHeight: 44,
                        }}
                    >
                        <Ionicons
                            name={tab.icon}
                            size={16}
                            color={activeTab === tab.key ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280'}
                        />
                        <Text
                            className="ml-2 text-[13px] font-semibold"
                            style={{ color: activeTab === tab.key ? '#FFFFFF' : isDark ? '#D1D5DB' : '#4B5563' }}
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <View className={`flex-1 ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-100'}`}>
            <MobileHeader title="Analytics Overview" showBack onBack={() => router.push(`${roleBaseRoute}/insights` as string)} />

            {activeTab === 'overview' || activeTab === 'analytics' ? (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 16 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FE6902" />}
                >
                    {renderHeaderAndTabs()}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' ? (
                        <View style={{ gap: 16 }}>
                            {/* KPI Cards */}
                            <View className="flex-row flex-wrap gap-3">
                                {metrics.map((metric) => (
                                    <OverviewMetricCard
                                        key={metric.label}
                                        label={metric.label}
                                        value={metric.value}
                                        icon={metric.icon}
                                        color={metric.color}
                                        isDark={isDark}
                                    />
                                ))}
                            </View>

                            {/* Trend Snapshot */}
                            <SectionCard title="Trend Snapshot" isDark={isDark}>
                                {!hasExamData ? (
                                    <EmptyState
                                        icon="trending-up-outline"
                                        title="No trend data yet"
                                        subtitle="Student exam results will appear here once practice exams are taken."
                                        isDark={isDark}
                                    />
                                ) : !hasCurrentMonthData ? (
                                    <EmptyState
                                        icon="trending-up-outline"
                                        title="No exams this month"
                                        subtitle="Student exam results for the current month will appear here once practice exams are taken."
                                        isDark={isDark}
                                    />
                                ) : (
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-1 mr-3">
                                            <Text className="text-[16px] font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                {improvement && improvement.improvement_percentage >= 0
                                                    ? 'Improving performance'
                                                    : 'Performance declined'}
                                            </Text>
                                            <Text className="text-[13px] mt-2 leading-5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                                Current average {fmtPct(improvement?.current_month_avg ?? summary?.average_score ?? 0)}
                                                versus previous average {fmtPct(improvement?.previous_month_avg ?? 0)}.
                                            </Text>
                                        </View>
                                        <View
                                            className="rounded-full px-4 py-2"
                                            style={{
                                                backgroundColor:
                                                    improvement && improvement.improvement_percentage >= 0 ? '#DCFCE7' : '#FEE2E2',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: improvement && improvement.improvement_percentage >= 0 ? '#166534' : '#991B1B',
                                                    fontSize: 14,
                                                    fontWeight: '800',
                                                }}
                                            >
                                                {improvement && improvement.improvement_percentage > 0 ? '+' : ''}
                                                {fmtPct(improvement?.improvement_percentage ?? 0)}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </SectionCard>

                            {/* Pass vs Fail */}
                            <SectionCard title="Pass vs Fail" isDark={isDark}>
                                {!passFail || passFail.total === 0 ? (
                                    <EmptyState
                                        icon="pie-chart-outline"
                                        title="No pass/fail data"
                                        subtitle="Exam results will populate this section once students take practice exams."
                                        isDark={isDark}
                                    />
                                ) : (
                                    <View>
                                        <View className="flex-row items-center justify-between mb-4">
                                            <PassFailRing passed={passFail.passed} failed={passFail.failed} />
                                            <View className="flex-1 ml-5 gap-3">
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center gap-2">
                                                        <View className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10B981' }} />
                                                        <Text className="text-[13px]" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                                                            Passed
                                                        </Text>
                                                    </View>
                                                    <Text className="text-[13px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                        {passFail.passed}
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center gap-2">
                                                        <View className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#EF4444' }} />
                                                        <Text className="text-[13px]" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                                                            Failed
                                                        </Text>
                                                    </View>
                                                    <Text className="text-[13px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                        {passFail.failed}
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center gap-2">
                                                        <View className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FE6902' }} />
                                                        <Text className="text-[13px]" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                                                            Pass Rate
                                                        </Text>
                                                    </View>
                                                    <Text className="text-[13px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                        {Math.round(passFail.pass_rate)}%
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        {/* Score breakdown */}
                                        <View className="gap-2 mt-1">
                                            {[
                                                { label: 'Excellent (≥80%)', val: passFail.breakdown.excellent, color: '#C45E10' },
                                                { label: 'Good (60–79%)', val: passFail.breakdown.good, color: '#10B981' },
                                                { label: 'Needs improvement (40–59%)', val: passFail.breakdown.needs_improvement, color: '#F59E0B' },
                                                { label: 'Poor (<40%)', val: passFail.breakdown.poor, color: '#EF4444' },
                                            ].map((r) => {
                                                const pct = passFail.total > 0 ? Math.round((r.val / passFail.total) * 100) : 0;
                                                return (
                                                    <View key={r.label} className="flex-row items-center gap-2">
                                                        <Text className="text-[11px] w-40" numberOfLines={1} style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                                            {r.label}
                                                        </Text>
                                                        <View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }}>
                                                            <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.color }} />
                                                        </View>
                                                        <Text className="text-[11px] font-medium w-14 text-right" style={{ color: r.color }}>
                                                            {r.val}{' '}
                                                            <Text style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}>({pct}%)</Text>
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}
                            </SectionCard>

                            {/* Program Performance */}
                            <SectionCard title="Program Performance" isDark={isDark}>
                                {programStats.every((p) => p.count === 0) ? (
                                    <EmptyState
                                        icon="school-outline"
                                        title="No program data"
                                        subtitle="Students will appear here once they are enrolled and take exams."
                                        isDark={isDark}
                                    />
                                ) : (
                                    <View className="gap-3">
                                        {programStats.map((row) => (
                                            <Pressable
                                                key={row.program}
                                                onPress={() => {
                                                    setActiveProgram(row.program);
                                                    setActiveTab('students');
                                                }}
                                                className="flex-row items-center justify-between py-2"
                                                style={{ minHeight: 44 }}
                                            >
                                                <View className="flex-1">
                                                    <Text className="text-[14px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                        {row.program}
                                                    </Text>
                                                    <Text className="text-[12px] mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                                        {row.count} student{row.count === 1 ? '' : 's'}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={18} color={isDark ? '#4B5563' : '#9CA3AF'} />
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            </SectionCard>
                        </View>
                    ) : null}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' ? (
                        <View style={{ gap: 16 }}>
                            {/* Content Summary */}
                            <SectionCard title="Content Summary" isDark={isDark}>
                                {!content ||
                                    (content.most_viewed_lessons.length === 0 &&
                                        content.most_attempted_quiz_questions.length === 0) ? (
                                    <EmptyState
                                        icon="document-text-outline"
                                        title="No content analytics yet"
                                        subtitle="Content engagement data will appear here as students interact with lessons and quizzes."
                                        isDark={isDark}
                                    />
                                ) : (
                                    <View className="gap-4">
                                        {content.most_viewed_lessons.length > 0 && (
                                            <View>
                                                <Text className="text-[13px] font-semibold mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                    Most Viewed Lessons
                                                </Text>
                                                {content.most_viewed_lessons.slice(0, 3).map((item, i) => (
                                                    <View key={i} className="flex-row items-center justify-between py-2">
                                                        <Text className="text-[13px] flex-1 mr-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }} numberOfLines={1}>
                                                            {item.lesson_title}
                                                        </Text>
                                                        <Text className="text-[13px] font-semibold" style={{ color: '#3B82F6' }}>
                                                            {item.views} views
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                        {content.most_attempted_quiz_questions.length > 0 && (
                                            <View>
                                                <Text className="text-[13px] font-semibold mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                    Most Attempted Questions
                                                </Text>
                                                {content.most_attempted_quiz_questions.slice(0, 3).map((item, i) => (
                                                    <View key={i} className="flex-row items-center justify-between py-2">
                                                        <Text className="text-[13px] flex-1 mr-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }} numberOfLines={1}>
                                                            {item.question_preview}
                                                        </Text>
                                                        <Text className="text-[13px] font-semibold" style={{ color: '#8B5CF6' }}>
                                                            {item.attempts}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                        {content.most_skipped_topics.length > 0 && (
                                            <View>
                                                <Text className="text-[13px] font-semibold mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                    Most Skipped Topics
                                                </Text>
                                                {content.most_skipped_topics.slice(0, 3).map((item, i) => (
                                                    <View key={i} className="flex-row items-center justify-between py-2">
                                                        <Text className="text-[13px] flex-1 mr-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }} numberOfLines={1}>
                                                            {item.topic}
                                                        </Text>
                                                        <Text className="text-[13px] font-semibold" style={{ color: '#F59E0B' }}>
                                                            {item.skip_count} skips
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </SectionCard>

                            {/* Top Subjects */}
                            <SectionCard title="Top Subjects" isDark={isDark}>
                                {topSubjects.length === 0 ? (
                                    <EmptyState
                                        icon="book-outline"
                                        title="No subject data yet"
                                        subtitle="Subject performance will appear once students complete practice exams."
                                        isDark={isDark}
                                    />
                                ) : (
                                    <View className="gap-3">
                                        {topSubjects.map((subject, index) => (
                                            <View key={subject.subjectID} className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1 mr-3">
                                                    <Text className="text-[12px] font-bold w-6" style={{ color: '#9CA3AF' }}>
                                                        {index + 1}
                                                    </Text>
                                                    <View className="flex-1">
                                                        <Text className="text-[14px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                            {subject.subjectName}
                                                        </Text>
                                                        <Text className="text-[12px] mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                                            {subject.exam_count} exam{subject.exam_count === 1 ? '' : 's'}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text className="text-[16px] font-bold" style={{ color: scoreColor(subject.avg_score) }}>
                                                    {fmtPct(subject.avg_score)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </SectionCard>

                            {/* Weakest Topics */}
                            <SectionCard title="Weakest Topics" isDark={isDark}>
                                {topicMastery.length === 0 ? (
                                    <EmptyState
                                        icon="alert-circle-outline"
                                        title="No topic mastery data"
                                        subtitle="Topic difficulty analytics will appear as students attempt more questions."
                                        isDark={isDark}
                                    />
                                ) : (
                                    <View className="gap-4">
                                        {topicMastery.slice(0, 5).map((item, index) => {
                                            const difficultyColor =
                                                item.mastery_level === 'difficult'
                                                    ? '#EF4444'
                                                    : item.mastery_level === 'moderate'
                                                        ? '#F59E0B'
                                                        : '#10B981';
                                            return (
                                                <View key={index}>
                                                    <View className="flex-row items-center justify-between mb-2">
                                                        <View className="flex-1 mr-3">
                                                            <Text className="text-[14px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                                {item.topic}
                                                            </Text>
                                                            <Text className="text-[12px] mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                                                {item.subjectName}
                                                            </Text>
                                                        </View>
                                                        <View className="flex-row items-center gap-2">
                                                            <View
                                                                className="rounded-full px-2.5 py-0.5"
                                                                style={{ backgroundColor: `${difficultyColor}18` }}
                                                            >
                                                                <Text style={{ color: difficultyColor, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>
                                                                    {item.mastery_level}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }}>
                                                        <View
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${Math.min(100, Math.round(item.avg_difficulty * 100))}%`,
                                                                backgroundColor: difficultyColor,
                                                            }}
                                                        />
                                                    </View>
                                                    <Text className="text-[11px] mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                                        {item.total_attempts} total attempts · avg {item.avg_attempts.toFixed(1)} tries
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </SectionCard>

                            {/* Recent Progress */}
                            <SectionCard title="Recent Progress" isDark={isDark}>
                                {recentProgress.length === 0 ? (
                                    <EmptyState
                                        icon="time-outline"
                                        title="No recent progress"
                                        subtitle="Progress over time will be tracked as students take more exams."
                                        isDark={isDark}
                                    />
                                ) : (
                                    <View className="gap-3">
                                        <ProgressLineChart
                                            points={progress}
                                            periodType={progressPeriod}
                                            isDark={isDark}
                                        />
                                        {recentProgress.map((point, index) => (
                                            <View key={index} className="flex-row items-center justify-between">
                                                <View className="flex-1 mr-3">
                                                    <Text className="text-[14px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                                        {formatPeriod(point.period, progressPeriod)}
                                                    </Text>
                                                    <Text className="text-[12px] mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                                        {point.exam_count} exam{point.exam_count === 1 ? '' : 's'} · {point.student_count} student
                                                        {point.student_count === 1 ? '' : 's'}
                                                    </Text>
                                                </View>
                                                <Text className="text-[16px] font-bold" style={{ color: scoreColor(point.avg_score) }}>
                                                    {fmtPct(point.avg_score)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </SectionCard>
                        </View>
                    ) : null}
                </ScrollView>
            ) : null}

            {/* STUDENTS TAB */}
            {activeTab === 'students' ? (
                loadingStudentsTab && students.length === 0 ? (
                    <View className="flex-1">
                        <View className="p-4" style={{ gap: 16 }}>
                            {renderHeaderAndTabs()}
                        </View>
                        <View className="flex-1 justify-center items-center">
                            <CapsActivityIndicator size="large" color="#FE6902" />
                        </View>
                    </View>
                ) : (
                    <FlatList
                        data={filteredStudents}
                        keyExtractor={(item, index) => `${item.userID ?? item.id ?? 'student'}-${index}`}
                        renderItem={({ item, index }) => (
                            <StudentListItem student={item} index={index} isDark={isDark} />
                        )}
                        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
                        ListHeaderComponent={
                            <View className="mb-4" style={{ gap: 16 }}>
                                {renderHeaderAndTabs()}
                                <SectionCard title="Filters" isDark={isDark}>
                                    <View
                                        className="flex-row items-center rounded-2xl px-3 py-3 mb-3"
                                        style={{ backgroundColor: isDark ? '#242424' : '#F9FAFB' }}
                                    >
                                        <Ionicons name="search" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                        <TextInput
                                            value={search}
                                            onChangeText={setSearch}
                                            placeholder="Search students"
                                            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                            style={{ flex: 1, marginLeft: 10, color: isDark ? '#FFFFFF' : '#111827' }}
                                        />
                                    </View>

                                    <Text className="text-[12px] font-medium mb-2" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                        Program
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
                                        {PROGRAMS.map((program) => (
                                            <Pressable
                                                key={program}
                                                onPress={() => setActiveProgram(program)}
                                                className="rounded-full px-4 py-2"
                                                style={{
                                                    backgroundColor: activeProgram === program ? '#FE6902' : isDark ? '#242424' : '#F3F4F6',
                                                    minHeight: 36,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: activeProgram === program ? '#FFFFFF' : isDark ? '#D1D5DB' : '#4B5563',
                                                        fontSize: 12,
                                                        fontWeight: '600',
                                                    }}
                                                >
                                                    {program}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>

                                    <Text className="text-[12px] font-medium mb-2" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                        Year Level
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
                                        {YEARS.map((year) => (
                                            <Pressable
                                                key={year}
                                                onPress={() => setActiveYear(year)}
                                                className="rounded-full px-4 py-2"
                                                style={{
                                                    backgroundColor: activeYear === year ? '#FE6902' : isDark ? '#242424' : '#F3F4F6',
                                                    minHeight: 36,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: activeYear === year ? '#FFFFFF' : isDark ? '#D1D5DB' : '#4B5563',
                                                        fontSize: 12,
                                                        fontWeight: '600',
                                                    }}
                                                >
                                                    {year}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>

                                    <Text className="text-[11px] mt-1" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
                                        Note: performance filters require exam score data.
                                    </Text>
                                </SectionCard>
                            </View>
                        }
                        ListEmptyComponent={
                            <SectionCard title="Students" isDark={isDark}>
                                <EmptyState
                                    icon="people-outline"
                                    title="No students found"
                                    subtitle="Try adjusting your filters or check back later."
                                    isDark={isDark}
                                />
                            </SectionCard>
                        }
                        ListFooterComponent={
                            loadingMoreStudents ? (
                                <View className="py-4 items-center">
                                    <CapsActivityIndicator size="small" color="#FE6902" />
                                    <Text className="text-xs mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                        Loading more...
                                    </Text>
                                </View>
                            ) : null
                        }
                        onEndReached={loadMoreStudents}
                        onEndReachedThreshold={0.5}
                        removeClippedSubviews
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        initialNumToRender={10}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FE6902" />}
                    />
                )
            ) : null}
        </View>
    );
}
