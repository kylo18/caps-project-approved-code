// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Admin User Management screen — displays all users in a performant
//          FlatList with avatar, role badges, and status indicators. Provides
//          comprehensive filtering (role, status, program, year, campus, search)
//          and admin actions (approve, activate, deactivate) with confirmation.
// Key sections: Header with back button, stats cards (admins/students), search
//               bar, role & status filter tabs, advanced filter dropdowns
//               (program, year, campus), user list with action buttons, empty
//               state, skeleton loading, pull-to-refresh.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import {   View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert, Animated, Modal, ScrollView } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getRoleThemeColors } from '../../../src/features/core/styles/roleTheme';
import { showToast } from '../../../src/hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserDetailModal from '../../../src/features/profile/components/UserDetailModal';
import {
  applyUserActionLocally,
  canApproveUser,
  canDisapproveUser,
  canReapproveUser,
  getUserCampusLabel,
  getUserProgramLabel,
  getUserStatusLabel,
  getUserStatusFilterKey,
  getUserYearLevelLabel,
  getUserYearLevelValue,
  isActiveUser,
  isDisapprovedUser,
  isInactiveUser,
  matchesUserStatusFilter,
  UserStatusFilter,
} from '../../../src/utils/userManagement';

const avatarPalette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];
const ADMIN_ROLES = [2, 3, 4, 5];
const STUDENT_ROLE = 1;
const PAGE_SIZE = 20;

interface UserItem {
  userID: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roleID?: number | string;
  roleName?: string;
  status?: string | null;
  isActive?: boolean | null;
  [key: string]: any;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const themeColors = getRoleThemeColors(isDark);
  const insets = useSafeAreaInsets();

