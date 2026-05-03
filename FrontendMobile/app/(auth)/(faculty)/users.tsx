// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Faculty User Management screen — view-only access to users list.
//          Faculty can see users but cannot approve, delete, or change roles.
//          Adapted from the dean users screen with all actions removed.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import {   View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Animated, Modal, ScrollView } from 'react-native';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';
import { SkeletonList } from '../../../src/features/core/components/Skeleton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getUserCampusLabel,
  getUserProgramLabel,
  getUserStatusLabel,
  getUserStatusFilterKey,
  getUserYearLevelLabel,
  getUserYearLevelValue,
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

export default function FacultyUsersScreen() {
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
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
  const [programOptions, setProgramOptions] = useState<{id: string; label: string}[]>([]);
  const [campusOptions, setCampusOptions] = useState<{id: string; label: string}[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchUsers(true);
  }, []);

  useEffect(() => {
    if (filter === 'student') setActiveRoleFilter('student');
    else if (filter === 'admin') setActiveRoleFilter('admin');
  }, [filter]);

  useEffect(() => {
    // Re-fetch users when status filter changes to load fresh data from server
    fetchUsers(true);
  }, [activeStatusFilter]);

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
      const statusParam = activeStatusFilter === 'active'
        ? 'status=registered'
        : activeStatusFilter === 'pending'
        ? 'status=pending'
        : activeStatusFilter === 'disapproved'
        ? 'status=disapproved'
        : activeStatusFilter === 'inactive'
        ? 'state=inactive'
        : '';
      const query = `/api/users?limit=${PAGE_SIZE}&page=${currentPage}${statusParam ? '&' + statusParam : ''}`;
      const data = await apiRequest(query);
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
        const prevCount = users.length;
        setUsers(prev => [...prev, ...userList]);
        if (total !== undefined) {
          setHasMore(userList.length > 0 && (prevCount + userList.length) < total);
        } else {
          // Fix: if we got fewer than PAGE_SIZE (or empty), no more pages exist
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

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers(true);
    setIsRefreshing(false);
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

  const years = [...new Set(users.map((u: any) => getUserYearLevelValue(u)).filter(Boolean))].sort((a: any, b: any) => Number(a) - Number(b));

  const renderUser = useCallback(({ item }: { item: any }) => {
    const statusLabel = getUserStatusLabel(item);
    const statusKey = getUserStatusFilterKey(item);
    const programLabel = getUserProgramLabel(item);
    const yearLevelLabel = getUserYearLevelLabel(item);
    return (
      <View
        className="flex-row items-center rounded-2xl p-3 gap-3 mb-2.5"
        style={{ backgroundColor: colors.card, elevation: 2 }}
      >
        <View className="w-12 h-12 rounded-full justify-center items-center" style={{ backgroundColor: avatarPalette[item.userID % avatarPalette.length] }}>
          <Text className="text-base font-extrabold text-slate-900">{getInitials(item)}</Text>
        </View>
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
      </View>
    );
  }, [colors.text, colors.textSecondary, colors.card, colors.blue, colors.green, colors.red, colors.orange]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingBottom: insets.bottom + 12 }}>
      <View className="flex-row items-center px-4 py-3 border-b" style={{ backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(auth)/(faculty)/dashboard'); }} className="p-2 mr-3"><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>Users</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 px-4 pt-4"><SkeletonList count={5} /></View>
      ) : (
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
                  { key: 'all', label: 'All' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'active', label: 'Active' },
                  { key: 'inactive', label: 'Inactive' },
                  { key: 'disapproved', label: 'Disapproved' },
                ].map((f) => (
                  <TouchableOpacity key={f.key} className="px-2.5 py-[5px] rounded-[14px]" style={activeStatusFilter === f.key ? { backgroundColor: f.key === 'pending' ? colors.blue : f.key === 'active' ? colors.green : f.key === 'inactive' ? colors.red : colors.orange } : undefined} onPress={() => setActiveStatusFilter(f.key)} activeOpacity={0.7}>
                    <Text className="text-[11px] font-semibold" style={{ color: activeStatusFilter === f.key ? '#fff' : colors.textSecondary }}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {showAdvancedFilters && (
                <View className="mb-3">
                  <View className="flex-row gap-1">
                    <FilterDropdown label="Program" value={programFilter} onValueChange={setProgramFilter} options={[{ id: 'all', label: 'All Programs' }, ...programOptions]} colors={colors} />
                    <FilterDropdown label="Year" value={yearFilter} onValueChange={setYearFilter} options={[{ id: 'all', label: 'All Years' }, ...years.map(y => ({ id: String(y), label: `Year ${y}` }))]} colors={colors} />
                  </View>
                  <FilterDropdown label="Campus" value={campusFilter} onValueChange={setCampusFilter} options={[{ id: 'all', label: 'All Campuses' }, ...campusOptions]} colors={colors} />
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
