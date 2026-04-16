// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Reusable rich text editor wrapper using react-native-pell-rich-editor.
//          Provides a toolbar and an editor area. Outputs/accepts HTML content.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useTheme } from '../contexts/ThemeContext';

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
            <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
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
                    style={[styles.toolbar, { backgroundColor: colors.toolbarBg }]}
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
                        style={[styles.editor, { backgroundColor: colors.bg, color: colors.text }]}
                        initialHeight={height}
                        onHeightChange={setHeight}
                        useContainer
                    />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', flex: 1, minHeight: 240 },
    toolbar: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    editor: { flex: 1, padding: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
});
