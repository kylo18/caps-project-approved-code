import { View } from 'react-native';
import { useRouter } from 'expo-router';
import RoleProfileScreen from '../../../src/features/profile/screens/RoleProfileScreen';
import { useScreenFloatingTools } from '../../../src/hooks/useScreenFloatingTools';

export default function DeanProfileScreen() {
  const router = useRouter();

  useScreenFloatingTools([
    {
      key: 'announcement',
      icon: 'megaphone-outline',
      label: 'Announcement',
      onPress: () => router.push('/(auth)/(dean)/create-announcement'),
    },
    {
      key: 'support',
      icon: 'headset-outline',
      label: 'Support',
      onPress: () => router.push('/(auth)/(dean)/support'),
    },
  ]);

  return (
    <View className="flex-1">
      <RoleProfileScreen roleLabel="Dean" />
    </View>
  );
}
