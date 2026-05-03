import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = 'student_bookmarks';
const MAX_BOOKMARKS = 200;

export interface BookmarkItem {
  questionID: string;
  questionText: string;
  questionImage: string | null;
  subjectID: string | number;
  subjectName: string;
  origin?: string;
  bookmarkedAt: number; // Unix timestamp in ms — added by this service
  choices?: Array<{
    choiceID: string;
    choiceText: string;
    choiceImage?: string | null;
    // isCorrect is intentionally OMITTED when storing — never persist answer keys to device
  }>;
}

/**
 * Strip isCorrect from choices so the answer key is never written to disk.
 */
function sanitizeChoices(
  choices?: Array<{ choiceID: string; choiceText: string; choiceImage?: string | null; isCorrect?: boolean }>
): BookmarkItem['choices'] {
  if (!choices) return [];
  return choices.map(({ choiceID, choiceText, choiceImage }) => ({
    choiceID,
    choiceText,
    choiceImage,
    // isCorrect is deliberately excluded — security boundary
  }));
}

/**
 * Get all bookmarked questions, sorted newest-first.
 * On read, silently removes any entries with malformed data.
 */
export async function getBookmarks(): Promise<BookmarkItem[]> {
  try {
    const json = await AsyncStorage.getItem(BOOKMARKS_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is BookmarkItem =>
        typeof item?.questionID === 'string' && typeof item?.bookmarkedAt === 'number'
      )
      .sort((a, b) => b.bookmarkedAt - a.bookmarkedAt); // newest first
  } catch {
    return [];
  }
}

/**
 * Add a question to bookmarks. Avoids duplicates.
 * Enforces MAX_BOOKMARKS by evicting the oldest entry when the cap is reached.
 * Answer keys (isCorrect) are stripped before storage.
 */
export async function addBookmark(item: Omit<BookmarkItem, 'bookmarkedAt'>): Promise<void> {
  const bookmarks = await getBookmarks();
  const exists = bookmarks.some((b) => b.questionID === item.questionID);
  if (exists) return;

  // Sanitize — remove answer key
  const sanitized: BookmarkItem = {
    ...item,
    choices: sanitizeChoices(item.choices),
    bookmarkedAt: Date.now(),
  };

  bookmarks.unshift(sanitized); // newest first (prepend)

  // Enforce cap: evict oldest if over limit
  if (bookmarks.length > MAX_BOOKMARKS) {
    bookmarks.splice(MAX_BOOKMARKS); // remove everything after index 200
  }

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

/**
 * Clear all bookmarks from storage.
 */
export async function clearAllBookmarks(): Promise<void> {
  await AsyncStorage.removeItem(BOOKMARKS_KEY);
}