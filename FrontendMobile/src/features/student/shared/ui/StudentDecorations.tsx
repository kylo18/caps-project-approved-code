// ─────────────────────────────────────────────────────────────────────────────
// StudentHeroDecoration — decorative circles/dots for the student hero section.
// Exported from StudentUI as-is.
// ─────────────────────────────────────────────────────────────────────────────

import { StyleSheet, View } from 'react-native';

export function StudentHeroDecoration({ style }: { style?: object }) {
  return (
    <View pointerEvents="none" className="absolute inset-0" style={style}>
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