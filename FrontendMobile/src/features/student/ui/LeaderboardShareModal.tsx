import React, { useRef, useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { shareLeaderboardAchievement } from '../../../services/shareService';
import { getStudentColors, getStudentShadow } from './studentTokens';
import { useTheme } from '../../../contexts/ThemeContext';

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
}: LeaderboardShareModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getStudentColors(isDark);
  const shadow = getStudentShadow(isDark);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(290, Math.max(248, width - 64));
  const cardHeight = Math.round(cardWidth * (1142 / 870));
  
  const viewShotRef = useRef<any>(null);
  const [sharing, setSharing] = useState(false);

  const accentColor = '#E95D0A';
  const displayName = studentName.trim().toUpperCase() || 'CAPS STUDENT';
  const displaySubject = subjectName?.trim() || 'Overall Status';

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
            style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}
          >
            <LinearGradient
              colors={['#F1C45D', '#F5A044', '#F18D35']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.achievementCard}
            >
              <View style={styles.cardInnerBorder}>
                <View style={styles.cardHeader}>
                  <Ionicons name="school" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                  <Text style={styles.cardHeaderText}>CAPS</Text>
                </View>

                <View style={styles.trophyContainer}>
                  <View style={styles.trophyGlow}>
                    <Ionicons name="ribbon" size={72} color={accentColor} />
                  </View>
                </View>

                <View style={styles.studentInfo}>
                  <Text style={styles.achievementTitle}>LEADERBOARD STAR</Text>
                  <Text 
                    style={styles.studentName} 
                    numberOfLines={2} 
                    adjustsFontSizeToFit 
                    minimumFontScale={0.6}
                  >
                    {displayName}
                  </Text>
                  <Text style={styles.subjectText} numberOfLines={1}>
                    {displaySubject}
                  </Text>
                </View>

                <View style={styles.bottomContent}>
                  <View style={styles.statsRow}>
                    <View style={styles.statBadge}>
                      <Text style={styles.statLabel}>RANK</Text>
                      <Text
                        style={[styles.statValue, { color: accentColor }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.72}
                      >
                        #{rank}
                      </Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Text style={styles.statLabel}>POINTS</Text>
                      <Text
                        style={[styles.statValue, styles.pointsValue]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.72}
                      >
                        {score} PTS
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={styles.cardFooterText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    Join me &amp; test your skills on CAPS
                  </Text>
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
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    padding: 16,
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
    borderRadius: 18,
    overflow: 'hidden',
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
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Rubik',
  },
  trophyContainer: {
    marginTop: 6,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyGlow: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  studentInfo: {
    alignItems: 'center',
    width: '100%',
  },
  achievementTitle: {
    color: '#C95B1E',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Rubik',
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: 'Rubik',
    width: '100%',
  },
  subjectText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Rubik',
    width: '100%',
  },
  bottomContent: {
    width: '100%',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
    marginTop: 10,
  },
  statBadge: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Rubik',
  },
  statValue: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    fontFamily: 'Rubik',
  },
  pointsValue: {
    color: '#FFFFFF',
  },
  cardFooterText: {
    width: '100%',
    color: 'rgba(255, 255, 255, 0.76)',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Rubik',
    marginTop: 12,
    textAlign: 'center',
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
