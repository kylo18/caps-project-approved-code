import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import {
  getBookmarks,
  removeBookmark,
  type BookmarkItem,
} from '../../../src/services/studentBookmarkService';
import { studentColors } from '../../../src/features/student/ui/StudentUI';
import CapsActivityIndicator from '../../../src/features/core/components/CapsActivityIndicator';

export default function BookmarksScreen() {
  const router = useRouter();
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const insets = useSafeAreaInsets();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getBookmarks();
    setBookmarks(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRemove = (questionID: string) => {
    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this bookmarked question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeBookmark(questionID);
            setBookmarks((prev) => prev.filter((b) => b.questionID !== questionID));
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: studentColors.orange }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Pressable
          onPress={() => {
            const backRoute = origin === 'profile' ? '/(auth)/(student)/insights' : '/(auth)/(student)/dashboard';
            router.replace(backRoute);
          }}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white">My Bookmarks</Text>
      </View>

      {/* White sheet */}
      <View
        className="flex-1 rounded-t-[32px] bg-white px-5 pt-6"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <CapsActivityIndicator size="large" color={studentColors.orange} />
            <Text className="mt-4 text-base text-gray-400">Loading bookmarks...</Text>
          </View>
        ) : bookmarks.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="bookmark-outline" size={56} color={studentColors.border} />
            <Text className="mt-4 text-center text-lg font-semibold text-gray-800">
              No Bookmarks Yet
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-400">
              Bookmark questions during practice exams to review them here.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-4 text-sm text-gray-400">
              {bookmarks.length} bookmarked question{bookmarks.length !== 1 ? 's' : ''}
            </Text>
            {bookmarks.map((item) => {
              const isExpanded = expandedId === item.questionID;
              return (
                <Pressable
                  key={item.questionID}
                  onPress={() =>
                    setExpandedId(isExpanded ? null : item.questionID)
                  }
                  className="mb-3 rounded-2xl border p-4"
                  style={{ borderColor: studentColors.border }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <Text
                        className="text-sm font-semibold text-gray-800"
                        numberOfLines={isExpanded ? undefined : 2}
                      >
                        {item.questionText || 'Untitled Question'}
                      </Text>
                      {isExpanded && Array.isArray(item.choices) && item.choices.length > 0 ? (
                        <View className="mt-3 gap-2">
                          {item.choices.map((choice, index) => (
                            <View
                              key={choice.choiceID || `${item.questionID}-${index}`}
                              className="rounded-xl border px-3 py-2"
                              style={{ borderColor: studentColors.border, backgroundColor: studentColors.surfaceSoft }}
                            >
                              <View className="flex-row items-start">
                                <Text className="mr-2 text-sm font-semibold text-gray-700">
                                  {String.fromCharCode(65 + index)}.
                                </Text>
                                <Text className="flex-1 text-sm text-gray-700">
                                  {choice.choiceText || 'No choice text'}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      <View
                        className="mt-2 self-start rounded-full px-2.5 py-1"
                        style={{ backgroundColor: studentColors.surface }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: studentColors.orange }}
                        >
                          {item.subjectName || 'Unknown Subject'}
                        </Text>
                        {item.origin ? (
                          <Text
                            className="text-[11px] mt-1"
                            style={{ color: studentColors.textSoft }}
                          >
                            From: {item.origin}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleRemove(item.questionID)}
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: studentColors.pink }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
