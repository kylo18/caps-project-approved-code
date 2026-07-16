// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Hero decoration background layer for student screens.
//          Contains decorative circles and dots used in dashboard hero.
// ─────────────────────────────────────────────────────────────────────────────

import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export function StudentHeroDecoration({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <View style={[styles.heroCircle, { top: -82, left: -78 }]} />
      <View style={[styles.heroCircle, { top: -34, right: -88, width: 200, height: 200, borderRadius: 100 }]} />
      <View style={[styles.heroDot, { top: 92, left: 88 }]} />
      <View style={[styles.heroDot, { top: 118, right: 76, width: 18, height: 18, borderRadius: 9 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  heroCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});