import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MobileHeader from '../../../../features/core/components/MobileHeader';
import CustomDropdown from '../../../../features/core/components/CustomDropdown';
import { useTheme } from '../../../../contexts/ThemeContext';
import { showToast } from '../../../../hooks/useToast';
import { useScreenFloatingTools } from '../../shared/hooks/useScreenFloatingTools';
import { apiRequest } from '../../../../services/apiClient';
import {
  getAllUserReports,
  getOverallLeaderboard,
  getOverallRecentTakers,
  type LeaderboardEntry,
  type RecentTaker,
  type UserReportTicket,
} from '../services/adminReportsService';

type ReportsRole = 'dean' | 'associate-dean' | 'program-chair' | 'faculty';
type TabKey = 'recent' | 'leaderboard' | 'reports';

type Props = {
  role: ReportsRole;
};

const ROLE_META: Record<ReportsRole, { title: string; subtitle: string; deanStyleReports: boolean }> = {
  dean: {
    title: 'Reports',
    subtitle: 'Track recent takers, leaderboard trends, and user-submitted reports.',
    deanStyleReports: true,
  },
  'associate-dean': {
    title: 'Reports',
    subtitle: 'Track recent takers, leaderboard trends, and user-submitted reports.',
    deanStyleReports: true,
  },
  'program-chair': {
    title: 'Reports',
    subtitle: 'Review recent takers, program leaderboard trends, and submitted reports.',
    deanStyleReports: false,
  },
  faculty: {
    title: 'Reports',
    subtitle: 'Monitor recent takers, leaderboard movement, and student support reports.',
    deanStyleReports: false,
  },
};

function formatDate(value?: string) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

function getDisplayName(item: { name?: string; firstName?: string; lastName?: string }) {
  const combined = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
  return item.name || combined || 'Unknown user';
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function getStatusTone(status?: string) {
  const normalized = String(status ?? 'open').replace(/\s+/g, '_').toLowerCase();
  switch (normalized) {
    case 'resolved':
      return { bg: '#DCFCE7', fg: '#166534', label: 'Resolved' };
    case 'closed':
      return { bg: '#E5E7EB', fg: '#4B5563', label: 'Closed' };
    case 'in_review':
    case 'in_progress':
      return { bg: '#FEF3C7', fg: '#92400E', label: 'In Review' };
    default:
      return { bg: '#DBEAFE', fg: '#1D4ED8', label: 'Open' };
  }
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full px-4 py-2.5 flex-row items-center"
      style={{ backgroundColor: active ? '#FE6902' : '#F3F4F6' }}
    >
      <Ionicons name={icon} size={16} color={active ? '#FFFFFF' : '#6B7280'} />
      <Text
        className="ml-2 text-[13px] font-semibold"
        style={{ color: active ? '#FFFFFF' : '#4B5563' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({ icon, message, isDark }: { icon: keyof typeof Ionicons.glyphMap; message: string; isDark: boolean }) {
  return (
    <View
      className="rounded-3xl px-5 py-10 items-center"
      style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }}
    >
      <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? '#242424' : '#FFF0E0' }}>
        <Ionicons name={icon} size={24} color="#FE6902" />
      </View>
      <Text
        className="text-center mt-4 text-[14px]"
        style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
      >
        {message}
      </Text>
    </View>
  );
}

function SummaryCard({
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
      className="flex-1 rounded-[22px] p-4"
      style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }}
    >
      <View className="w-10 h-10 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: `${color}20` }}>
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

