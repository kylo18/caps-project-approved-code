import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MobileHeader from '../../../../features/core/components/MobileHeader';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useScreenFloatingTools } from '../../shared/hooks/useScreenFloatingTools';
import PrintExamModal from '../../../practice/components/PrintExamModal';

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
    subtitle: 'Centralize workspace analytics, reports, support, and export shortcuts.',
    cards: [
      {
        key: 'analytics',
        title: 'Analytics Overview',
        description: 'Open the merged workspace directly on the analytics tab.',
        icon: 'trending-up-outline',
        color: '#8B5CF6',
        route: '/(auth)/(dean)/analytics',
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
    subtitle: 'Keep workspace analytics, reports, and export shortcuts in one role-aware hub.',
    cards: [
      {
        key: 'analytics',
        title: 'Analytics Overview',
        description: 'Open the merged workspace directly on the analytics tab.',
        icon: 'trending-up-outline',
        color: '#8B5CF6',
        route: '/(auth)/(associate-dean)/analytics',
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
        key: 'export',
        title: 'Export & Print',
        description: 'Generate and export exam PDFs for printing.',
        icon: 'print-outline',
        color: '#8B5CF6',
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

// ─── Card shadow ──────────────────────────────────────────────────────────────
function cardShadow(isDark: boolean) {
  return Platform.select({
    android: { elevation: isDark ? 6 : 4 },
    default: {
      shadowColor: isDark ? '#000000' : '#062B2D',
      shadowOffset: { width: 0, height: isDark ? 8 : 6 },
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowRadius: 16,
    },
  });
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function InsightCard({
  card,
  isDark,
  onPress,
}: {
  card: HubCard;
  isDark: boolean;
  onPress: () => void;
}) {
  const borderColor = isDark ? '#2A2A2A' : '#EFEEFC';
  const bgColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const pressedBg = isDark ? '#242424' : '#FFF1E9';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={card.title}
      accessibilityHint={card.description}
      style={({ pressed }) => ({
        borderRadius: 22,
        borderWidth: 2,
        borderColor: borderColor,
        backgroundColor: pressed ? pressedBg : bgColor,
        paddingHorizontal: 16,
        paddingVertical: 14,
        ...cardShadow(isDark),
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: isDark ? `${card.color}33` : `${card.color}18`,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name={card.icon} size={22} color={card.color} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: isDark ? '#F5F5F5' : '#0C092A',
              lineHeight: 22,
            }}
            numberOfLines={1}
          >
            {card.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '400',
              color: isDark ? '#9CA3AF' : '#858494',
              lineHeight: 18,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {card.description}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={isDark ? '#9CA3AF' : '#858494'}
          style={{ flexShrink: 0 }}
        />
      </View>
    </Pressable>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
type SectionProps = {
  label: string;
  cards: HubCard[];
  isDark: boolean;
  onCardPress: (route: string, key: string) => void;
};

function HubSection({ label, cards, isDark, onCardPress }: SectionProps) {
  if (cards.length === 0) return null;

  return (
    <View style={{ marginBottom: 20, marginHorizontal: 16 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: isDark ? '#9CA3AF' : '#6B7280',
            letterSpacing: 0.9,
            textTransform: 'uppercase',
            paddingHorizontal: 4,
            marginBottom: 10,
          }}
        >
        {label}
      </Text>

      <View style={{ gap: 10 }}>
        {cards.map(card => (
          <InsightCard
            key={card.key}
            card={card}
            isDark={isDark}
            onPress={() => onCardPress(card.route, card.key)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AdminInsightsShellScreen({ role }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const content = ROLE_CONTENT[role];
  const [showPrintModal, setShowPrintModal] = useState(false);

  // ── Section bucketing ──────────────────────────────────────────────────────
  const workspaceCards = useMemo(
    () => content.cards.filter(c => ['analytics', 'enhancement'].includes(c.key)),
    [content.cards]
  );
  const dataCards = useMemo(
    () => content.cards.filter(c => ['reports', 'support'].includes(c.key)),
    [content.cards]
  );
  const toolCards = useMemo(
    () => content.cards.filter(c => !['analytics', 'enhancement', 'reports', 'support'].includes(c.key)),
    [content.cards]
  );

  // ── FAB ────────────────────────────────────────────────────────────────────
  const fabActions = useMemo(
    () =>
      content.cards.slice(0, 4).map(card => ({
        key: `insight-${card.key}`,
        icon: card.icon,
        label: card.title,
        onPress: card.key === 'export'
          ? () => setShowPrintModal(true)
          : () => router.push(card.route as string),
        backgroundColor: card.color,
      })),
    [content.cards, router, setShowPrintModal]
  );

  useScreenFloatingTools(fabActions);

  const handleCardPress = (route: string, key: string) => {
    if (key === 'export') {
      setShowPrintModal(true);
    } else {
      router.push(route as any);
    }
  };

  return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#0F0F0F' : '#F4F5F7' }}>
      <MobileHeader title={content.title} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={{ marginBottom: 24, paddingHorizontal: 20 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '700',
                color: isDark ? '#F5F5F5' : '#111318',
                letterSpacing: -0.5,
                marginBottom: 6,
                lineHeight: 32,
              }}
            >
              Insights Hub
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? '#9CA3AF' : '#6B7280',
                lineHeight: 21,
                maxWidth: 320,
              }}
            >
              {content.subtitle}
            </Text>
        </View>

        {/* Sections */}
        <HubSection
          label="Workspace"
          cards={workspaceCards}
          isDark={isDark}
          onCardPress={(route, key) => handleCardPress(route, key)}
        />
        <HubSection
          label="Data & Support"
          cards={dataCards}
          isDark={isDark}
          onCardPress={(route, key) => handleCardPress(route, key)}
        />
        <HubSection
          label="Tools"
          cards={toolCards}
          isDark={isDark}
          onCardPress={(route, key) => handleCardPress(route, key)}
        />
      </ScrollView>

      <PrintExamModal visible={showPrintModal} onClose={() => setShowPrintModal(false)} />
    </View>
  );
}
