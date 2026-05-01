// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Associate Dean User Management screen — full permissions except
//          cannot promote users to Dean (roleID 4). Uses activation controls only.
//          Adapted from the dean users screen.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert, Animated, Modal, ScrollView } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserDetailModal from '../../../src/features/profile/components/UserDetailModal';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';
import {
  applyUserActionLocally,
  canApproveUser,
  getUserCampusLabel,
  getUserProgramLabel,
  getUserStatusLabel,
  getUserStatusFilterKey,
  getUserYearLevelLabel,
  getUserYearLevelValue,
  isActiveUser,
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
  [key: string]: any;
}

export default function AssociateDeanUsersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchUsers(true);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, activeRoleFilter, activeStatusFilter, programFilter, yearFilter, campusFilter, users]);

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
      const data = await apiRequest(`/api/users?limit=${PAGE_SIZE}&page=${currentPage}`);
      const userList: UserItem[] = Array.isArray(data?.users) ? data.users
        : Array.isArray(data?.data) ? data.data : [];
      const total: number | undefined = data?.total ?? data?.count ?? data?.totalCount;

      if (reset) {
        setUsers([...new Map(userList.map(u => [u.userID, u])).values()]);
        if (total !== undefined) {
          setHasMore(userList.length < total);
        } else {
          setHasMore(userList.length === PAGE_SIZE);
        }
        const adminCount = userList.filter((u: UserItem) => ADMIN_ROLES.includes(Number(u.roleID))).length;
        const studentCount = userList.filter((u: UserItem) => Number(u.roleID) === STUDENT_ROLE).length;
        setStats({ admins: adminCount, students: studentCount });
      } else {
        setUsers(prev => [...prev, ...userList]);
        if (total !== undefined) {
          setHasMore(userList.length > 0 && (users.length + userList.length) < total);
        } else {
          setHasMore(userList.length === PAGE_SIZE);
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
    Animated.timing(fadeAnim, { toValue: 0.6, duration: 100, useNativeDriver: true }).start(() => {
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  }, [searchQuery, activeRoleFilter, activeStatusFilter, programFilter, yearFilter, campusFilter, users]);

  const handleAction = async (userID: number, action: string) => {
    try {
      await apiRequest(`/api/users/${userID}/${action}`, { method: 'PATCH' });
      setUsers(prev => prev.map((u: any) => (u.userID === userID ? applyUserActionLocally(u, action as 'approve' | 'activate' | 'deactivate') : u)));
      showToast(
        action === 'approve' ? 'User approved and activated' : action === 'activate' ? 'User activated' : 'User deactivated',
        'success'
      );
    } catch (error) {
      showToast(`Failed to ${action} user`, 'error');
    }
  };

  const confirmAction = (user: any, action: string) => {
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} User`, `${action.charAt(0).toUpperCase() + action.slice(1)} ${user.firstName} ${user.lastName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action.charAt(0).toUpperCase() + action.slice(1), style: action === 'deactivate' ? 'destructive' : 'default', onPress: () => handleAction(user.userID, action) },
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
              const userIDs = pendingUsers.map((u: any) => u.userID);
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

  const deselectAll = () => {
    setSelectedUserIDs(new Set());
    setSelectionMode(false);
  };

  const handleBulkAction = async (action: 'approve' | 'activate' | 'deactivate') => {
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
          style: action === 'deactivate' ? 'destructive' : 'default',
          onPress: async () => {
            setIsBulkActing(true);
            try {
              await apiRequest(`/api/users/${action}-multiple`, { method: 'POST', body: { userIDs: ids } });
              setUsers(prev => prev.map((u: any) => {
                if (!selectedUserIDs.has(u.userID)) return u;
                return applyUserActionLocally(u, action);
              }));
              showToast(`${ids.length} user(s) ${action === 'approve' ? 'approved' : action + 'd'}`, 'success');
              deselectAll();
            } catch (error: unknown) {
              const msg = (error as { data?: { message?: string }; message?: string }).data?.message || `Failed to ${action} users`;
              showToast(msg, 'error');
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
    bg: isDark ? '#000' : '#f3f4f6',
    card: isDark ? '#1f2937' : '#fff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    inputBg: isDark ? '#111827' : '#fff',
    orange: '#FE6902',
    green: '#10B981',
    red: '#EF4444',
    blue: '#3B82F6',
    purple: '#8B5CF6',
  };

  const programs = [...new Map(users.map((u: any) => [String(u.programID), getUserProgramLabel(u)] as [string, string]).filter(([, label]) => Boolean(label))).entries()].map(([id, label]) => ({ id, label }));
  const years = [...new Set(users.map((u: any) => getUserYearLevelValue(u)).filter(Boolean))].sort((a: any, b: any) => Number(a) - Number(b));
  const campuses = [...new Map(users.map((u: any) => [String(u.campusID), getUserCampusLabel(u)] as [string, string]).filter(([, label]) => Boolean(label))).entries()].map(([id, label]) => ({ id, label }));

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

  const renderSkeleton = () => (
    <View className="flex-row items-center rounded-2xl p-3 gap-3 mb-2.5" style={{ backgroundColor: colors.card, elevation: 2 }}>
      <View className="w-12 h-12 rounded-full" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }} />
      <View className="flex-1">
        <View className="h-3 rounded-md" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb', width: '60%' }} />
        <View className="h-3 rounded-md mt-1.5" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb', width: '40%' }} />
      </View>
    </View>
  );

  const pendingCount = users.filter((u: any) => canApproveUser(u)).length;

  useScreenFloatingTools(
    [
      {
        key: 'bulk',
        icon: 'checkbox-outline',
        label: 'Bulk Actions',
        onPress: () => setSelectionMode(true),
      },
    ],
    !selectionMode
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingBottom: insets.bottom + 12 }}>
      <View className="flex-row items-center px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(auth)/(associate-dean)/dashboard'); }} className="p-2 mr-3"><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>User Management</Text>
        {pendingCount > 0 && (
          <TouchableOpacity className="flex-row items-center px-2.5 py-1.5 rounded-2xl gap-1" style={{ backgroundColor: colors.green }} onPress={handleApproveAll} activeOpacity={0.7}>
            <Ionicons name="checkmark-done" size={18} color="#fff" />
            <Text className="text-white text-xs font-bold">{pendingCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center"><CapsActivityIndicator size="large" color={colors.orange} /></View>
      ) : (
        <>
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => String(item.userID)}
            renderItem={renderUser}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.orange]} tintColor={colors.orange} />}
            removeClippedSubviews={true}
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
            ListHeaderComponent={
              <Animated.View style={{ opacity: fadeAnim }}>
                <View className="flex-row gap-3 mb-3">
                  <TouchableOpacity className="flex-1 rounded-2xl p-4 items-center" style={{ backgroundColor: colors.card, elevation: 2, borderLeftColor: colors.blue, borderLeftWidth: 4 }} onPress={() => setActiveRoleFilter(activeRoleFilter === 'admin' ? 'all' : 'admin')} activeOpacity={0.7}>
                    <Ionicons name="shield-checkmark" size={28} color={colors.blue} />
                    <Text className="text-[28px] font-extrabold mt-1" style={{ color: colors.text }}>{stats.admins}</Text>
                    <Text className="text-[13px] mt-0.5" style={{ color: colors.textSecondary }}>Admins</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 rounded-2xl p-4 items-center" style={{ backgroundColor: colors.card, elevation: 2, borderLeftColor: colors.green, borderLeftWidth: 4 }} onPress={() => setActiveRoleFilter(activeRoleFilter === 'student' ? 'all' : 'student')} activeOpacity={0.7}>
                    <Ionicons name="school" size={28} color={colors.green} />
                    <Text className="text-[28px] font-extrabold mt-1" style={{ color: colors.text }}>{stats.students}</Text>
                    <Text className="text-[13px] mt-0.5" style={{ color: colors.textSecondary }}>Students</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center border rounded-xl px-3 gap-2 mb-2.5" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
                  <Ionicons name="search" size={18} color={colors.textSecondary} />
                  <TextInput className="flex-1 text-[15px] py-2.5" style={{ color: colors.text }} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search users..." placeholderTextColor={colors.textSecondary} />
                  {searchQuery ? <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color={colors.textSecondary} /></TouchableOpacity> : null}
                </View>

                <View className="flex-row gap-1.5 mb-2 items-center">
                  {[{ key: 'all', label: 'All', icon: 'people' as const }, { key: 'admin', label: 'Admins', icon: 'shield-checkmark' as const }, { key: 'student', label: 'Students', icon: 'school' as const }].map(f => (
                    <TouchableOpacity key={f.key} className="flex-row items-center px-3 py-[7px] rounded-[18px]" style={activeRoleFilter === f.key ? { backgroundColor: colors.orange } : undefined} onPress={() => setActiveRoleFilter(f.key)} activeOpacity={0.7}>
                      <Ionicons name={f.icon} size={16} color={activeRoleFilter === f.key ? '#fff' : colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text className="text-xs font-semibold" style={{ color: activeRoleFilter === f.key ? '#fff' : colors.textSecondary }}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity className="w-[34px] h-[34px] rounded-[17px] justify-center items-center" style={{ backgroundColor: showAdvancedFilters ? colors.orange : 'rgba(0,0,0,0.05)' }} onPress={() => setShowAdvancedFilters(!showAdvancedFilters)} activeOpacity={0.7}>
                    <Ionicons name="options" size={16} color={showAdvancedFilters ? '#fff' : colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-1 mb-2 flex-wrap">
                  {[
                    { key: 'all' as UserStatusFilter, label: 'All' },
                    { key: 'pending' as UserStatusFilter, label: 'Pending' },
                    { key: 'active' as UserStatusFilter, label: 'Active' },
                    { key: 'inactive' as UserStatusFilter, label: 'Inactive' },
                    { key: 'disapproved' as UserStatusFilter, label: 'Disapproved' },
                  ].map((f) => (
                    <TouchableOpacity key={f.key} className="px-2.5 py-[5px] rounded-[14px]" style={activeStatusFilter === f.key ? { backgroundColor: f.key === 'pending' ? colors.blue : f.key === 'active' ? colors.green : f.key === 'inactive' ? colors.red : colors.orange } : undefined} onPress={() => setActiveStatusFilter(f.key)} activeOpacity={0.7}>
                      <Text className="text-[11px] font-semibold" style={{ color: activeStatusFilter === f.key ? '#fff' : colors.textSecondary }}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {showAdvancedFilters && (
                  <View className="mb-3">
                    <View className="flex-row gap-1">
                      <FilterDropdown label="Program" value={programFilter} onValueChange={setProgramFilter} options={[{ id: 'all', label: 'All Programs' }, ...programs]} colors={colors} />
                      <FilterDropdown label="Year" value={yearFilter} onValueChange={setYearFilter} options={[{ id: 'all', label: 'All Years' }, ...years.map(y => ({ id: String(y), label: `Year ${y}` }))]} colors={colors} />
                    </View>
                    <FilterDropdown label="Campus" value={campusFilter} onValueChange={setCampusFilter} options={[{ id: 'all', label: 'All Campuses' }, ...campuses]} colors={colors} />
                  </View>
                )}
              </Animated.View>
            }
            ListEmptyComponent={
              <View className="rounded-3xl p-8 items-center mt-5" style={{ backgroundColor: colors.card }}>
                <Ionicons name="people" size={48} color={colors.orange} />
                <Text className="text-lg font-bold mt-4" style={{ color: colors.text }}>No Users Found</Text>
                <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>Try adjusting your filters.</Text>
              </View>
            }
          />

          {selectionMode && (
            <View className="absolute left-0 right-0 bottom-0 border-t p-3 pb-6" style={{ backgroundColor: colors.card, borderTopColor: colors.border }}>
              <View className="flex-row items-center justify-between mb-2.5">
                <Text className="text-sm font-bold" style={{ color: colors.text }}>{selectedUserIDs.size} selected</Text>
                <TouchableOpacity onPress={selectAllVisible} activeOpacity={0.7}>
                  <Text className="text-[13px] font-semibold" style={{ color: colors.orange }}>Select all visible</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deselectAll} activeOpacity={0.7}>
                  <Text className="text-[13px] font-semibold" style={{ color: colors.red }}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-2 justify-between">
                <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-[10px]" style={{ backgroundColor: colors.green }} onPress={() => handleBulkAction('approve')} disabled={isBulkActing} activeOpacity={0.8}>
                  <Ionicons name="checkmark-done" size={18} color="#fff" />
                  <Text className="text-white text-xs font-semibold">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-[10px]" style={{ backgroundColor: colors.blue }} onPress={() => handleBulkAction('activate')} disabled={isBulkActing} activeOpacity={0.8}>
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text className="text-white text-xs font-semibold">Activate</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-[10px]" style={{ backgroundColor: colors.red }} onPress={() => handleBulkAction('deactivate')} disabled={isBulkActing} activeOpacity={0.8}>
                  <Ionicons name="pause" size={18} color="#fff" />
                  <Text className="text-white text-xs font-semibold">Deactivate</Text>
                </TouchableOpacity>
              </View>
              {isBulkActing && <CapsActivityIndicator className="mt-2" size="small" color={colors.orange} />}
            </View>
          )}

          <UserDetailModal
            visible={showDetailModal}
            user={detailUser}
            onClose={() => setShowDetailModal(false)}
            onUserUpdated={fetchUsers}
          />
        </>
      )}


    </View>
  );
}

function FilterDropdown({ label, value, onValueChange, options, colors }: { label: string; value: string; onValueChange: (v: string) => void; options: { id: string; label: string }[]; colors: any }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o: any) => o.id === value);

  return (
    <View className="flex-1 mx-1">
      <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>{label}</Text>
      <TouchableOpacity className="flex-row items-center justify-between border rounded-[10px] p-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text className="text-[13px] flex-1 mr-1" style={{ color: selected?.id === 'all' ? colors.textSecondary : colors.text }} numberOfLines={1}>{selected?.label || label}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setOpen(false)}>
          <View className="mx-5 rounded-t-[20px] p-4" style={{ backgroundColor: colors.card }}>
            <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>{label}</Text>
            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled>
              {options.map((opt: any) => (
                <TouchableOpacity key={opt.id} className="flex-row items-center justify-between py-3 border-b border-gray-200" style={value === opt.id ? { backgroundColor: `${colors.orange}15` } : undefined} onPress={() => { onValueChange(opt.id); setOpen(false); }} activeOpacity={0.7}>
                  <Text className="text-sm flex-1" style={[{ color: colors.text }, value === opt.id ? { color: colors.orange, fontWeight: '700' } : undefined]}>{opt.label}</Text>
                  {value === opt.id && <Ionicons name="checkmark" size={18} color={colors.orange} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