function RecentTakerCard({ item, isDark }: { item: RecentTaker; isDark: boolean }) {
  const name = getDisplayName(item);
  const subject = item.lastAttemptSubject?.subjectName || item.lastAttemptSubject?.subjectCode || 'No subject';
  const hasSubject = subject.length > 0;
  const courseInfo = [item.course, item.year || item.yearLevel].filter(Boolean).join(' ');

  return (
    <View className="rounded-[24px] p-4" style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? '#242424' : '#FFF0E0' }}>
            <Text className="font-bold text-[13px]" style={{ color: '#FE6902' }}>
              {initials(name)}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[15px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
              {name}
            </Text>
            <Text className="text-[12px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              {courseInfo + (courseInfo && hasSubject ? ' • ' : '') + subject || 'No course info'}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-[15px] font-bold" style={{ color: '#FE6902' }}>
            {item.highestPercentage ?? 0}%
          </Text>
          <Text className="text-[12px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            {item.averagePercentage ?? 0}% avg | {item.totalAttempts ?? 0} attempt{item.totalAttempts === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap">
        {hasSubject && (
          <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: isDark ? '#242424' : '#F3F4F6' }}>
            <Text className="text-[11px] font-medium" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
              {subject}
            </Text>
          </View>
        )}
        <View className="rounded-full px-3 py-1 mb-2" style={{ backgroundColor: isDark ? '#242424' : '#F3F4F6' }}>
          <Text className="text-[11px] font-medium" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
            {formatDate(item.lastAttemptDate)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function LeaderboardCard({
  item,
  rank,
  isDark,
}: {
  item: LeaderboardEntry;
  rank: number;
  isDark: boolean;
}) {
  const name = getDisplayName(item);

  return (
    <View className="rounded-[24px] p-4" style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }}>
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: rank === 1 ? '#FEF3C7' : isDark ? '#242424' : '#F3F4F6' }}>
          <Text className="text-[14px] font-bold" style={{ color: rank === 1 ? '#B45309' : isDark ? '#FFFFFF' : '#111827' }}>
            {rank}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-[15px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
              {name}
            </Text>
            {rank === 1 ? <Ionicons name="trophy" size={16} color="#F59E0B" style={{ marginLeft: 6 }} /> : null}
          </View>
          <Text className="text-[12px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            {item.course || item.year || item.yearLevel || 'No course info'}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[16px] font-bold" style={{ color: '#FE6902' }}>
            {item.averagePercentage ?? 0}%
          </Text>
          <Text className="text-[12px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            peak {item.highestPercentage ?? 0}%
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row justify-between">
        <Text className="text-[12px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
          Attempts: <Text style={{ color: isDark ? '#FFFFFF' : '#111827', fontWeight: '700' }}>{item.totalAttempts ?? 0}</Text>
        </Text>
        <Text className="text-[12px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
          {formatDate(item.lastAttemptDate)}
        </Text>
      </View>
    </View>
  );
}

function TicketCard({ item, isDark }: { item: UserReportTicket; isDark: boolean }) {
  const tone = getStatusTone(item.status);
  const reporter = item.user
    ? `${item.user.firstName ?? ''} ${item.user.lastName ?? ''}`.trim() || item.user.email || 'Unknown reporter'
    : 'Unknown reporter';

  return (
    <View className="rounded-[24px] p-4" style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center flex-wrap mb-2">
            <Text className="text-[11px] font-bold mr-2" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
              #{item.id}
            </Text>
            <View className="rounded-full px-2.5 py-1 mr-2" style={{ backgroundColor: isDark ? '#242424' : '#F3F4F6' }}>
              <Text className="text-[11px] font-medium" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                {item.category || 'General'}
              </Text>
            </View>
          </View>
          <Text className="text-[15px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            {item.subject || 'No subject'}
          </Text>
          <Text className="text-[12px] mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            {reporter}
          </Text>
          <Text className="text-[13px] mt-3 leading-5" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
            {item.description || 'No description provided.'}
          </Text>
        </View>
        <View className="items-end">
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: tone.bg }}>
            <Text className="text-[11px] font-semibold" style={{ color: tone.fg }}>
              {tone.label}
            </Text>
          </View>
          <Text className="text-[11px] mt-2" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function TicketGroup({
  title,
  icon,
  items,
  emptyMessage,
  isDark,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: UserReportTicket[];
  emptyMessage: string;
  isDark: boolean;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name={icon} size={18} color="#FE6902" />
          <Text className="ml-2 text-[15px] font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            {title}
          </Text>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: isDark ? '#242424' : '#F3F4F6' }}>
          <Text className="text-[11px] font-semibold" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
            {items.length}
          </Text>
        </View>
      </View>
      <View className="gap-3">
        {items.length === 0 ? <EmptyState icon="document-text-outline" message={emptyMessage} isDark={isDark} /> : items.map((item) => (
          <TicketCard key={`ticket-${title}-${item.id}`} item={item} isDark={isDark} />
        ))}
      </View>
    </View>
  );
}