  // Pagination state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState({ admins: 0, students: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<UserStatusFilter>('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedUserIDs, setSelectedUserIDs] = useState<Set<number | string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [detailUser, setDetailUser] = useState<UserItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isFetchingAllIds, setIsFetchingAllIds] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [programOptions, setProgramOptions] = useState<{id: string; label: string}[]>([]);
  const [campusOptions, setCampusOptions] = useState<{id: string; label: string}[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchUsers(true);
  }, []);

  useEffect(() => {
    fetchUsers(true);
  }, [activeStatusFilter, activeRoleFilter]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, activeRoleFilter, activeStatusFilter, programFilter, yearFilter, campusFilter, users]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [progRes, campRes] = await Promise.allSettled([
          apiRequest("/api/programs"),
          apiRequest("/api/campuses"),
        ]);
        if (progRes.status === "fulfilled") {
          const raw = progRes.value;
          const list = Array.isArray(raw?.programs) ? raw.programs
            : Array.isArray(raw?.data) ? raw.data
            : Array.isArray(raw) ? raw : [];
          setProgramOptions(list.map((p: any) => ({
            id: String(p.programID ?? p.id),
            label: p.programName ?? p.name ?? "",
          })).filter((o: any) => o.label));
        }
        if (campRes.status === "fulfilled") {
          setCampusOptions(parseCampuses(campRes.value));
        }
      } catch { /* non-critical */ }
    };
    loadMeta();
  }, []);

  const parseCampuses = (raw: any) => {
    const list = Array.isArray(raw?.campuses) ? raw.campuses
      : Array.isArray(raw?.data) ? raw.data
      : Array.isArray(raw) ? raw : [];
    return list.map((c: any) => ({
      id: String(c.campusID ?? c.id),
      label: c.campusName ?? c.name ?? "",
    })).filter((o: any) => o.label);
  };

  const fetchCampuses = async () => {
    try {
      const raw = await apiRequest("/api/campuses");
      setCampusOptions(parseCampuses(raw));
    } catch { /* non-critical */ }
  };

  const handleToggleFilters = () => {
    const next = !showAdvancedFilters;
    setShowAdvancedFilters(next);
    if (next && campusOptions.length === 0) fetchCampuses();
  };

  const fetchUsers = async (reset = false) => {
    const currentPage = reset ? 1 : page;

    if (reset) {
      setIsLoading(true);
      setPage(1);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const statusParam = activeStatusFilter === 'active'
        ? 'status=registered'
        : activeStatusFilter === 'pending'
        ? 'status=pending'
        : activeStatusFilter === 'disapproved'
        ? 'status=disapproved'
        : activeStatusFilter === 'inactive'
        ? 'state=inactive'
        : '';
      const roleNames = activeRoleFilter === 'admin'
        ? ['Instructor', 'Program Chair', 'Dean', 'Associate Dean']
        : activeRoleFilter === 'student'
        ? ['Student']
        : [];
      const roleParam = roleNames.length > 0 ? `&role=${roleNames.map(r => encodeURIComponent(r)).join(',')}` : '';
      const query = `/api/users?limit=${PAGE_SIZE}&page=${currentPage}${statusParam ? '&' + statusParam : ''}${roleParam}`;
      const data = await apiRequest(query);
      const userList: UserItem[] = Array.isArray(data?.users) ? data.users
        : Array.isArray(data?.data) ? data.data : [];
      const total: number | undefined = data?.total ?? data?.count ?? data?.totalCount;

      if (reset) {
        setUsers([...new Map(userList.map(u => [u.userID, u])).values()]);
        if (total !== undefined) {
          setHasMore(userList.length < total);
        } else {
          // Fix: if we got fewer than PAGE_SIZE (or empty), no more pages exist
          setHasMore(userList.length >= PAGE_SIZE);
        }
        const adminCount = userList.filter((u: UserItem) => ADMIN_ROLES.includes(Number(u.roleID))).length;
        const studentCount = userList.filter((u: UserItem) => Number(u.roleID) === STUDENT_ROLE).length;
        setStats({ admins: adminCount, students: studentCount });
      } else {
        setUsers(prev => {
          const existing = new Set(prev.map(u => u.userID));
          const newUnique = userList.filter(u => !existing.has(u.userID));
          return [...prev, ...newUnique];
        });
        if (total !== undefined) {
          const prevCount = users.length;
          setHasMore(userList.length > 0 && (prevCount + userList.length) < total);
        } else {
          setHasMore(userList.length >= PAGE_SIZE);
        }
        setPage(prev => prev + 1);
      }
    } catch (error) {
      showToast('Unable to load users', 'error');
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    fetchUsers(false);
  };

  const applyFilters = useCallback(() => {
      let filtered = [...users];
      if (activeRoleFilter === 'admin') filtered = filtered.filter((u: UserItem) => ADMIN_ROLES.includes(Number(u.roleID)));
      else if (activeRoleFilter === 'student') filtered = filtered.filter((u: UserItem) => Number(u.roleID) === STUDENT_ROLE);
      if (activeStatusFilter !== 'all') filtered = filtered.filter((u: UserItem) => matchesUserStatusFilter(u, activeStatusFilter));
      if (programFilter !== 'all') filtered = filtered.filter((u: UserItem) => String(u.programID) === programFilter);
      if (yearFilter !== 'all') filtered = filtered.filter((u: UserItem) => String(u.yearLevel) === yearFilter);
      if (campusFilter !== 'all') filtered = filtered.filter((u: UserItem) => String(u.campusID) === campusFilter);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((u: UserItem) =>
          u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) || u.userCode?.toLowerCase().includes(q)
        );
      }
      setFilteredUsers(filtered);
  }, [searchQuery, activeRoleFilter, activeStatusFilter, programFilter, yearFilter, campusFilter, users]);

  const handleAction = async (userID: number | string, action: string) => {
    try {
      await apiRequest(`/api/users/${userID}/${action}`, { method: 'PATCH' });
      setUsers(prev => prev.map((u: any) => (u.userID === userID ? applyUserActionLocally(u, action as 'approve' | 'activate' | 'deactivate' | 'disapprove' | 'reapprove') : u)));
      showToast(
        action === 'approve' ? 'User approved and activated'
          : action === 'activate' ? 'User activated'
          : action === 'deactivate' ? 'User deactivated'
          : action === 'disapprove' ? 'User disapproved'
          : action === 'reapprove' ? 'User moved back to pending'
          : `User ${action}d`,
        'success'
      );
    } catch (error) {
      showToast(`Failed to ${action} user`, 'error');
    }
  };

  const confirmAction = (user: any, action: string) => {
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} User`, `${action.charAt(0).toUpperCase() + action.slice(1)} ${user.firstName} ${user.lastName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action.charAt(0).toUpperCase() + action.slice(1), style: (action === 'deactivate' || action === 'disapprove') ? 'destructive' : 'default', onPress: () => handleAction(user.userID, action) },
    ]);
  };

  const handleApproveAll = async () => {
    const pendingUsers = users.filter((u: any) => canApproveUser(u));
    if (pendingUsers.length === 0) {
      showToast('No pending users to approve', 'info');
      return;
    }

    Alert.alert(
      `Approve ${pendingUsers.length} Users`,
      `Are you sure you want to approve all ${pendingUsers.length} pending user(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            try {
              const userIDs = pendingUsers.map(u => u.userID);
              await apiRequest('/api/users/approve-multiple', { method: 'POST', body: { userIDs } });
              setUsers(prev => prev.map((u: any) =>
                canApproveUser(u) ? applyUserActionLocally(u, 'approve') : u
              ));
              showToast(`${pendingUsers.length} user(s) approved`, 'success');
            } catch (error: unknown) {
              const msg = (error as { response?: { data?: { message?: string } }; data?: { message?: string }; message?: string })
                .response?.data?.message || (error as { data?: { message?: string }; message?: string }).data?.message || 'Failed to approve users';
              showToast(msg, 'error');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers(true);
    setIsRefreshing(false);
  };

  const toggleSelection = (userID: number) => {
    const next = new Set(selectedUserIDs);
    if (next.has(userID)) {
      next.delete(userID);
    } else {
      next.add(userID);
    }
    setSelectedUserIDs(next);
    if (next.size === 0) {
      setSelectionMode(false);
    }
  };

  const selectAllVisible = () => {
    const ids = filteredUsers.map(u => u.userID);
    setSelectedUserIDs(new Set(ids));
  };

  const selectAllAdmins = () => {
    const ids = users.filter(u => ADMIN_ROLES.includes(Number(u.roleID))).map(u => u.userID);
    setSelectedUserIDs(new Set(ids));
  };

  const selectAllStudents = () => {
    const ids = users.filter(u => Number(u.roleID) === STUDENT_ROLE).map(u => u.userID);
    setSelectedUserIDs(new Set(ids));
  };

  const deselectAll = () => {
    setSelectedUserIDs(new Set());
    setSelectionMode(false);
  };

  const fetchAndSelect = async (type: 'student' | 'admin') => {
    setShowBulkModal(false);
    setIsFetchingAllIds(true);
    try {
      const roleNames = type === 'admin'
        ? ['Instructor', 'Program Chair', 'Dean', 'Associate Dean']
        : ['Student'];
      const roleParam = `role=${roleNames.map(r => encodeURIComponent(r)).join(',')}`;
      const statusParam = activeStatusFilter === 'active'
        ? '&status=registered'
        : activeStatusFilter === 'pending'
        ? '&status=pending'
        : activeStatusFilter === 'disapproved'
        ? '&status=disapproved'
        : activeStatusFilter === 'inactive'
        ? '&state=inactive'
        : '';
      const data = await apiRequest(`/api/users?ids_only=1&${roleParam}${statusParam}`);
      const ids: any[] = data?.userIDs ?? [];
      setSelectedUserIDs(new Set(ids));
      if (ids.length > 0) {
        setSelectionMode(true);
        setShowActionModal(true);
      } else {
        showToast('No matching users found', 'info');
      }
    } catch {
      showToast('Failed to fetch users', 'error');
    } finally {
      setIsFetchingAllIds(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'activate' | 'deactivate' | 'disapprove' | 'reapprove') => {
    const ids = Array.from(selectedUserIDs);
    if (ids.length === 0) return;
    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
    Alert.alert(
      `${actionLabel} ${ids.length} User(s)`,
      `Are you sure you want to ${action} ${ids.length} selected user(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: (action === 'deactivate' || action === 'disapprove') ? 'destructive' : 'default',
          onPress: async () => {
            setIsBulkActing(true);
            try {
              await apiRequest(`/api/users/${action}-multiple`, { method: 'POST', body: { userIDs: ids } });
              setUsers(prev => prev.map((u: any) => {
                if (!selectedUserIDs.has(u.userID)) return u;
                return applyUserActionLocally(u, action);
              }));
              showToast(`${ids.length} user(s) ${action === 'approve' ? 'approved' : action === 'disapprove' ? 'disapproved' : action === 'reapprove' ? 'moved back to pending' : action + 'd'}`, 'success');
              deselectAll();
            } catch (error: unknown) {
              showToast(error instanceof Error && 'data' in error
                ? (error as { data?: { message?: string } }).data?.message || `Failed to ${action} users`
                : `Failed to ${action} users`, 'error');
            } finally {
              setIsBulkActing(false);
            }
          },
        },
      ]
    );
  };

  const openDetail = (user: any) => {
    setDetailUser(user);
    setShowDetailModal(true);
  };

  const getInitials = (user: any) => `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?';
  const isAdmin = (user: any) => ADMIN_ROLES.includes(Number(user.roleID));

  const colors = {
    bg: themeColors.page,
    card: themeColors.surface,
    text: themeColors.text,
    textSecondary: themeColors.muted,
    border: themeColors.border,
    inputBg: themeColors.surfaceSoft,
    orange: '#FE6902',
    green: '#10B981',
    red: '#EF4444',
    blue: '#3B82F6',
    purple: '#8B5CF6',
  };

  // Extract unique values for filters
  const years = [...new Set(users.map((u: any) => getUserYearLevelValue(u)).filter(Boolean))].sort((a: any, b: any) => Number(a) - Number(b));

  const renderUser = useCallback(({ item }: { item: any }) => {
    const isSelected = selectedUserIDs.has(item.userID);
    const statusLabel = getUserStatusLabel(item);
    const statusKey = getUserStatusFilterKey(item);
    const programLabel = getUserProgramLabel(item);
    const yearLevelLabel = getUserYearLevelLabel(item);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.userID);
          } else {
            openDetail(item);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) setSelectionMode(true);
          toggleSelection(item.userID);
        }}
        className="flex-row items-center rounded-2xl p-3 gap-3 mb-2.5"
        style={[{ backgroundColor: colors.card, elevation: 2 }, isSelected && { borderWidth: 2, borderColor: colors.orange }]}
      >
        {selectionMode ? (
          <View className="w-7 h-7 rounded-full border-2 justify-center items-center" style={{ borderColor: colors.orange, backgroundColor: isSelected ? colors.orange : 'transparent' }}>
            {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
          </View>
        ) : (
          <View className="w-12 h-12 rounded-full justify-center items-center" style={{ backgroundColor: avatarPalette[item.userID % avatarPalette.length] }}>
            <Text className="text-base font-extrabold text-slate-900">{getInitials(item)}</Text>
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[15px] font-bold flex-1" style={{ color: colors.text }} numberOfLines={1}>{item.firstName} {item.lastName}</Text>
            <View className="px-1.5 py-0.5 rounded-md" style={{ backgroundColor: isAdmin(item) ? colors.blue : colors.green }}>
              <Text className="text-white text-[9px] font-bold">{isAdmin(item) ? (item.roleName || 'Admin') : 'Student'}</Text>
            </View>
          </View>
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>{item.email}</Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <View className="px-1.5 py-0.5 rounded-md" style={{ backgroundColor: statusKey === 'active' ? colors.green : statusKey === 'inactive' ? colors.red : statusKey === 'pending' ? colors.blue : colors.orange }}>
              <Text className="text-white text-[9px] font-semibold">{statusLabel}</Text>
            </View>
            {programLabel && <Text className="text-[10px]" style={{ color: colors.textSecondary }}>{programLabel}</Text>}
            {yearLevelLabel && <Text className="text-[10px]" style={{ color: colors.textSecondary }}>{yearLevelLabel}</Text>}
          </View>
        </View>
        {!selectionMode && (
          <View className="gap-1">
            {canApproveUser(item) && (
              <TouchableOpacity className="w-7 h-7 rounded-full justify-center items-center" style={{ backgroundColor: colors.green }} onPress={() => confirmAction(item, 'approve')}><Ionicons name="checkmark" size={18} color="#fff" /></TouchableOpacity>
            )}
            {canDisapproveUser(item) && (
              <TouchableOpacity className="w-7 h-7 rounded-full justify-center items-center" style={{ backgroundColor: colors.red }} onPress={() => confirmAction(item, 'disapprove')}><Ionicons name="close" size={18} color="#fff" /></TouchableOpacity>
            )}
            {canReapproveUser(item) && (
              <TouchableOpacity className="w-7 h-7 rounded-full justify-center items-center" style={{ backgroundColor: colors.purple }} onPress={() => confirmAction(item, 'reapprove')}><Ionicons name="refresh" size={18} color="#fff" /></TouchableOpacity>
            )}
            {isActiveUser(item) && (
              <TouchableOpacity className="w-7 h-7 rounded-full justify-center items-center" style={{ backgroundColor: colors.red }} onPress={() => confirmAction(item, 'deactivate')}><Ionicons name="close" size={18} color="#fff" /></TouchableOpacity>
            )}
            {isInactiveUser(item) && (
              <TouchableOpacity className="w-7 h-7 rounded-full justify-center items-center" style={{ backgroundColor: colors.blue }} onPress={() => confirmAction(item, 'activate')}><Ionicons name="play" size={18} color="#fff" /></TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [colors.text, colors.textSecondary, colors.card, colors.blue, colors.green, colors.red, colors.orange, selectedUserIDs, selectionMode]);

  const pendingCount = users.filter((u: any) => canApproveUser(u)).length;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingBottom: insets.bottom + 12 }}>
      <View className="flex-row items-center px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(auth)/(dean)/dashboard'); }} className="p-2 mr-3"><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>User Management</Text>
        {selectionMode ? (
          <TouchableOpacity className="flex-row items-center px-3 py-1.5 rounded-xl gap-1.5" style={{ backgroundColor: colors.red }} onPress={deselectAll} activeOpacity={0.7}>
            <Ionicons name="close" size={16} color="#fff" />
            <Text className="text-white text-xs font-semibold">Done</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center gap-2">
            {pendingCount > 0 && (
              <TouchableOpacity className="flex-row items-center px-2.5 py-1.5 rounded-2xl gap-1" style={{ backgroundColor: colors.green }} onPress={handleApproveAll} activeOpacity={0.7}>
                <Ionicons name="checkmark-done" size={18} color="#fff" />
                <Text className="text-white text-xs font-bold">{pendingCount}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity className="flex-row items-center px-3 py-1.5 rounded-xl gap-1.5" style={{ backgroundColor: colors.orange }} onPress={() => setShowBulkModal(true)} activeOpacity={0.7}>
              <Ionicons name="checkbox-outline" size={16} color="#fff" />
              <Text className="text-white text-xs font-semibold">Bulk</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading && users.length === 0 && !isFetchingAllIds ? (
        <View className="flex-1 justify-center items-center">
          <CapsActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View className="flex-row items-center border rounded-xl px-3 gap-2 mb-2.5" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput className="flex-1 text-[15px] py-2.5" style={{ color: colors.text }} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search users..." placeholderTextColor={colors.textSecondary} />
              {searchQuery ? <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color={colors.textSecondary} /></TouchableOpacity> : null}
            </View>

            <View className="flex-row gap-2 mb-2 items-center">
              <View className="flex-1">
                <FilterDropdown label="" value={activeRoleFilter} onValueChange={setActiveRoleFilter} options={[{ id: 'all', label: 'Users (All)' }, { id: 'admin', label: 'Admins' }, { id: 'student', label: 'Students' }]} colors={colors} />
              </View>
              <View className="flex-1">
                <FilterDropdown label="" value={activeStatusFilter} onValueChange={(v) => setActiveStatusFilter(v as UserStatusFilter)} options={[{ id: 'all', label: 'Status (All)' }, { id: 'pending', label: 'Pending' }, { id: 'active', label: 'Active' }, { id: 'inactive', label: 'Inactive' }, { id: 'disapproved', label: 'Disapproved' }]} colors={colors} />
              </View>
              <TouchableOpacity className="flex-row items-center gap-1.5 px-3 h-[38px] rounded-[10px]" style={{ backgroundColor: showAdvancedFilters ? colors.orange : colors.inputBg }} onPress={handleToggleFilters} activeOpacity={0.7}>
                <Ionicons name="options" size={16} color={showAdvancedFilters ? '#fff' : colors.textSecondary} />
                <Text className="text-xs font-semibold" style={{ color: showAdvancedFilters ? '#fff' : colors.textSecondary }}>Filter</Text>
              </TouchableOpacity>
            </View>

            {showAdvancedFilters && (
              <View>
                <View className="flex-row gap-1 mb-1">
                  <FilterDropdown label="Program" value={programFilter} onValueChange={setProgramFilter} options={[{ id: 'all', label: 'All Programs' }, ...programOptions]} colors={colors} />
                  <FilterDropdown label="Year" value={yearFilter} onValueChange={setYearFilter} options={[{ id: 'all', label: 'All Years' }, ...years.map(y => ({ id: String(y), label: `Year ${y}` }))]} colors={colors} />
                </View>
                <FilterDropdown label="Campus" value={campusFilter} onValueChange={setCampusFilter} options={[{ id: 'all', label: 'All Campuses' }, ...campusOptions]} colors={colors} />
              </View>
            )}

          </ScrollView>

          <View className="flex-1">
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filteredUsers}
              keyExtractor={(item) => String(item.userID)}
              renderItem={renderUser}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.orange]} tintColor={colors.orange} />}
              removeClippedSubviews={false}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={15}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoadingMore ? (
                  <View className="py-4 items-center">
                    <CapsActivityIndicator size="small" color={colors.orange} />
                    <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Loading more...</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View className="rounded-3xl p-8 items-center mt-5" style={{ backgroundColor: colors.card }}>
                  <Ionicons name="people" size={48} color={colors.orange} />
                  <Text className="text-lg font-bold mt-4" style={{ color: colors.text }}>No Users Found</Text>
                  <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>Try adjusting your filters.</Text>
                </View>
              }
            />

            {(isLoading || isFetchingAllIds) && users.length > 0 && (
              <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <CapsActivityIndicator size="large" color={colors.orange} />
              </View>
            )}
          </View>

          <UserDetailModal
            visible={showDetailModal}
            user={detailUser}
            onClose={() => setShowDetailModal(false)}
            onUserUpdated={fetchUsers}
          />

          <Modal visible={showBulkModal} transparent animationType="fade" onRequestClose={() => setShowBulkModal(false)}>
            <TouchableOpacity className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setShowBulkModal(false)}>
              <View className="mx-8 rounded-2xl p-5 w-full" style={{ backgroundColor: colors.card, maxWidth: 320 }}>
                <Text className="text-lg font-bold mb-1 text-center" style={{ color: colors.text }}>Bulk Actions</Text>
                <Text className="text-xs mb-4 text-center" style={{ color: colors.textSecondary }}>Select a group: {(() => { const s = activeStatusFilter === 'all' ? 'All' : activeStatusFilter.charAt(0).toUpperCase() + activeStatusFilter.slice(1); return s; })()}</Text>
                <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 rounded-xl mb-2" style={{ backgroundColor: colors.green }} onPress={() => fetchAndSelect('student')} disabled={isFetchingAllIds} activeOpacity={0.8}>
                  <Ionicons name="school" size={20} color="#fff" />
                  <Text className="text-white text-sm font-semibold">Select Students ({activeStatusFilter === 'all' ? 'All' : activeStatusFilter.charAt(0).toUpperCase() + activeStatusFilter.slice(1)})</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 rounded-xl mb-2" style={{ backgroundColor: colors.blue }} onPress={() => fetchAndSelect('admin')} disabled={isFetchingAllIds} activeOpacity={0.8}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text className="text-white text-sm font-semibold">Select Admins ({activeStatusFilter === 'all' ? 'All' : activeStatusFilter.charAt(0).toUpperCase() + activeStatusFilter.slice(1)})</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 rounded-xl mb-3" style={{ backgroundColor: colors.orange }} onPress={() => { setShowBulkModal(false); setSelectionMode(true); selectAllVisible(); }} activeOpacity={0.8}>
                  <Ionicons name="people" size={20} color="#fff" />
                  <Text className="text-white text-sm font-semibold">Select All Visible</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-center py-2.5 rounded-xl border" style={{ borderColor: colors.border }} onPress={() => setShowBulkModal(false)} activeOpacity={0.7}>
                  <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal visible={showActionModal} transparent animationType="fade" onRequestClose={() => setShowActionModal(false)}>
            <TouchableOpacity className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setShowActionModal(false)}>
              <View className="mx-8 rounded-2xl p-5 w-full" style={{ backgroundColor: colors.card, maxWidth: 320 }}>
                <Text className="text-lg font-bold mb-1 text-center" style={{ color: colors.text }}>{selectedUserIDs.size} selected</Text>
                <Text className="text-xs mb-4 text-center" style={{ color: colors.textSecondary }}>
                  {activeStatusFilter === 'all' ? 'Choose an action:' : `Status: ${activeStatusFilter.charAt(0).toUpperCase() + activeStatusFilter.slice(1)}`}
                </Text>
                {(activeStatusFilter === 'all' || activeStatusFilter === 'pending') && (
                  <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 rounded-xl mb-2" style={{ backgroundColor: colors.green }} onPress={() => { setShowActionModal(false); handleBulkAction('approve'); }} disabled={isBulkActing} activeOpacity={0.8}>
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                    <Text className="text-white text-sm font-semibold">Approve All</Text>
                  </TouchableOpacity>
                )}
                {(activeStatusFilter === 'all' || activeStatusFilter === 'pending') && (
                  <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 rounded-xl mb-2" style={{ backgroundColor: colors.red }} onPress={() => { setShowActionModal(false); handleBulkAction('disapprove'); }} disabled={isBulkActing} activeOpacity={0.8}>
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text className="text-white text-sm font-semibold">Disapprove All</Text>
                  </TouchableOpacity>
                )}
                {(activeStatusFilter === 'all' || activeStatusFilter === 'disapproved') && (
                  <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 rounded-xl mb-2" style={{ backgroundColor: '#8B5CF6' }} onPress={() => { setShowActionModal(false); handleBulkAction('reapprove'); }} disabled={isBulkActing} activeOpacity={0.8}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text className="text-white text-sm font-semibold">Re-approve All</Text>
                  </TouchableOpacity>
                )}
                {(activeStatusFilter === 'all' || activeStatusFilter === 'inactive') && (
                  <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 rounded-xl mb-2" style={{ backgroundColor: colors.blue }} onPress={() => { setShowActionModal(false); handleBulkAction('activate'); }} disabled={isBulkActing} activeOpacity={0.8}>
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text className="text-white text-sm font-semibold">Activate All</Text>
                  </TouchableOpacity>
                )}
                {(activeStatusFilter === 'all' || activeStatusFilter === 'active') && (
                  <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 rounded-xl mb-3" style={{ backgroundColor: colors.red }} onPress={() => { setShowActionModal(false); handleBulkAction('deactivate'); }} disabled={isBulkActing} activeOpacity={0.8}>
                    <Ionicons name="pause" size={20} color="#fff" />
                    <Text className="text-white text-sm font-semibold">Deactivate All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity className="flex-row items-center justify-center py-2.5 rounded-xl border" style={{ borderColor: colors.border }} onPress={() => setShowActionModal(false)} activeOpacity={0.7}>
                  <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      )}


    </View>
  );
}

// Reusable Filter Dropdown
function FilterDropdown({ label, value, onValueChange, options, colors }: { label: string; value: string; onValueChange: (v: string) => void; options: { id: string; label: string }[]; colors: any }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<any>(null);
  const animOpacity = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(-8)).current;
  const selected = options.find((o: any) => o.id === value);

  const openDropdown = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        setPos({ top: y + height + 2, left: x, width });
        setOpen(true);
        animOpacity.setValue(0);
        animTranslateY.setValue(-8);
        Animated.parallel([
          Animated.timing(animOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(animTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    }
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(animOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(animTranslateY, { toValue: -8, duration: 120, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const handleSelect = (id: string) => {
    onValueChange(id);
    closeDropdown();
  };

  return (
    <View className="flex-1">
      {label ? <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>{label}</Text> : null}
      <TouchableOpacity ref={triggerRef} className="flex-row items-center justify-between border rounded-[10px] p-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }} onPress={openDropdown} activeOpacity={0.7}>
        <Text className="text-[13px] flex-1 mr-1" style={{ color: selected?.id === 'all' ? colors.textSecondary : colors.text }} numberOfLines={1}>{selected?.label || label}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeDropdown}>
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={closeDropdown} style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <Animated.View style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, backgroundColor: colors.card, borderRadius: 12, padding: 4, elevation: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, opacity: animOpacity, transform: [{ translateY: animTranslateY }] }}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {options.map((opt: any) => (
                <TouchableOpacity key={opt.id} className="flex-row items-center justify-between py-2.5 px-3 rounded-lg" style={value === opt.id ? { backgroundColor: `${colors.orange}15` } : undefined} onPress={() => handleSelect(opt.id)} activeOpacity={0.7}>
                  <Text className="text-sm flex-1" style={[{ color: colors.text }, value === opt.id ? { color: colors.orange, fontWeight: '700' } : undefined]}>{opt.label}</Text>
                  {value === opt.id && <Ionicons name="checkmark" size={18} color={colors.orange} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
