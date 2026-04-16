// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Reusable skeleton loading component for mobile screens.
//          Provides animated pulse effect to indicate loading state.
//
// Features:
// - Animated pulse effect using React Native Animated API
// - Configurable width, height, border radius
// - Dark mode support
// - Multiple variants (text, card, avatar, button)
//
// Usage:
// <Skeleton variant="text" />
// <Skeleton variant="card" />
// <Skeleton variant="avatar" />
// <Skeleton variant="button" />
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonProps {
    variant?: 'text' | 'card' | 'avatar' | 'button';
    className?: string;
    style?: object;
}

export function Skeleton({ variant = 'text', className = '', style }: SkeletonProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.4,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    const variantStyles = {
        text: {
            height: 16,
            width: '100%',
            borderRadius: 4,
        },
        card: {
            height: 120,
            width: '100%',
            borderRadius: 16,
        },
        avatar: {
            height: 40,
            width: 40,
            borderRadius: 20,
        },
        button: {
            height: 36,
            width: 80,
            borderRadius: 8,
        },
    };

    const variantStyle = variantStyles[variant];

    return (
        <Animated.View
            className={className}
            style={[
                variantStyle,
                {
                    backgroundColor: isDark ? '#374151' : '#E5E7EB',
                    opacity,
                },
                style,
            ]}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Skeleton card for list items
//
// Features:
// - Mimics a question/subject card layout
// - Shows placeholder for title, description, badges
// ─────────────────────────────────────────────────────────────────────────────

export function SkeletonCard() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View
            className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
            {/* Header row */}
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                    <Skeleton variant="avatar" />
                    <Skeleton variant="button" style={{ width: 64 }} />
                </View>
                <Skeleton variant="text" style={{ width: 60, height: 14 }} />
            </View>

            {/* Title lines */}
            <View className="mb-3">
                <Skeleton variant="text" className="mb-2" />
                <Skeleton variant="text" style={{ width: '75%' }} />
            </View>

            {/* Tags row */}
            <View className="flex-row items-center gap-2 mb-3">
                <Skeleton variant="button" style={{ width: 64 }} />
                <Skeleton variant="button" style={{ width: 80 }} />
            </View>

            {/* Footer */}
            <View className="flex-row justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center gap-2">
                    <Skeleton variant="avatar" style={{ height: 24, width: 24, borderRadius: 12 }} />
                    <Skeleton variant="text" style={{ width: 80, height: 12 }} />
                </View>
                <View className="flex-row items-center gap-2">
                    <Skeleton variant="button" style={{ height: 32, width: 32, borderRadius: 8 }} />
                    <Skeleton variant="button" style={{ height: 32, width: 32, borderRadius: 8 }} />
                </View>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Skeleton list container for multiple items
// ─────────────────────────────────────────────────────────────────────────────

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Skeleton for stats cards
// ─────────────────────────────────────────────────────────────────────────────

export function SkeletonStatsGrid() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View className="flex-row flex-wrap gap-3">
            <View className={`flex-1 min-w-36 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Skeleton variant="text" style={{ width: 64, marginBottom: 12 }} />
                <Skeleton variant="text" style={{ width: 80, height: 32, marginBottom: 8 }} />
                <Skeleton variant="text" style={{ width: 96 }} />
            </View>
            <View className={`flex-1 min-w-36 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Skeleton variant="text" style={{ width: 64, marginBottom: 12 }} />
                <Skeleton variant="text" style={{ width: 80, height: 32, marginBottom: 8 }} />
                <Skeleton variant="text" style={{ width: 96 }} />
            </View>
        </View>
    );
}

export default Skeleton;