export default function AdminReportsScreen({ role }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const meta = ROLE_META[role];

  const [activeTab, setActiveTab] = useState<TabKey>('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentTakers, setRecentTakers] = useState<RecentTaker[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [reports, setReports] = useState<UserReportTicket[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filterProgramID, setFilterProgramID] = useState<string>('');
  const [filterSubjectID, setFilterSubjectID] = useState<string>('');

  const fetchAll = useCallback(async () => {
    try {
      const hasFilters = filterProgramID || filterSubjectID;
      const filter = hasFilters ? { programID: filterProgramID || undefined, subjectID: filterSubjectID || undefined } : undefined;
      const [recentData, leaderboardData, reportsData] = await Promise.all([
        getOverallRecentTakers(filter),
        getOverallLeaderboard(filter),
        getAllUserReports(),
      ]);
      setRecentTakers(recentData);
      setLeaderboard(leaderboardData);
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load reports screen:', error);
      showToast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterProgramID, filterSubjectID]);

  useEffect(() => {
    fetchAll();
    apiRequest('/api/programs').then(res => {
      const list = Array.isArray(res?.programs) ? res.programs :
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res) ? res : [];
      setPrograms(list);
    }).catch(() => setPrograms([]));
    apiRequest('/api/subjects').then(res => {
      const list = Array.isArray(res?.subjects) ? res.subjects :
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res) ? res : [];
      setSubjects(list);
    }).catch(() => setSubjects([]));
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const facultyAndStaffReports = useMemo(
    () =>
      reports.filter((ticket) => {
        const roleId = Number(ticket.user?.roleID ?? ticket.user?.roleId ?? 0);
        return [2, 3, 4, 5].includes(roleId);
      }),
    [reports]
  );

  const studentReports = useMemo(
    () =>
      reports.filter((ticket) => {
        const roleId = Number(ticket.user?.roleID ?? ticket.user?.roleId ?? 1);
        return !ticket.user || roleId === 1;
      }),
    [reports]
  );

  const summary = useMemo(
    () => [
      { label: 'Recent takers', value: String(recentTakers.length), icon: 'time-outline' as const, color: '#3B82F6' },
      { label: 'Leaderboard', value: String(leaderboard.length), icon: 'trophy-outline' as const, color: '#FE6902' },
      { label: 'User reports', value: String(reports.length), icon: 'document-text-outline' as const, color: '#8B5CF6' },
    ],
    [leaderboard.length, recentTakers.length, reports.length]
  );

  const fabActions = useMemo(() => {
    const roleBaseRoute = `/(auth)/(${role})`;
    const tailAction =
      role === 'dean'
        ? {
            key: 'reports-support',
            icon: 'headset-outline' as const,
            label: 'Support',
            onPress: () => router.push(`${roleBaseRoute}/support` as string),
            backgroundColor: '#EF4444',
          }
        : role === 'associate-dean'
          ? {
              key: 'reports-enhancement',
              icon: 'trending-up-outline' as const,
              label: 'Enhancement',
              onPress: () => router.push(`${roleBaseRoute}/enhancement` as string),
              backgroundColor: '#10B981',
            }
          : role === 'program-chair'
            ? {
                key: 'reports-export',
                icon: 'print-outline' as const,
                label: 'Export',
                onPress: () => router.push(`${roleBaseRoute}/subjects` as string),
                backgroundColor: '#8B5CF6',
              }
            : {
                key: 'reports-classes',
                icon: 'layers-outline' as const,
                label: 'Classes',
                onPress: () => router.push(`${roleBaseRoute}/classes` as string),
                backgroundColor: '#10B981',
              };

    return [
      {
        key: 'reports-insights',
        icon: 'grid-outline' as const,
        label: 'Insights',
        onPress: () => router.push(`${roleBaseRoute}/insights` as string),
        backgroundColor: '#3B82F6',
      },
      {
        key: 'reports-recent',
        icon: 'time-outline' as const,
        label: 'Recent Takers',
        onPress: () => setActiveTab('recent'),
        backgroundColor: activeTab === 'recent' ? '#FE6902' : '#FF8C3A',
      },
      {
        key: 'reports-leaderboard',
        icon: 'trophy-outline' as const,
        label: 'Leaderboard',
        onPress: () => setActiveTab('leaderboard'),
        backgroundColor: activeTab === 'leaderboard' ? '#FE6902' : '#F59E0B',
      },
      {
        key: 'reports-all',
        icon: 'document-text-outline' as const,
        label: 'All Reports',
        onPress: () => setActiveTab('reports'),
        backgroundColor: activeTab === 'reports' ? '#FE6902' : '#8B5CF6',
      },
      {
        key: 'reports-home',
        icon: 'home-outline' as const,
        label: 'Dashboard',
        onPress: () => router.push(`${roleBaseRoute}/dashboard` as string),
        backgroundColor: '#6366F1',
      },
      tailAction,
    ];
  }, [activeTab, role, router]);

  const programItems = useMemo(() => [
    { id: '', label: 'All Programs', value: '' },
    ...programs.map(p => ({
      id: String(p.programID || p.id),
      label: p.programName || '',
      value: String(p.programID || p.id)
    }))
  ], [programs]);

  const subjectItems = useMemo(() => [
    { id: '', label: 'All Subjects', value: '' },
    ...subjects.map(s => ({
      id: String(s.subjectID || s.id),
      label: s.subjectName || '',
      value: String(s.subjectID || s.id)
    }))
  ], [subjects]);

  useScreenFloatingTools(fabActions);

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-100'}`}>
      <MobileHeader title={meta.title} showBack onBack={() => router.push(`/(auth)/(${role})/insights` as string)} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={100}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FE6902" />}
      >
        <View>
          <Text className="text-[22px] font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Reports Hub
          </Text>
          <Text className="text-[13px] mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            {meta.subtitle}
          </Text>
        </View>

        <View className="flex-row gap-3">
          {summary.map((item) => (
            <SummaryCard
              key={item.label}
              label={item.label}
              value={item.value}
              icon={item.icon}
              color={item.color}
              isDark={isDark}
            />
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TabButton label="Recent Takers" icon="time-outline" active={activeTab === 'recent'} onPress={() => setActiveTab('recent')} />
          <TabButton label="Leaderboard" icon="trophy-outline" active={activeTab === 'leaderboard'} onPress={() => setActiveTab('leaderboard')} />
            <TabButton label="All Reports" icon="document-text-outline" active={activeTab === 'reports'} onPress={() => setActiveTab('reports')} />
        </ScrollView>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <CustomDropdown
              items={programItems}
              selectedValue={filterProgramID}
              onSelect={(val: any) => setFilterProgramID(val)}
              placeholder="All Programs"
            />
          </View>
          <View className="flex-1">
            <CustomDropdown
              items={subjectItems}
              selectedValue={filterSubjectID}
              onSelect={(val: any) => setFilterSubjectID(val)}
              placeholder="All Subjects"
            />
          </View>
        </View>

        {loading ? (
          <EmptyState icon="hourglass-outline" message="Loading reports..." isDark={isDark} />
        ) : null}

        {!loading && activeTab === 'recent' ? (
          <View className="gap-3">
            {recentTakers.length === 0 ? (
              <EmptyState icon="time-outline" message="No recent practice exam takers found." isDark={isDark} />
            ) : (
              recentTakers.map((item) => (
                <RecentTakerCard key={`recent-${item.userID}`} item={item} isDark={isDark} />
              ))
            )}
          </View>
        ) : null}

        {!loading && activeTab === 'leaderboard' ? (
          <View className="gap-3">
            {leaderboard.length === 0 ? (
              <EmptyState icon="trophy-outline" message="No leaderboard data available yet." isDark={isDark} />
            ) : (
              leaderboard.map((item, index) => (
                <LeaderboardCard key={`leaderboard-${item.userID}`} item={item} rank={index + 1} isDark={isDark} />
              ))
            )}
          </View>
        ) : null}

        {!loading && activeTab === 'reports' ? (
          meta.deanStyleReports ? (
            <View className="gap-6">
              <TicketGroup
                title="Faculty & Staff Reports"
                icon="people-outline"
                items={facultyAndStaffReports}
                emptyMessage="No faculty reports submitted."
                isDark={isDark}
              />
              <TicketGroup
                title="Students' Reports"
                icon="school-outline"
                items={studentReports}
                emptyMessage="No student reports submitted."
                isDark={isDark}
              />
            </View>
          ) : (
            <View className="gap-3">
              {reports.length === 0 ? (
                <EmptyState icon="document-text-outline" message="No user reports found." isDark={isDark} />
              ) : (
                reports.map((item) => <TicketCard key={`report-${item.id}`} item={item} isDark={isDark} />)
              )}
            </View>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}
