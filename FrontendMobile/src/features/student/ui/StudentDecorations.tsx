// ─────────────────────────────────────────────────────────────────────────────
// StudentHeroDecoration — decorative circles/dots for the student hero section.
// Uses pure NativeWind styling — no mixed className + StyleSheet pattern.
// ─────────────────────────────────────────────────────────────────────────────

import { View } from 'react-native';

export function StudentHeroDecoration({ style }: { style?: object }) {
  return (
    <View pointerEvents="none" className="absolute inset-0" style={style}>
      {/* Large decorative circle — top-left */}
      <View className="absolute" style={{ top: -82, left: -78 }}>
        <View className="w-[200px] h-[200px] rounded-full border border-white/10" />
      </View>
      {/* Large decorative circle — top-right */}
      <View className="absolute" style={{ top: -34, right: -88 }}>
        <View className="w-[200px] h-[200px] rounded-full border border-white/10" />
      </View>
      {/* Small dot — mid-left */}
      <View className="absolute w-3.5 h-3.5 rounded-full bg-white/10" style={{ top: 92, left: 88 }} />
      {/* Small dot — mid-right (slightly larger) */}
      <View className="absolute bg-white/10" style={{ top: 118, right: 76, width: 18, height: 18, borderRadius: 9 }} />
    </View>
  );
}