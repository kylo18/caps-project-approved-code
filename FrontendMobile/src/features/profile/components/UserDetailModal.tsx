// ─────────────────────────────────────────────────────────────────────────────
// Purpose: User detail modal for admin user management.
//          Displays full profile info and allows role changes + single-user actions.
//          Now supports role-based restrictions (Program Chair limited, etc.)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../../services/apiClient';
import { useTheme } from '../../../contexts/ThemeContext';
import { showToast } from '../../../hooks/useToast';
import { useSelector } from 'react-redux';
import CapsActivityIndicator from '../../../features/core/components/CapsActivityIndicator';
import { getRoleThemeColors } from '../../../features/core/styles/roleTheme';
import {
    applyUserActionLocally,
    canApproveUser,
    canDisapproveUser,
    canReapproveUser,
    getUserStatusLabel,
    getUserYearLevelLabel,
    isActiveUser,
    isDisapprovedUser,
    isInactiveUser,
} from '../../../utils/userManagement';

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

    const roleColors = getRoleThemeColors(isDark);
    const colors = {
        bg: roleColors.page,
        card: roleColors.surface,
        surfaceSoft: roleColors.surfaceSoft,
        input: roleColors.input,
        text: roleColors.text,
        textSecondary: roleColors.muted,
        border: roleColors.border,
        orange: roleColors.accent,
        green: '#10B981',
        red: '#EF4444',
        blue: '#3B82F6',
        purple: '#8B5CF6',
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
            const data = await apiRequest('/api/users?limit=10000&status=registered');
            const list = Array.isArray(data?.users) ? data.users : Array.isArray(data?.data) ? data.data : [];
            const count = list.filter((u: any) => u.roleID === 4 && u.userID !== currentUser?.userID).length;
            setOtherDeansCount(count);
        } catch (error) {
            console.error('Failed to fetch other deans count:', error);
        }
    };

    const availableRoles = useMemo(() => {
        if (!user || !currentUserRole) return [];
        if (currentUserRole === 3) {
            if (user.roleID === 3) return [];
            return ROLES.filter(r => [1, 2].includes(r.id));
        }
        if (currentUserRole === 4) {
            if (user.userID === currentUser?.userID && user.roleID === 4 && otherDeansCount <= 0) {
                return ROLES.filter(r => r.id !== 4);
            }
            return ROLES;
        }
        if (currentUserRole === 5) {
            return ROLES.filter(r => r.id !== 4);
        }
        return [];
    }, [currentUserRole, user, otherDeansCount, currentUser?.userID]);

    if (!user) return null;

    const getInitials = () => `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?';
    const currentRole = ROLES.find(r => r.id === user.roleID) || { name: 'Unknown' };
    const canChangeRole = availableRoles.length > 0;
    const statusLabel = getUserStatusLabel(user);
    const showApproveAction = canApproveUser(user);
    const showDisapproveAction = canDisapproveUser(user);
    const showReapproveAction = canReapproveUser(user);
    const showDeactivateAction = isActiveUser(user);
    const showActivateAction = isInactiveUser(user);
    const programLabel =
        user.programName ||
        user.program?.programName ||
        user.program?.name ||
        user.program ||
        '';
    const yearLevelLabel = getUserYearLevelLabel(user);
    const campusLabel =
        user.campusName ||
        user.campus?.campusName ||
        user.campus?.name ||
        user.campus ||
        '';

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
        } catch (error: unknown) {
            const msg = error instanceof Error && 'data' in error
              ? (error as { data?: { message?: string } }).data?.message || 'Failed to update role'
              : 'Failed to update role';
            showToast(msg, 'error');
        } finally {
            setIsUpdatingRole(false);
            setShowRoleDropdown(false);
        }
    };

    const handleAction = async (action: 'approve' | 'activate' | 'deactivate' | 'disapprove' | 'reapprove') => {
        const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
        Alert.alert(
            `${actionLabel} User`,
            `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: actionLabel,
                    style: (action === 'deactivate' || action === 'disapprove') ? 'destructive' : 'default',
                    onPress: async () => {
                        setIsActing(true);
                        try {
                            await apiRequest(`/api/users/${user.userID}/${action}`, { method: 'PATCH' });
                            const updatedUser = applyUserActionLocally(user, action);
                            showToast(
                                action === 'approve'
                                    ? 'User approved and activated'
                                    : action === 'activate'
                                        ? 'User activated'
                                        : action === 'deactivate'
                                            ? 'User deactivated'
                                            : action === 'disapprove'
                                                ? 'User disapproved'
                                                : 'User moved back to pending',
                                'success'
                            );
                            onUserUpdated();
                            onClose();
                        } catch (error: unknown) {
                            const msg = error instanceof Error && 'data' in error
                              ? (error as { data?: { message?: string } }).data?.message || `Failed to ${action} user`
                              : `Failed to ${action} user`;
                            showToast(msg, 'error');
                        } finally {
                            setIsActing(false);
                        }
                    },
                },
            ]
        );
    };

    const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
        <View className="flex-row items-center gap-3 py-3">
            <View className="w-6">
                <Ionicons name={icon} size={18} color={colors.textSecondary} />
            </View>
            <View className="flex-1">
                <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>{label}</Text>
                <Text className="text-sm font-semibold" numberOfLines={1} style={{ color: colors.text }}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 justify-center items-center" style={{ backgroundColor: roleColors.overlay }}>
                <View className="flex-1 w-full max-w-md mx-4 my-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}>
                    {/* Header */}
                    <View className="flex-row justify-between items-center px-5 py-4 border-b" style={{ borderBottomColor: colors.border }}>
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>User Details</Text>
                        <TouchableOpacity className="p-1" onPress={onClose} activeOpacity={0.7}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                        {/* Avatar & Name */}
                        <View className="items-center mt-6 mb-4">
                            <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: avatarPalette[user.userID % avatarPalette.length] }}>
                                <Text className="text-2xl font-extrabold text-gray-900">{getInitials()}</Text>
                            </View>
                            <Text className="text-xl font-bold" style={{ color: colors.text }}>{user.firstName} {user.lastName}</Text>
                            <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>{user.email}</Text>
                        </View>

                        {/* Info */}
                        <View className="rounded-xl px-4 py-1 mb-4" style={{ backgroundColor: colors.surfaceSoft }}>
                            <InfoRow icon="person-outline" label="User Code" value={user.userCode} />
                            <InfoRow icon="shield-checkmark-outline" label="Role" value={currentRole.name} />
                            <InfoRow icon="information-circle-outline" label="Status" value={statusLabel} />
                            <InfoRow icon="school-outline" label="Program" value={programLabel} />
                            <InfoRow icon="calendar-outline" label="Year Level" value={yearLevelLabel} />
                            <InfoRow icon="business-outline" label="Campus" value={campusLabel} />
                        </View>

                        {/* Role Change */}
                        {canChangeRole && (
                            <View className="mt-2 mb-2">
                                <Text className="text-sm font-bold mb-2" style={{ color: colors.text }}>Change Role</Text>
                                <TouchableOpacity
                                    className="flex-row justify-between items-center px-4 py-3 rounded-xl border"
                                    style={{ backgroundColor: colors.input, borderColor: colors.border }}
                                    onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                                    activeOpacity={0.7}
                                    disabled={isUpdatingRole}
                                >
                                    <Text className="text-sm font-medium" style={{ color: colors.text }}>{currentRole.name}</Text>
                                    {isUpdatingRole ? (
                                        <CapsActivityIndicator size="small" color={colors.orange} />
                                    ) : (
                                        <Ionicons name={showRoleDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                                    )}
                                </TouchableOpacity>

                                {showRoleDropdown && (
                                    <View className="mt-1 rounded-xl border overflow-hidden" style={{ backgroundColor: colors.input, borderColor: colors.border }}>
                                        {availableRoles.map(role => (
                                            <TouchableOpacity
                                                key={role.id}
                                                className="flex-row justify-between items-center px-4 py-3"
                                                style={{ backgroundColor: user.roleID === role.id ? `${colors.orange}15` : 'transparent' }}
                                                onPress={() => handleRoleChange(role.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text className="text-sm" style={{ color: user.roleID === role.id ? colors.orange : colors.text, fontWeight: user.roleID === role.id ? '700' : '400' }}>
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
                        <View className="mt-4">
                            <Text className="text-sm font-bold mb-3" style={{ color: colors.text }}>Actions</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {showApproveAction && (
                                    <TouchableOpacity
                                        className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl"
                                        style={{ backgroundColor: colors.green }}
                                        onPress={() => handleAction('approve')}
                                        activeOpacity={0.8}
                                        disabled={isActing}
                                    >
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                        <Text className="text-white text-sm font-bold">Approve</Text>
                                    </TouchableOpacity>
                                )}
                                {showDisapproveAction && (
                                    <TouchableOpacity
                                        className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl"
                                        style={{ backgroundColor: colors.red }}
                                        onPress={() => handleAction('disapprove')}
                                        activeOpacity={0.8}
                                        disabled={isActing}
                                    >
                                        <Ionicons name="close" size={20} color="#fff" />
                                        <Text className="text-white text-sm font-bold">Disapprove</Text>
                                    </TouchableOpacity>
                                )}
                                {showReapproveAction && (
                                    <TouchableOpacity
                                        className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl"
                                        style={{ backgroundColor: colors.purple }}
                                        onPress={() => handleAction('reapprove')}
                                        activeOpacity={0.8}
                                        disabled={isActing}
                                    >
                                        <Ionicons name="refresh" size={20} color="#fff" />
                                        <Text className="text-white text-sm font-bold">Re-approve</Text>
                                    </TouchableOpacity>
                                )}
                                {showDeactivateAction && (
                                    <TouchableOpacity
                                        className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl"
                                        style={{ backgroundColor: colors.red }}
                                        onPress={() => handleAction('deactivate')}
                                        activeOpacity={0.8}
                                        disabled={isActing}
                                    >
                                        <Ionicons name="close" size={20} color="#fff" />
                                        <Text className="text-white text-sm font-bold">Deactivate</Text>
                                    </TouchableOpacity>
                                )}
                                {showActivateAction && (
                                    <TouchableOpacity
                                        className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl"
                                        style={{ backgroundColor: colors.blue }}
                                        onPress={() => handleAction('activate')}
                                        activeOpacity={0.8}
                                        disabled={isActing}
                                    >
                                        <Ionicons name="play" size={20} color="#fff" />
                                        <Text className="text-white text-sm font-bold">Activate</Text>
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
