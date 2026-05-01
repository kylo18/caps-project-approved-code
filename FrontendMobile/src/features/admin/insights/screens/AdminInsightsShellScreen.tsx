import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MobileHeader from '../../../../features/core/components/MobileHeader';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useScreenFloatingTools } from '../../shared/hooks/useScreenFloatingTools';

type InsightsRole = 'dean' | 'associate-dean' | 'program-chair' | 'faculty';

type Props = {
  role: InsightsRole;
};

type HubCard = {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
};

const ROLE_CONTENT: Record<
  InsightsRole,
  {
    title: string;
    subtitle: string;
    cards: HubCard[];
  }
> = {
  dean: {
    title: 'Insights',
    subtitle: 'Centralize the merged enhancement workspace, reports, support, and export shortcuts.',
    cards: [
      {
        key: 'analytics',
        title: 'Analytics Overview',
        description: 'Open the merged workspace directly on the analytics tab.',
        icon: 'analytics-outline',
        color: '#8B5CF6',
        route: '/(auth)/(dean)/analytics',
      },
      {
        key: 'enhancement',
        title: 'Student Enhancement',
        description: 'Open the merged enhancement workspace on the overview tab.',
        icon: 'trending-up-outline',
        color: '#10B981',
        route: '/(auth)/(dean)/enhancement',
      },
      {
        key: 'reports',
        title: 'Reports Hub',
        description: 'See recent takers, leaderboard data, and user-submitted reports.',
        icon: 'document-text-outline',
        color: '#FE6902',
        route: '/(auth)/(dean)/reports',
      },
      {
        key: 'support',
        title: 'Support Queue',
        description: 'Manage support tickets and respond to escalations.',
        icon: 'headset-outline',
        color: '#EF4444',
        route: '/(auth)/(dean)/support',
      },
      {
        key: 'export',
        title: 'Export & Print',
        description: 'Jump to subjects to prepare print and exam export flows.',
        icon: 'print-outline',
        color: '#3B82F6',
        route: '/(auth)/(dean)/subjects',
      },
    ],
  },
  'associate-dean': {
    title: 'Insights',
    subtitle: 'Keep the merged enhancement workspace, reports, and export shortcuts in one role-aware hub.',
    cards: [
      {
        key: 'analytics',
        title: 'Analytics Overview',
        description: 'Open the merged workspace directly on the analytics tab.',
        icon: 'analytics-outline',
        color: '#8B5CF6',
        route: '/(auth)/(associate-dean)/analytics',
      },
      {
        key: 'enhancement',
        title: 'Student Enhancement',
        description: 'Open the merged enhancement workspace on the overview tab.',
        icon: 'trending-up-outline',
        color: '#10B981',
        route: '/(auth)/(associate-dean)/enhancement',
      },
      {
        key: 'reports',
        title: 'Reports Hub',
        description: 'Open recent takers, leaderboard, and grouped user reports.',
        icon: 'document-text-outline',
        color: '#FE6902',
        route: '/(auth)/(associate-dean)/reports',
      },
      {
        key: 'export',
        title: 'Export & Print',
        description: 'Jump to subjects for print and export workflows.',
        icon: 'print-outline',
        color: '#8B5CF6',
        route: '/(auth)/(associate-dean)/subjects',
      },
      {
        key: 'classes',
        title: 'Classes',
        description: 'Open class management and archived class tools.',
        icon: 'layers-outline',
        color: '#3B82F6',
        route: '/(auth)/(associate-dean)/classes',
      },
    ],
  },
  'program-chair': {
    title: 'Insights',
    subtitle: 'Bring together reports, export, classes, and subject oversight for program leads.',
    cards: [
      {
        key: 'reports',
        title: 'Reports Hub',
        description: 'Monitor recent takers, leaderboard movement, and user reports.',
        icon: 'document-text-outline',
        color: '#FE6902',
        route: '/(auth)/(program-chair)/reports',
      },
      {
        key: 'export',
        title: 'Export & Print',
        description: 'Use the subject workflow to prepare generated exam exports.',
        icon: 'print-outline',
        color: '#8B5CF6',
        route: '/(auth)/(program-chair)/subjects',
      },
      {
        key: 'classes',
        title: 'Classes',
        description: 'Open classes and archived class management.',
        icon: 'layers-outline',
        color: '#10B981',
        route: '/(auth)/(program-chair)/classes',
      },
      {
        key: 'subjects',
        title: 'Subjects',
        description: 'Review subject lists, question banks, and print-ready content.',
        icon: 'book-outline',
        color: '#3B82F6',
        route: '/(auth)/(program-chair)/subjects',
      },
    ],
  },
  faculty: {
    title: 'Insights',
    subtitle: 'Keep reports and teaching shortcuts in a single mobile workspace.',
    cards: [
      {
        key: 'reports',
        title: 'Reports Hub',
        description: 'Check recent takers, leaderboard summaries, and support reports.',
        icon: 'document-text-outline',
        color: '#FE6902',
        route: '/(auth)/(faculty)/reports',
      },
      {
        key: 'classes',
        title: 'My Classes',
        description: 'Jump into class-level management and assigned sections.',
        icon: 'layers-outline',
        color: '#10B981',
        route: '/(auth)/(faculty)/classes',
      },
      {
        key: 'subjects',
        title: 'My Subjects',
        description: 'Review assigned subjects and related teaching content.',
        icon: 'book-outline',
        color: '#3B82F6',
        route: '/(auth)/(faculty)/subjects',
      },
      {
        key: 'create-quiz',
        title: 'Create Quiz',
        description: 'Go directly to quiz creation and question authoring.',
        icon: 'create-outline',
        color: '#8B5CF6',
        route: '/(auth)/practice-exam/add-question',
      },
    ],
  },
};

function InsightCard({
  card,
  isDark,
  onPress,
}: {
  card: HubCard;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={card.title}
      accessibilityHint={card.description}
      style={({ pressed }) => ({
        borderRadius: 28,
        padding: 18,
        backgroundColor: isDark ? '#111827' : '#FFFFFF',
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        borderWidth: 1,
        borderColor: isDark ? '#1F2937' : '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.18 : 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      })}
    >
      <View className="flex-row items-start justify-between">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: `${card.color}20`, borderWidth: 1, borderColor: `${card.color}30` }}
        >
          <Ionicons name={card.icon} size={24} color={card.color} />
        </View>
        <Ionicons name="chevron-forward" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
      </View>
      <Text className="text-[17px] font-bold mt-4" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
        {card.title}
      </Text>
      <Text className="text-[13px] mt-2 leading-5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
        {card.description}
      </Text>
    </Pressable>
  );
}

export default function AdminInsightsShellScreen({ role }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const content = ROLE_CONTENT[role];

  const fabActions = useMemo(
    () =>
      content.cards.slice(0, 4).map((card) => ({
        key: `insight-${card.key}`,
        icon: card.icon,
        label: card.title,
        onPress: () => router.push(card.route as string),
        backgroundColor: card.color,
      })),
    [content.cards, router]
  );

  useScreenFloatingTools(fabActions);

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <MobileHeader title={content.title} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="text-[24px] font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            {content.title} Hub
          </Text>
          <Text className="text-[13px] mt-2 leading-5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            {content.subtitle}
          </Text>
        </View>

        <View className="gap-4">
          {content.cards.map((card) => (
            <InsightCard
              key={card.key}
              card={card}
              isDark={isDark}
              onPress={() => router.push(card.route as string)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
