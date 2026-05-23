import React, { useRef, useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { shareLeaderboardAchievement } from '../../../services/shareService';
import { getStudentColors, getStudentShadow } from './studentTokens';
import { useTheme } from '../../../contexts/ThemeContext';
import { StudentAvatar } from './StudentAvatar';

interface LeaderboardShareModalProps {
  visible: boolean;
  onClose: () => void;
  rank: number;
  score: number;
  studentName: string;
  subjectName?: string | null;
  period: 'weekly' | 'all_time';
}

export function LeaderboardShareModal({
  visible,
  onClose,
  rank,
  score,
  studentName,
  subjectName,
  period,
}: LeaderboardShareModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  
  const viewShotRef = useRef<any>(null);
  const [sharing, setSharing] = useState(false);

  // Set the medal color based on rank
  const medalColor = 
    rank === 1 ? '#FFD52F' // Gold
    : rank === 2 ? '#BFC0C8' // Silver
    : rank === 3 ? '#D89548' // Bronze
    : '#FE6902'; // Brand Orange

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (viewShotRef.current?.capture) {
        // Capture the card element inside the ViewShot
        const uri = await viewShotRef.current.capture();
        
        // Share the generated image path
        await shareLeaderboardAchievement({
          rank,
          score,
          points: score,
          subjectName,
          imageUri: uri,
        });
      }
    } catch (error) {
      console.error('Failed to capture and share achievement card:', error);
    } finally {
      setSharing(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.card, ...shadow }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Share Achievement</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSoft} />
            </Pressable>
          </View>

          {/* ViewShot Container to capture the Card */}
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1.0 }}
            style={styles.cardContainer}
          >
            <LinearGradient
              colors={['#1E1B4B', '#311042']}
              style={styles.achievementCard}
            >
              {/* Card Inner Border — fills edge to edge */}
              <View style={[styles.cardInnerBorder, { borderColor: `${medalColor}55` }]}>

                {/* Header branding */}
                <View style={styles.cardHeader}>
                  <Ionicons name="school" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.cardHeaderText}>CAPS</Text>
                </View>

                {/* Trophy / Ribbon visual */}
                <View style={styles.trophyContainer}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
                    style={styles.trophyGlow}
                  >
                    <Ionicons 
                      name={rank <= 3 ? 'trophy' : 'medal'} 
                      size={68} 
                      color={medalColor} 
                    />
                  </LinearGradient>
                </View>

                {/* Student Info */}
                <View style={styles.studentInfo}>
                  <Text style={styles.achievementTitle}>LEADERBOARD</Text>
                  <Text 
                    style={styles.studentName} 
                    numberOfLines={2} 
                    adjustsFontSizeToFit 
                    minimumFontScale={0.6}
                  >
                    {studentName}
                  </Text>
                  <Text style={styles.subjectText} numberOfLines={1}>
                    {subjectName ? `${subjectName}` : `Overall ${period === 'weekly' ? 'Weekly' : 'All-Time'}`}
                  </Text>
                </View>

                {/* Achievements row */}
                <View style={styles.statsRow}>
                  <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                    <Text style={styles.statLabel}>RANK</Text>
                    <Text style={[styles.statValue, { color: medalColor }]}>#{rank}</Text>
                  </View>
                  <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                    <Text style={styles.statLabel}>POINTS</Text>
                    <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{score} PTS</Text>
                  </View>
                </View>

                {/* Watermark — inside border with enough bottom padding */}
                <View style={styles.cardFooter}>
                  <Text style={styles.watermarkText}>Join me &amp; test your skills on CAPS</Text>
                </View>

              </View>
            </LinearGradient>
          </ViewShot>

          {/* Action buttons */}
          <View style={styles.actions}>
            {/* Share Pill Button */}
            <TouchableOpacity
              onPress={handleShare}
              disabled={sharing}
              activeOpacity={0.75}
              style={{
                width: '100%',
                height: 54,
                borderRadius: 999,
                backgroundColor: colors.orange,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#FE6902',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 6,
                opacity: sharing ? 0.75 : 1,
              }}
            >
              {sharing ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.shareButtonText}>Sharing...</Text>
                </>
              ) : (
                <>
                  <View style={styles.shareIconBadge}>
                    <Ionicons name="share-social" size={18} color={colors.orange} />
                  </View>
                  <Text style={styles.shareButtonText}>Share Card Image</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Pill Button */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: colors.border,
                backgroundColor: 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.textSoft} style={{ marginRight: 6 }} />
              <Text style={[styles.cancelButtonText, { color: colors.textSoft }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Rubik',
    flex: 1,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    width: 290,
    height: 390,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  achievementCard: {
    flex: 1,
    padding: 0,
  },
  cardInnerBorder: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 16,
    paddingBottom: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Rubik',
  },
  trophyContainer: {
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  studentInfo: {
    alignItems: 'center',
    width: '100%',
  },
  achievementTitle: {
    color: '#FE6902',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: 'Rubik',
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Rubik',
    width: '90%',
  },
  subjectText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Rubik',
    width: '90%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginVertical: 14,
  },
  statBadge: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
    fontFamily: 'Rubik',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Rubik',
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 6,
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontFamily: 'Rubik',
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 18,
  },
  shareButton: {
    width: '100%',
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FE6902',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  shareIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Rubik',
    letterSpacing: 0.3,
  },
  cancelButton: {
    width: '100%',
    height: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Rubik',
  },
});
