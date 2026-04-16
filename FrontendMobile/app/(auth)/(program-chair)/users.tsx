// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Program Chair User Management screen — limited to managing students
//          and faculty only. Cannot delete users or promote to Dean/Assoc Dean.
//          Adapted from the dean users screen with restricted permissions.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl, Alert, Animated, Modal, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';
import UserDetailModal from '../../../src/components/UserDetailModal';

const avatarPalette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];
const ADMIN_ROLES = [2, 3, 4, 5];
const STUDENT_ROLE = 1;

export default function ProgramChairUsersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ admins: 0, students: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUserIDs, setSelectedUserIDs] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isBulkActing, setIsBulkActing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, activeRoleFilter, activeStatusFilter, programFilter, yearFilter, campusFilter, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/users?limit=10000');
      const userList = Array.isArray(data?.users) ? data.users : Array.isArray(data?.data) ? data.data : [];
      setUsers(userList);
      const adminCount = userList.filter((u: any) => ADMIN_ROLES.includes(u.roleID)).length;
      const studentCount = userList.filter((u: any) => u.roleID === STUDENT_ROLE).length;
      setStats({ admins: adminCount, students: studentCount });
    } catch (error) {
      showToast('Unable to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0.6, duration: 100, useNativeDriver: true }).start(() => {
      let filtered = [...users];
      if (activeRoleFilter === 'admin') filtered = filtered.filter((u: any) => ADMIN_ROLES.includes(u.roleID));
      else if (activeRoleFilter === 'student') filtered = filtered.filter((u: any) => u.roleID === STUDENT_ROLE);
      if (activeStatusFilter !== 'all') filtered = filtered.filter((u: any) => u.status === activeStatusFilter);
      if (programFilter !== 'all') filtered = filtered.filter((u: any) => String(u.programID) === programFilter);
      if (yearFilter !== 'all') filtered = filtered.filter((u: any) => String(u.yearLevel) === yearFilter);
      if (campusFilter !== 'all') filtered = filtered.filter((u: any) => String(u.campusID) === campusFilter);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((u: any) =>
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
      setUsers(prev => prev.map((u: any) => u.userID === userID ? { ...u, status: action === 'approve' ? 'activated' : action === 'deactivate' ? 'deactivated' : 'activated' } : u));
      showToast(`User ${action}d`, 'success');
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
    const pendingUsers = users.filter((u: any) => u.status === 'pending' || u.status === 'approved');
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
                ['pending', 'approved'].includes(u.status) ? { ...u, status: 'activated' } : u
              ));
              showToast(`${pendingUsers.length} user(s) approved`, 'success');
            } catch (error: any) {
              showToast(error.response?.data?.message || 'Failed to approve users', 'error');
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
    await fetchUsers();
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
              setUsers(prev => prev.map(u => {
                if (!selectedUserIDs.has(u.userID)) return u;
                if (action === 'approve') return { ...u, status: 'activated' };
                if (action === 'activate') return { ...u, status: 'activated' };
                if (action === 'deactivate') return { ...u, status: 'deactivated' };
                return u;
              }));
              showToast(`${ids.length} user(s) ${action === 'approve' ? 'approved' : action + 'd'}`, 'success');
              deselectAll();
            } catch (error: any) {
              showToast(error?.data?.message || `Failed to ${action} users`, 'error');
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
  const isAdmin = (user: any) => ADMIN_ROLES.includes(user.roleID);

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

  const programs: { id: string; label: string }[] = [...new Map(users.filter((u: any) => u.programName).map((u: any) => [String(u.programID), u.programName])).entries()].map(([id, label]) => ({ id: String(id), label: String(label) }));
  const years = [...new Set(users.filter((u: any) => u.yearLevel).map((u: any) => u.yearLevel))].sort((a: any, b: any) => a - b);
  const campuses: { id: string; label: string }[] = [...new Map(users.filter((u: any) => u.campusName).map((u: any) => [String(u.campusID), u.campusName])).entries()].map(([id, label]) => ({ id: String(id), label: String(label) }));

  const renderUser = useCallback(({ item }: { item: any }) => {
    const isSelected = selectedUserIDs.has(item.userID);
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
        style={[styles.userCard, { backgroundColor: colors.card }, isSelected && { borderWidth: 2, borderColor: colors.orange }]}
      >
        {selectionMode ? (
          <View style={[styles.checkbox, { borderColor: colors.orange, backgroundColor: isSelected ? colors.orange : 'transparent' }]}>
            {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
          </View>
        ) : (
          <View style={[styles.avatar, { backgroundColor: avatarPalette[item.userID % avatarPalette.length] }]}>
            <Text style={styles.avatarText}>{getInitials(item)}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{item.firstName} {item.lastName}</Text>
            <View style={[styles.roleBadge, { backgroundColor: isAdmin(item) ? colors.blue : colors.green }]}>
              <Text style={styles.roleBadgeText}>{isAdmin(item) ? (item.roleName || 'Admin') : 'Student'}</Text>
            </View>
          </View>
          <Text style={[styles.userMeta, { color: colors.textSecondary }]} numberOfLines={1}>{item.email}</Text>
          <View style={styles.userMetaRow}>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'activated' ? colors.green : item.status === 'pending' ? colors.blue : item.status === 'approved' ? colors.orange : colors.red }]}>
              <Text style={styles.statusText}>{item.status || 'pending'}</Text>
            </View>
            {item.programName && <Text style={[styles.metaTag, { color: colors.textSecondary }]}>{item.programName}</Text>}
            {item.yearLevel && <Text style={[styles.metaTag, { color: colors.textSecondary }]}>Year {item.yearLevel}</Text>}
          </View>
        </View>
        {!selectionMode && (
          <View style={styles.userActions}>
            {(item.status === 'pending' || item.status === 'approved') && (
              <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: colors.green }]} onPress={() => confirmAction(item, 'approve')}><Ionicons name="checkmark" size={18} color="#fff" /></TouchableOpacity>
            )}
            {item.status === 'activated' && (
              <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: colors.red }]} onPress={() => confirmAction(item, 'deactivate')}><Ionicons name="close" size={18} color="#fff" /></TouchableOpacity>
            )}
            {item.status === 'deactivated' && (
              <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: colors.blue }]} onPress={() => confirmAction(item, 'activate')}><Ionicons name="play" size={18} color="#fff" /></TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [colors.text, colors.textSecondary, colors.card, colors.blue, colors.green, colors.red, colors.orange, selectedUserIDs, selectionMode]);

  const renderSkeleton = () => (
    <View style={[styles.userCard, { backgroundColor: colors.card }]}>
      <View style={[styles.skeletonAvatar, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
      <View style={{ flex: 1 }}>
        <View style={[styles.skeletonLine, { backgroundColor: isDark ? '#374151' : '#e5e7eb', width: '60%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: isDark ? '#374151' : '#e5e7eb', width: '40%', marginTop: 6 }]} />
      </View>
    </View>
  );

  const pendingCount = users.filter((u: any) => u.status === 'pending' || u.status === 'approved').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(auth)/(program-chair)/dashboard' as any); }} style={styles.backButton}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>User Management</Text>
        {pendingCount > 0 && (
          <TouchableOpacity style={[styles.approveAllBtn, { backgroundColor: colors.green }]} onPress={handleApproveAll} activeOpacity={0.7}>
            <Ionicons name="checkmark-done" size={18} color="#fff" />
            <Text style={styles.approveAllText}>{pendingCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.orange} /></View>
      ) : (
        <>
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => String(item.userID)}
            renderItem={renderUser}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.orange]} tintColor={colors.orange} />}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={15}
            ListHeaderComponent={
              <Animated.View style={{ opacity: fadeAnim }}>
                <View style={styles.statsRow}>
                  <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderLeftColor: colors.blue, borderLeftWidth: 4 }]} onPress={() => setActiveRoleFilter(activeRoleFilter === 'admin' ? 'all' : 'admin')} activeOpacity={0.7}>
                    <Ionicons name="shield-checkmark" size={28} color={colors.blue} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.admins}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Admins</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderLeftColor: colors.green, borderLeftWidth: 4 }]} onPress={() => setActiveRoleFilter(activeRoleFilter === 'student' ? 'all' : 'student')} activeOpacity={0.7}>
                    <Ionicons name="school" size={28} color={colors.green} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.students}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Students</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="search" size={18} color={colors.textSecondary} />
                  <TextInput style={[styles.searchInput, { color: colors.text }]} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search users..." placeholderTextColor={colors.textSecondary} />
                  {searchQuery ? <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color={colors.textSecondary} /></TouchableOpacity> : null}
                </View>

                <View style={styles.filterRow}>
                  {[{ key: 'all', label: 'All', icon: 'people' as const }, { key: 'admin', label: 'Admins', icon: 'shield-checkmark' as const }, { key: 'student', label: 'Students', icon: 'school' as const }].map(f => (
                    <TouchableOpacity key={f.key} style={[styles.filterTab, activeRoleFilter === f.key && { backgroundColor: colors.orange }]} onPress={() => setActiveRoleFilter(f.key)} activeOpacity={0.7}>
                      <Ionicons name={f.icon} size={16} color={activeRoleFilter === f.key ? '#fff' : colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.filterText, { color: activeRoleFilter === f.key ? '#fff' : colors.textSecondary }]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.advancedFilterBtn, showAdvancedFilters && { backgroundColor: colors.orange }]} onPress={() => setShowAdvancedFilters(!showAdvancedFilters)} activeOpacity={0.7}>
                    <Ionicons name="options" size={16} color={showAdvancedFilters ? '#fff' : colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.statusFilterRow}>
                  {['all', 'pending', 'approved', 'activated', 'deactivated'].map(f => (
                    <TouchableOpacity key={f} style={[styles.statusFilterBtn, activeStatusFilter === f && { backgroundColor: f === 'pending' ? colors.blue : f === 'approved' ? colors.orange : f === 'activated' ? colors.green : colors.red }]} onPress={() => setActiveStatusFilter(f)} activeOpacity={0.7}>
                      <Text style={[styles.statusFilterText, { color: activeStatusFilter === f ? '#fff' : colors.textSecondary }]}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {showAdvancedFilters && (
                  <View style={styles.advancedFilters}>
                    <View style={styles.advancedRow}>
                      <FilterDropdown label="Program" value={programFilter} onValueChange={setProgramFilter} options={[{ id: 'all', label: 'All Programs' }, ...programs]} colors={colors} />
                      <FilterDropdown label="Year" value={yearFilter} onValueChange={setYearFilter} options={[{ id: 'all', label: 'All Years' }, ...years.map(y => ({ id: String(y), label: `Year ${y}` }))]} colors={colors} />
                    </View>
                    <FilterDropdown label="Campus" value={campusFilter} onValueChange={setCampusFilter} options={[{ id: 'all', label: 'All Campuses' }, ...campuses]} colors={colors} />
                  </View>
                )}
              </Animated.View>
            }
            ListEmptyComponent={
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Ionicons name="people" size={48} color={colors.orange} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Users Found</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Try adjusting your filters.</Text>
              </View>
            }
          />

          {selectionMode && (
            <View style={[styles.bulkBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <View style={styles.bulkBarTop}>
                <Text style={[styles.bulkBarText, { color: colors.text }]}>{selectedUserIDs.size} selected</Text>
                <TouchableOpacity onPress={selectAllVisible} activeOpacity={0.7}>
                  <Text style={[styles.bulkBarLink, { color: colors.orange }]}>Select all visible</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deselectAll} activeOpacity={0.7}>
                  <Text style={[styles.bulkBarLink, { color: colors.red }]}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bulkActionsRow}>
                <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: colors.green }]} onPress={() => handleBulkAction('approve')} disabled={isBulkActing} activeOpacity={0.8}>
                  <Ionicons name="checkmark-done" size={18} color="#fff" />
                  <Text style={styles.bulkBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: colors.blue }]} onPress={() => handleBulkAction('activate')} disabled={isBulkActing} activeOpacity={0.8}>
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={styles.bulkBtnText}>Activate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: colors.red }]} onPress={() => handleBulkAction('deactivate')} disabled={isBulkActing} activeOpacity={0.8}>
                  <Ionicons name="pause" size={18} color="#fff" />
                  <Text style={styles.bulkBtnText}>Deactivate</Text>
                </TouchableOpacity>
              </View>
              {isBulkActing && <ActivityIndicator style={{ marginTop: 8 }} size="small" color={colors.orange} />}
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
    <View style={{ flex: 1, marginHorizontal: 4 }}>
      <Text style={[styles.advLabel, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity style={[styles.advSelect, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[styles.advSelectText, { color: selected?.id === 'all' ? colors.textSecondary : colors.text }]} numberOfLines={1}>{selected?.label || label}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={[styles.dropdownOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[styles.dropdownCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>{label}</Text>
            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled>
              {options.map((opt: any) => (
                <TouchableOpacity key={opt.id} style={[styles.dropdownOption, value === opt.id && { backgroundColor: `${colors.orange}15` }]} onPress={() => { onValueChange(opt.id); setOpen(false); }} activeOpacity={0.7}>
                  <Text style={[styles.dropdownOptionText, { color: colors.text }, value === opt.id && { color: colors.orange, fontWeight: '700' }]}>{opt.label}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  approveAllBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  approveAllText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 13, marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'center' },
  filterTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18 },
  filterText: { fontSize: 12, fontWeight: '600' },
  advancedFilterBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  statusFilterRow: { flexDirection: 'row', gap: 4, marginBottom: 8, flexWrap: 'wrap' },
  statusFilterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  statusFilterText: { fontSize: 11, fontWeight: '600' },
  advancedFilters: { marginBottom: 12 },
  advancedRow: { flexDirection: 'row', gap: 4 },
  advLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  advSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, padding: 8 },
  advSelectText: { fontSize: 13, flex: 1, marginRight: 4 },
  dropdownOverlay: { flex: 1, justifyContent: 'flex-end' },
  dropdownCard: { marginHorizontal: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  dropdownTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  dropdownOptionText: { fontSize: 14, flex: 1 },
  userCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, gap: 12, elevation: 2, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 15, fontWeight: '700', flex: 1 },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  userMeta: { fontSize: 12, marginTop: 2 },
  userMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  metaTag: { fontSize: 10 },
  userActions: { gap: 4 },
  actionIconBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  emptyState: { borderRadius: 24, padding: 32, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  skeletonAvatar: { width: 48, height: 48, borderRadius: 24 },
  skeletonLine: { height: 12, borderRadius: 6 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  bulkBar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, padding: 12, paddingBottom: 24 },
  bulkBarTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  bulkBarText: { fontSize: 14, fontWeight: '700' },
  bulkBarLink: { fontSize: 13, fontWeight: '600' },
  bulkActionsRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  bulkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10 },
  bulkBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
