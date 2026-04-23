import { StyleProp, View, ViewStyle } from 'react-native';
import AnimatedCapsLoader from './AnimatedCapsLoader';

type CapsActivityIndicatorProps = {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

function mapSize(size: CapsActivityIndicatorProps['size']): 'sm' | 'md' | 'lg' {
  if (size === 'small') return 'sm';
  if (size === 'large') return 'lg';

  if (typeof size === 'number') {
    if (size <= 18) return 'sm';
    if (size >= 32) return 'lg';
  }

  return 'md';
}

export default function CapsActivityIndicator({
  size = 'small',
  color = '#FE6902',
  style,
  className,
}: CapsActivityIndicatorProps) {
  return (
    <View className={className} style={style}>
      <AnimatedCapsLoader size={mapSize(size)} color={color} accentColor="#FE6902" />
    </View>
  );
}
