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
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl, Alert, Animated, Modal, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../src/services/apiClient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { showToast } from '../../../src/hooks/useToast';

const avatarPalette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];
const ADMIN_ROLES = [2, 3, 4, 5];
const STUDENT_ROLE = 1;

export default function AdminUsersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
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
      const adminCount = userList.filter(u => ADMIN_ROLES.includes(u.roleID)).length;
      const studentCount = userList.filter(u => u.roleID === STUDENT_ROLE).length;
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
      if (activeRoleFilter === 'admin') filtered = filtered.filter(u => ADMIN_ROLES.includes(u.roleID));
      else if (activeRoleFilter === 'student') filtered = filtered.filter(u => u.roleID === STUDENT_ROLE);
      if (activeStatusFilter !== 'all') filtered = filtered.filter(u => u.status === activeStatusFilter);
      if (programFilter !== 'all') filtered = filtered.filter(u => String(u.programID) === programFilter);
      if (yearFilter !== 'all') filtered = filtered.filter(u => String(u.yearLevel) === yearFilter);
      if (campusFilter !== 'all') filtered = filtered.filter(u => String(u.campusID) === campusFilter);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(u =>
          u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) || u.userCode?.toLowerCase().includes(q)
        );
      }
      setFilteredUsers(filtered);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  }, [searchQuery, activeRoleFilter, activeStatusFilter, programFilter, yearFilter, campusFilter, users]);

  const handleAction = async (userID, action) => {
    try {
      await apiRequest(`/api/users/${userID}/${action}`, { method: 'PATCH' });
      setUsers(prev => prev.map(u => u.userID === userID ? { ...u, status: action === 'approve' ? 'activated' : action === 'deactivate' ? 'deactivated' : 'activated' } : u));
      showToast(`User ${action}d`, 'success');
    } catch (error) {
      showToast(`Failed to ${action} user`, 'error');
    }
  };

  const confirmAction = (user, action) => {
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} User`, `${action.charAt(0).toUpperCase() + action.slice(1)} ${user.firstName} ${user.lastName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action.charAt(0).toUpperCase() + action.slice(1), style: action === 'deactivate' ? 'destructive' : 'default', onPress: () => handleAction(user.userID, action) },
    ]);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  };

  const getInitials = (user) => `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?';
  const isAdmin = (user) => ADMIN_ROLES.includes(user.roleID);

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

  // Extract unique values for filters
  const programs = [...new Map(users.filter(u => u.programName).map(u => ({ id: String(u.programID), label: u.programName }))).values()];
  const years = [...new Set(users.filter(u => u.yearLevel).map(u => u.yearLevel))].sort();
  const campuses = [...new Map(users.filter(u => u.campusName).map(u => ({ id: String(u.campusID), label: u.campusName }))).values()];

  const renderUser = useCallback(({ item }) => (
    <View style={[styles.userCard, { backgroundColor: colors.card }]}>
      <View style={[styles.avatar, { backgroundColor: avatarPalette[item.userID % avatarPalette.length] }]}>
        <Text style={styles.avatarText}>{getInitials(item)}</Text>
      </View>
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
      <View style={styles.userActions}>
        {(item.status === 'pending' || item.status === 'approved') && (
          <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: colors.green }]} onPress={() => confirmAction(item, 'approve')}><Ionicons name="checkmark" size={18} color="#fff" /></TouchableOpacity>
        )}
        {item.status === 'activated' && (
          <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: colors.red }]} onPress={() => confirmAction(item, 'deactivate')}><Ionicons name="close" size={18} color="#fff" /></TouchableOpacity>
        )}
        {['deactivated', 'deactivated'].includes(item.status) && (
          <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: colors.blue }]} onPress={() => confirmAction(item, 'activate')}><Ionicons name="play" size={18} color="#fff" /></TouchableOpacity>
        )}
      </View>
    </View>
  ), [colors.text, colors.textSecondary, colors.card, colors.blue, colors.green, colors.red, colors.orange]);

  const renderSkeleton = () => (
    <View style={[styles.userCard, { backgroundColor: colors.card }]}>
      <View style={[styles.skeletonAvatar, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
      <View style={{ flex: 1 }}>
        <View style={[styles.skeletonLine, { backgroundColor: isDark ? '#374151' : '#e5e7eb', width: '60%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: isDark ? '#374151' : '#e5e7eb', width: '40%', marginTop: 6 }]} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>User Management</Text>
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
                {/* Stats */}
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

                {/* Search */}
                <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="search" size={18} color={colors.textSecondary} />
                  <TextInput style={[styles.searchInput, { color: colors.text }]} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search users..." placeholderTextColor={colors.textSecondary} />
                  {searchQuery ? <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color={colors.textSecondary} /></TouchableOpacity> : null}
                </View>

                {/* Role & Status Filters */}
                <View style={styles.filterRow}>
                  {[{ key: 'all', label: 'All', icon: 'people' }, { key: 'admin', label: 'Admins', icon: 'shield-checkmark' }, { key: 'student', label: 'Students', icon: 'school' }].map(f => (
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

                {/* Advanced Filters */}
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
        </>
      )}
    </View>
  );
}

// Reusable Filter Dropdown
function FilterDropdown({ label, value, onValueChange, options, colors }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);

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
              {options.map(opt => (
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
  headerTitle: { fontSize: 20, fontWeight: '700' },
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
});
