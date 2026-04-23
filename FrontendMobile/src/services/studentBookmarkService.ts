import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = 'student_bookmarks';

export interface BookmarkItem {
  questionID: string;
  questionText: string;
  questionImage: string | null;
  subjectID: string | number;
  subjectName: string;
  origin?: string;
  choices?: Array<{
    choiceID: string;
    choiceText: string;
    choiceImage?: string | null;
    isCorrect?: boolean;
  }>;
}

/**
 * Get all bookmarked questions from AsyncStorage.
 */
export async function getBookmarks(): Promise<BookmarkItem[]> {
  try {
    const json = await AsyncStorage.getItem(BOOKMARKS_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      choices: Array.isArray(item?.choices) ? item.choices : [],
    })) as BookmarkItem[];
  } catch {
    return [];
  }
}

/**
 * Add a question to bookmarks. Avoids duplicates.
 */
export async function addBookmark(item: BookmarkItem): Promise<void> {
  const bookmarks = await getBookmarks();
  const exists = bookmarks.some((b) => b.questionID === item.questionID);
  if (exists) return;
  bookmarks.push(item);
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

/**
 * Remove a question from bookmarks by questionID.
 */
export async function removeBookmark(questionID: string): Promise<void> {
  const bookmarks = await getBookmarks();
  const filtered = bookmarks.filter((b) => b.questionID !== questionID);
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
}

/**
 * Check if a question is bookmarked.
 */
export async function isBookmarked(questionID: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  return bookmarks.some((b) => b.questionID === questionID);
}
