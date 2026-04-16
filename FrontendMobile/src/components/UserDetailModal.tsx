// ─────────────────────────────────────────────────────────────────────────────
// Purpose: User detail modal for admin user management.
//          Displays full profile info and allows role changes + single-user actions.
//          Now supports role-based restrictions (Program Chair limited, etc.)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../services/apiClient';
import { useTheme } from '../contexts/ThemeContext';
import { showToast } from '../hooks/useToast';
import { useSelector } from 'react-redux';

const avatarPalette = ['#FFE17B', '#FFD4EA', '#D9DCFF', '#D6F4D2', '#FFD0B1'];

const ROLES = [
    { id: 1, name: 'Student' },
    { id: 2, name: 'Faculty' },
    { id: 3, name: 'Program Chair' },
    { id: 4, name: 'Dean' },
    { id: 5, name: 'Associate Dean' },
];

interface UserDetailModalProps {
    visible: boolean;
    user: any | null;
    onClose: () => void;
    onUserUpdated: () => void;
}

export default function UserDetailModal({ visible, user, onClose, onUserUpdated }: UserDetailModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);
    const [isActing, setIsActing] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [otherDeansCount, setOtherDeansCount] = useState(0);

    const auth = useSelector((state: any) => state.auth);
    const currentUser = auth?.user;
    const currentUserRole = currentUser?.roleID;

    const colors = {
        bg: isDark ? '#000' : '#f3f4f6',
        card: isDark ? '#1f2937' : '#fff',
        text: isDark ? '#f9fafb' : '#111827',
        textSecondary: isDark ? '#9ca3af' : '#6b7280',
        border: isDark ? '#374151' : '#e5e7eb',
        orange: '#FE6902',
        green: '#10B981',
        red: '#EF4444',
        blue: '#3B82F6',
    };

    useEffect(() => {
        if (!visible) {
            setShowRoleDropdown(false);
        }
    }, [visible]);

    useEffect(() => {
        if (visible && currentUserRole === 4 && user) {
            fetchOtherDeansCount();
        }
    }, [visible, currentUserRole, user]);

    const fetchOtherDeansCount = async () => {
        try {
            const data = await apiRequest('/api/users?limit=10000');
            const list = Array.isArray(data?.users) ? data.users : Array.isArray(data?.data) ? data.data : [];
            const count = list.filter((u: any) => u.roleID === 4 && u.userID !== currentUser?.userID).length;
            setOtherDeansCount(count);
        } catch (error) {
            console.error('Failed to fetch other deans count:', error);
        }
    };

    const availableRoles = useMemo(() => {
        if (!user || !currentUserRole) return [];

        // Program Chair: can only assign Student (1) and Faculty (2)
        if (currentUserRole === 3) {
            // Cannot change another Program Chair's role
            if (user.roleID === 3) return [];
            return ROLES.filter(r => [1, 2].includes(r.id));
        }

        // Dean: can assign all roles
        if (currentUserRole === 4) {
            // Self-protection: can't demote self if only one dean
            if (user.userID === currentUser?.userID && user.roleID === 4 && otherDeansCount <= 0) {
                return ROLES.filter(r => r.id !== 4);
            }
            return ROLES;
        }

        // Associate Dean: can assign all except Dean (4)
        if (currentUserRole === 5) {
            return ROLES.filter(r => r.id !== 4);
        }

        // Faculty / Student / default: no role changes
        return [];
    }, [currentUserRole, user, otherDeansCount, currentUser?.userID]);

    if (!user) return null;

    const getInitials = () => `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?';
    const currentRole = ROLES.find(r => r.id === user.roleID) || { name: 'Unknown' };
    const canChangeRole = availableRoles.length > 0;

    const handleRoleChange = async (roleID: number) => {
        if (roleID === user.roleID) {
            setShowRoleDropdown(false);
            return;
        }
        setIsUpdatingRole(true);
        try {
            await apiRequest(`/api/users/${user.userID}/role`, {
                method: 'PATCH',
                body: { roleID },
            });
            showToast('Role updated successfully', 'success');
            onUserUpdated();
        } catch (error: any) {
            showToast(error?.data?.message || 'Failed to update role', 'error');
        } finally {
            setIsUpdatingRole(false);
            setShowRoleDropdown(false);
        }
    };

    const handleAction = async (action: 'approve' | 'activate' | 'deactivate' | 'delete') => {
        const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
        Alert.alert(
            `${actionLabel} User`,
            `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: actionLabel,
                    style: action === 'delete' || action === 'deactivate' ? 'destructive' : 'default',
                    onPress: async () => {
                        setIsActing(true);
                        try {
                            if (action === 'delete') {
                                await apiRequest(`/api/users/${user.userID}`, { method: 'DELETE' });
                            } else {
                                await apiRequest(`/api/users/${user.userID}/${action}`, { method: 'PATCH' });
                            }
                            showToast(`User ${action === 'approve' ? 'approved' : action + 'd'}`, 'success');
                            onUserUpdated();
                            onClose();
                        } catch (error: any) {
                            showToast(error?.data?.message || `Failed to ${action} user`, 'error');
                        } finally {
                            setIsActing(false);
                        }
                    },
                },
            ]
        );
    };

    const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={18} color={colors.textSecondary} style={{ width: 24 }} />
            <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    const showDelete = currentUserRole === 4 || currentUserRole === 5;
    const isSelf = user.userID === currentUser?.userID;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>User Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Avatar & Name */}
                        <View style={styles.avatarSection}>
                            <View style={[styles.avatar, { backgroundColor: avatarPalette[user.userID % avatarPalette.length] }]}>
                                <Text style={styles.avatarText}>{getInitials()}</Text>
                            </View>
                            <Text style={[styles.name, { color: colors.text }]}>{user.firstName} {user.lastName}</Text>
                            <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
                        </View>

                        {/* Info */}
                        <View style={[styles.infoCard, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
                            <InfoRow icon="person-outline" label="User Code" value={user.userCode} />
                            <InfoRow icon="shield-checkmark-outline" label="Role" value={currentRole.name} />
                            <InfoRow icon="information-circle-outline" label="Status" value={user.status || 'pending'} />
                            <InfoRow icon="school-outline" label="Program" value={user.programName} />
                            <InfoRow icon="calendar-outline" label="Year Level" value={user.yearLevel ? `Year ${user.yearLevel}` : ''} />
                            <InfoRow icon="business-outline" label="Campus" value={user.campusName} />
                        </View>

                        {/* Role Change */}
                        {canChangeRole && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Role</Text>
                                <TouchableOpacity
                                    style={[styles.roleSelector, { backgroundColor: isDark ? '#111827' : '#f9fafb', borderColor: colors.border }]}
                                    onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                                    activeOpacity={0.7}
                                    disabled={isUpdatingRole}
                                >
                                    <Text style={[styles.roleSelectorText, { color: colors.text }]}>{currentRole.name}</Text>
                                    {isUpdatingRole ? (
                                        <ActivityIndicator size="small" color={colors.orange} />
                                    ) : (
                                        <Ionicons name={showRoleDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                                    )}
                                </TouchableOpacity>

                                {showRoleDropdown && (
                                    <View style={[styles.dropdown, { backgroundColor: isDark ? '#111827' : '#f9fafb', borderColor: colors.border }]}>
                                        {availableRoles.map(role => (
                                            <TouchableOpacity
                                                key={role.id}
                                                style={[styles.dropdownOption, user.roleID === role.id && { backgroundColor: `${colors.orange}15` }]}
                                                onPress={() => handleRoleChange(role.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.dropdownOptionText, { color: colors.text }, user.roleID === role.id && { color: colors.orange, fontWeight: '700' }]}>
                                                    {role.name}
                                                </Text>
                                                {user.roleID === role.id && <Ionicons name="checkmark" size={18} color={colors.orange} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Actions */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
                            <View style={styles.actionsGrid}>
                                {(user.status === 'pending' || user.status === 'approved') && (
                                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.green }]} onPress={() => handleAction('approve')} activeOpacity={0.8} disabled={isActing}>
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                        <Text style={styles.actionBtnText}>Approve</Text>
                                    </TouchableOpacity>
                                )}
                                {user.status === 'activated' && (
                                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.red }]} onPress={() => handleAction('deactivate')} activeOpacity={0.8} disabled={isActing}>
                                        <Ionicons name="close" size={20} color="#fff" />
                                        <Text style={styles.actionBtnText}>Deactivate</Text>
                                    </TouchableOpacity>
                                )}
                                {user.status === 'deactivated' && (
                                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.blue }]} onPress={() => handleAction('activate')} activeOpacity={0.8} disabled={isActing}>
                                        <Ionicons name="play" size={20} color="#fff" />
                                        <Text style={styles.actionBtnText}>Activate</Text>
                                    </TouchableOpacity>
                                )}
                                {showDelete && !isSelf && (
                                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.red }]} onPress={() => handleAction('delete')} activeOpacity={0.8} disabled={isActing}>
                                        <Ionicons name="trash" size={20} color="#fff" />
                                        <Text style={styles.actionBtnText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    closeBtn: { padding: 4 },
    content: { padding: 20, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    name: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
    email: { fontSize: 14, marginTop: 4, textAlign: 'center' },
    infoCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    infoLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { fontSize: 14, fontWeight: '500', marginTop: 2 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
    roleSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    roleSelectorText: { fontSize: 15, fontWeight: '600' },
    dropdown: { marginTop: 8, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    dropdownOptionText: { fontSize: 14 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, minWidth: 120, justifyContent: 'center' },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
