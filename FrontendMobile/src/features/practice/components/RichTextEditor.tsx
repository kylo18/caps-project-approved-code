// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Reusable rich text editor wrapper using react-native-pell-rich-editor.
//          Provides a toolbar and an editor area. Outputs/accepts HTML content.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useTheme } from '../../../contexts/ThemeContext';

interface RichTextEditorProps {
    initialContent?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ initialContent = '', onChange, placeholder = 'Enter content...' }: RichTextEditorProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const richText = useRef<RichEditor>(null);
    const [height, setHeight] = useState(200);

    const colors = {
        bg: isDark ? '#111827' : '#fff',
        text: isDark ? '#f9fafb' : '#111827',
        border: isDark ? '#374151' : '#e5e7eb',
        toolbarBg: isDark ? '#1f2937' : '#f3f4f6',
        icon: isDark ? '#f9fafb' : '#111827',
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View className="flex-1 rounded-xl overflow-hidden border" style={{ backgroundColor: colors.bg, borderColor: colors.border, minHeight: 240 }}>
                <RichToolbar
                    editor={richText}
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.heading1,
                        actions.heading2,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.insertLink,
                        actions.keyboard,
                    ]}
                    className="rounded-t-xl"
                    iconTint={colors.icon}
                    selectedIconTint="#FE6902"
                    disabledIconTint="#9ca3af"
                />
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <RichEditor
                        ref={richText}
                        initialContentHTML={initialContent}
                        onChange={onChange}
                        placeholder={placeholder}
                        className="flex-1 p-3 rounded-b-xl"
                        style={{ backgroundColor: colors.bg, color: colors.text } as any}
                        initialHeight={height}
                        onHeightChange={setHeight}
                        useContainer
                    />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

